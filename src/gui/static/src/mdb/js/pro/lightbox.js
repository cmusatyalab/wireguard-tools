import { element, typeCheckConfig, isRTL } from '../mdb/util/index';
import Data from '../mdb/dom/data';
import EventHandler from '../mdb/dom/event-handler';
import Manipulator from '../mdb/dom/manipulator';
import SelectorEngine from '../mdb/dom/selector-engine';
import BaseComponent from '../free/base-component';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'lightbox';
const DATA_KEY = 'mdb.lightbox';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;

const CLASSNAME_LIGHTBOX = 'lightbox';
const CLASSNAME_GALLERY = 'lightbox-gallery';

const CLASSNAME_TOOLBAR = 'lightbox-gallery-toolbar';
const CLASSNAME_GALLERY_CONTENT = 'lightbox-gallery-content';
const CLASSNAME_COUNTER = 'lightbox-gallery-counter';
const CLASSNAME_FULLSCREEN_BTN = 'lightbox-gallery-fullscreen-btn';
const CLASSNAME_ZOOM_BTN = 'lightbox-gallery-zoom-btn';
const CLASSNAME_LEFT_TOOLS = 'lightbox-gallery-left-tools';
const CLASSNAME_RIGHT_TOOLS = 'lightbox-gallery-right-tools';
const CLASSNAME_CLOSE_BTN = 'lightbox-gallery-close-btn';
const CLASSNAME_LOADER = 'lightbox-gallery-loader';
const CLASSNAME_ARROW_LEFT = 'lightbox-gallery-arrow-left';
const CLASSNAME_ARROW_RIGHT = 'lightbox-gallery-arrow-right';
const CLASSNAME_CAPTION_WRAPPER = 'lightbox-gallery-caption-wrapper';
const CLASSNAME_CAPTION = 'lightbox-gallery-caption';
const CLASSNAME_IMG = 'lightbox-gallery-image';

const SELECTOR_TOGGLE = `[data-mdb-${NAME}-init] img:not(.lightbox-disabled)`;

const OPTIONS_TYPE = {
  container: 'string',
  zoomLevel: '(number|string)',
};

const DEFAULT_OPTIONS = {
  container: 'body',
  zoomLevel: 1,
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Lightbox extends BaseComponent {
  constructor(element, options = {}) {
    super(element);

    this._options = options;
    this._getContainer();

    this._id = `lightbox-${Math.random().toString(36).substr(2, 9)}`;
    this._activeImg = 0;
    this._images = [];
    this._zoom = 1;
    this._gallery = null;
    this._galleryToolbar = null;
    this._galleryContent = null;
    this._loader = null;
    this._imgCounter = null;
    this._animating = false;
    this._fullscreen = false;
    this._zoomBtn = null;
    this._fullscreenBtn = null;
    this._toolsToggleTimer = 0;
    this._mousedown = false;
    this._mousedownPositionX = 0;
    this._mousedownPositionY = 0;
    this._originalPositionX = 0;
    this._originalPositionY = 0;
    this._positionX = 0;
    this._positionY = 0;
    this._zoomTimer = 0;
    this._tapCounter = 0;
    this._tapTime = 0;
    this._rightArrow = null;
    this._leftArrowWrapper = null;
    this._rightArrowWrapper = null;
    this._initiated = false;
    this._multitouch = false;
    this._touchZoomPosition = [];

    if (this._element) {
      this.init();
      Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
      bindCallbackEventsIfNeeded(this.constructor);
    }
  }

  // Getters
  static get NAME() {
    return NAME;
  }

  get activeImg() {
    return this._activeImg;
  }

  get currentImg() {
    return SelectorEngine.findOne('.active', this._galleryContent);
  }

  get options() {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...this._options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  // Public
  init() {
    if (this._initiated) {
      return;
    }

    this._appendTemplate();
    this._initiated = true;
  }

  open(target = 0) {
    this._getImages();
    this._setActiveImg(target);
    this._sortImages();
    this._triggerEvents('open', 'opened');

    this._loadImages().then((images) => {
      this._resizeImages(images);
      this._toggleTemplate();
      this._addEvents();
      this._focusFullscreenBtn();
    });
  }

  close() {
    this.reset();
    this._removeEvents();
    this._toggleTemplate();
    this._triggerEvents('close', 'closed');
  }

  slide(target = 'right') {
    if (this._animating === true || this._images.length <= 1) return;
    this._triggerEvents('slide', 'slid');

    this._beforeSlideEvents();
    if (target === 'right') this._slideHorizontally(target);
    if (target === 'left') this._slideHorizontally(target);
    if (target === 'first') this._slideToTarget(target);
    if (target === 'last') this._slideToTarget(target);
    this._afterSlideEvents();
  }

  zoomIn() {
    if (this._zoom >= 3) return;
    this._triggerEvents('zoomIn', 'zoomedIn');
    this._zoom += parseFloat(this.options.zoomLevel);
    Manipulator.style(this.currentImg.parentNode, { transform: `scale(${this._zoom})` });

    this._updateZoomBtn();
  }

  zoomOut() {
    if (this._zoom <= 1) return;
    this._triggerEvents('zoomOut', 'zoomedOut');
    this._zoom -= parseFloat(this.options.zoomLevel);
    Manipulator.style(this.currentImg.parentNode, { transform: `scale(${this._zoom})` });

    this._updateZoomBtn();
    this._updateImgPosition();
  }

  toggleFullscreen() {
    if (this._fullscreen === false) {
      Manipulator.addClass(this._fullscreenBtn, 'active');
      if (this._gallery.requestFullscreen) {
        this._gallery.requestFullscreen();
      }

      this._fullscreen = true;
    } else {
      Manipulator.removeClass(this._fullscreenBtn, 'active');
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }

      this._fullscreen = false;
    }
  }

  reset() {
    this._restoreDefaultFullscreen();
    this._restoreDefaultPosition();
    this._restoreDefaultZoom();
    clearTimeout(this._toolsToggleTimer);
    clearTimeout(this._doubleTapTimer);
  }

  dispose() {
    EventHandler.off(document, EVENT_CLICK_DATA_API, SELECTOR_TOGGLE, this.toggle);
    if (this._galleryContent) this._removeEvents();
    if (this._gallery) this._gallery.remove();

    Data.removeData(this._element, DATA_KEY);
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);
    this._element = null;
  }

  // Private
  _getImages() {
    const allImages = SelectorEngine.find('img', this._element);
    const lightboxImages = allImages.filter((image) => {
      return !image.classList.contains('lightbox-disabled');
    });
    this._images = lightboxImages;
  }

  _getContainer() {
    this._container = SelectorEngine.findOne(this.options.container);
  }

  _setActiveImg(target) {
    this._activeImg = typeof target === 'number' ? target : this._images.indexOf(target.target);
  }

  _appendTemplate() {
    this._gallery = element('div');
    Manipulator.addClass(this._gallery, CLASSNAME_GALLERY);
    this._element.dataset.id = this._id;
    this._gallery.id = this._id;

    this._appendLoader();
    this._appendToolbar();
    this._appendContent();
    this._appendArrows();
    this._appendCaption();
    this._container.append(this._gallery);
  }

  _appendToolbar() {
    this._galleryToolbar = element('div');
    this._imgCounter = element('p');
    this._fullscreenBtn = element('button');
    this._zoomBtn = element('button');
    const leftTools = element('div');
    const rightTools = element('div');
    const closeBtn = element('button');

    Manipulator.addClass(this._galleryToolbar, CLASSNAME_TOOLBAR);
    Manipulator.addClass(this._imgCounter, CLASSNAME_COUNTER);
    Manipulator.addClass(this._fullscreenBtn, CLASSNAME_FULLSCREEN_BTN);
    Manipulator.addClass(this._zoomBtn, CLASSNAME_ZOOM_BTN);
    Manipulator.addClass(leftTools, CLASSNAME_LEFT_TOOLS);
    Manipulator.addClass(rightTools, CLASSNAME_RIGHT_TOOLS);
    Manipulator.addClass(closeBtn, CLASSNAME_CLOSE_BTN);

    this._fullscreenBtn.setAttribute('aria-label', 'Toggle fullscreen');
    this._zoomBtn.setAttribute('aria-label', 'Zoom in');
    closeBtn.setAttribute('aria-label', 'Close');

    EventHandler.on(this._fullscreenBtn, EVENT_CLICK_DATA_API, () => this.toggleFullscreen());
    EventHandler.on(this._zoomBtn, EVENT_CLICK_DATA_API, () => this._toggleZoom());
    EventHandler.on(closeBtn, EVENT_CLICK_DATA_API, () => this.close());

    leftTools.append(this._imgCounter);
    rightTools.append(this._fullscreenBtn);
    rightTools.append(this._zoomBtn);
    rightTools.append(closeBtn);

    this._galleryToolbar.append(leftTools);
    this._galleryToolbar.append(rightTools);
    this._gallery.append(this._galleryToolbar);
  }

  _appendContent() {
    this._galleryContent = element('div');
    Manipulator.addClass(this._galleryContent, CLASSNAME_GALLERY_CONTENT);
    this._gallery.append(this._galleryContent);
  }

  _appendLoader() {
    this._loader = element('div');
    const spinner = element('div');
    const spinnerContent = element('span');

    Manipulator.addClass(this._loader, CLASSNAME_LOADER);
    Manipulator.addClass(spinner, 'spinner-grow');
    Manipulator.addClass(spinner, 'text-light');
    Manipulator.addClass(spinnerContent, 'sr-only');

    spinner.setAttribute('role', 'status');
    spinnerContent.innerHTML = 'Loading...';

    spinner.append(spinnerContent);
    this._loader.append(spinner);
    this._gallery.append(this._loader);
  }

  _appendArrows() {
    this._leftArrowWrapper = element('div');
    Manipulator.addClass(this._leftArrowWrapper, CLASSNAME_ARROW_LEFT);
    const leftArrow = element('button');
    leftArrow.setAttribute('aria-label', 'Previous');
    EventHandler.on(leftArrow, EVENT_CLICK_DATA_API, () => this.slide('left'));
    this._leftArrowWrapper.append(leftArrow);

    this._rightArrowWrapper = element('div');
    Manipulator.addClass(this._rightArrowWrapper, CLASSNAME_ARROW_RIGHT);
    this._rightArrow = element('button');
    this._rightArrow.setAttribute('aria-label', 'Next');
    EventHandler.on(this._rightArrow, EVENT_CLICK_DATA_API, () => this.slide());
    this._rightArrowWrapper.append(this._rightArrow);

    this._getImages();
    if (this._images.length <= 1) return;
    this._gallery.append(this._leftArrowWrapper);
    this._gallery.append(this._rightArrowWrapper);
  }

  _appendCaption() {
    const captionWrapper = element('div');
    const caption = element('p');

    Manipulator.addClass(captionWrapper, CLASSNAME_CAPTION_WRAPPER);
    Manipulator.addClass(caption, CLASSNAME_CAPTION);

    captionWrapper.append(caption);
    this._gallery.append(captionWrapper);
  }

  _sortImages() {
    for (let i = 0; i < this._activeImg; i++) {
      this._images.push(this._images.shift());
    }
  }

  async _loadImages() {
    const promiseArray = [];
    const imageArray = [];

    this._galleryContent.innerHTML = '';
    let positionLeft = 0;

    this._images.forEach((img, key) => {
      promiseArray.push(
        new Promise((resolve) => {
          const newImg = new Image();
          const newImgWrapper = element('div');
          Manipulator.addClass(newImgWrapper, CLASSNAME_IMG);

          this._addImgStyles(newImg, newImgWrapper, positionLeft, key, img);

          newImgWrapper.append(newImg);
          this._galleryContent.append(newImgWrapper);

          newImg.onload = resolve;
          newImg.src = img.dataset.mdbImg || img.src;
          imageArray.push(newImg);

          positionLeft += 100;
        })
      );
    });

    await Promise.all(promiseArray);
    return imageArray;
  }

  _addImgStyles(newImg, newImgWrapper, positionLeft, key, img) {
    newImg.alt = img.alt;
    newImg.draggable = false;

    Manipulator.style(newImgWrapper, { position: 'absolute', left: `${positionLeft}%`, top: 0 });
    if (img.dataset.mdbCaption || img.dataset.mdbCaption === '') {
      newImg.dataset.caption = img.dataset.mdbCaption;
    }

    if (positionLeft === 0) {
      if (newImg.width < newImg.height) Manipulator.addClass(newImg, 'vertical');
      Manipulator.style(newImgWrapper, { opacity: 1 });
      Manipulator.addClass(newImg, 'active');
    } else {
      Manipulator.removeClass(newImg, 'active');
    }

    if (key === this._images.length - 1 && this._images.length > 1) {
      Manipulator.style(newImgWrapper, { left: '-100%' });
    }
  }

  _resizeImages(images) {
    images.forEach((img) => {
      this._calculateImgSize(img);
    });
  }

  _calculateImgSize(img) {
    if (img.width >= img.height) {
      img.style.width = '100%';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.top = `${(img.parentNode.offsetHeight - img.height) / 2}px`;
      img.style.left = 0;
    } else {
      img.style.height = '100%';
      img.style.maxHeight = '100%';
      img.style.width = 'auto';
      img.style.left = `${(img.parentNode.offsetWidth - img.width) / 2}px`;
      img.style.top = 0;
    }

    if (img.width >= img.parentNode.offsetWidth) {
      img.style.width = `${img.parentNode.offsetWidth}px`;
      img.style.height = 'auto';
      img.style.left = 0;
      img.style.top = `${(img.parentNode.offsetHeight - img.height) / 2}px`;
    }
    if (img.height >= img.parentNode.offsetHeight) {
      img.style.height = `${img.parentNode.offsetHeight}px`;
      img.style.width = 'auto';
      img.style.top = 0;
      img.style.left = `${(img.parentNode.offsetWidth - img.width) / 2}px`;
    }

    this._positionX = parseFloat(img.style.left) || 0;
    this._positionY = parseFloat(img.style.top) || 0;
  }

  _onResize() {
    this._images = SelectorEngine.find('img', this._galleryContent);
    this._images.forEach((img) => {
      this._calculateImgSize(img);
    });
  }

  _onFullscreenChange() {
    const isFullscreenEnabled =
      document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement;
    if (isFullscreenEnabled === undefined) {
      this._fullscreen = false;
      Manipulator.removeClass(this._fullscreenBtn, 'active');
    }
  }

  _beforeSlideEvents() {
    this._animationStart();
    this._restoreDefaultZoom();
    this._restoreDefaultPosition();
    this._resetDoubleTap();
  }

  _slideHorizontally(direction) {
    this._images = SelectorEngine.find('img', this._galleryContent);
    this._images.forEach((img) => {
      let newPositionLeft;

      if (direction === 'right') {
        newPositionLeft = parseInt(img.parentNode.style.left, 10) - 100;
        if (newPositionLeft < -100) newPositionLeft = (this._images.length - 2) * 100;
      } else {
        newPositionLeft = parseInt(img.parentNode.style.left, 10) + 100;
        if (newPositionLeft === (this._images.length - 1) * 100) newPositionLeft = -100;
      }

      this._slideImg(img, newPositionLeft);
    });

    this._updateActiveImg(direction);
  }

  _slideImg(img, position) {
    if (position === 0) {
      Manipulator.addClass(img, 'active');
      Manipulator.style(img.parentNode, { opacity: 1, transform: 'scale(1)' });
    } else {
      Manipulator.removeClass(img, 'active');
      Manipulator.style(img.parentNode, { opacity: 0, transform: 'scale(0.25)' });
    }
    img.parentNode.style.left = `${position}%`;
  }

  _slideToTarget(target) {
    if (target === 'first' && this._activeImg === 0) return;
    if (target === 'last' && this._activeImg === this._images.length - 1) return;

    this.reset();
    this._removeEvents();
    this._showLoader();

    this._getImages();
    this._activeImg = target === 'first' ? 0 : this._images.length - 1;
    this._sortImages();

    Manipulator.style(this.currentImg.parentNode, { transform: 'scale(0.25)', opacity: 0 });

    setTimeout(() => {
      this._loadImages().then((images) => {
        this._resizeImages(images);
        this._addEvents();
        this._updateCaption();
        this._hideLoader();
        setTimeout(() => {
          Manipulator.style(this.currentImg.parentNode, { transform: 'scale(1)', opacity: 1 });
        }, 10);
      });
    }, 400);
  }

  _updateActiveImg(direction) {
    if (direction === 'right') {
      if (this._activeImg === this._images.length - 1) {
        this._activeImg = 0;
      } else {
        this._activeImg++;
      }
    }

    if (direction === 'left') {
      if (this._activeImg === 0) {
        this._activeImg = this._images.length - 1;
      } else {
        this._activeImg--;
      }
    }
  }

  _afterSlideEvents() {
    this._updateCounter();
    this._updateCaption();
  }

  _updateCounter() {
    if (this._images.length <= 1) return;
    setTimeout(() => {
      this._imgCounter.innerHTML = `${this._activeImg + 1} / ${this._images.length}`;
    }, 200);
  }

  _updateCaption() {
    setTimeout(() => {
      let caption = this.currentImg.alt;
      if (this.currentImg.dataset.caption || this.currentImg.dataset.caption === '') {
        caption = this.currentImg.dataset.caption;
      }
      SelectorEngine.findOne(`.${CLASSNAME_CAPTION}`, this._gallery).innerHTML = caption;
    }, 200);
  }

  _toggleTemplate() {
    if (this._gallery.style.visibility === 'visible') {
      Manipulator.style(this.currentImg.parentNode, { transform: 'scale(0.25)' });

      setTimeout(() => {
        this._hideGallery();
        this._enableScroll();
        this._showLoader();
      }, 100);
    } else {
      this._showGallery();
      this._disableScroll();
      this._updateCounter();
      this._updateCaption();
      this._setToolsToggleTimout();
      this._hideLoader();
    }
  }

  _showLoader() {
    Manipulator.style(this._loader, { opacity: 1 });
  }

  _hideLoader() {
    Manipulator.style(this._loader, { opacity: 0 });
  }

  _hideGallery() {
    Manipulator.style(this._gallery, { opacity: 0, pointerEvents: 'none', visibility: 'hidden' });
  }

  _showGallery() {
    Manipulator.style(this._gallery, {
      opacity: 1,
      pointerEvents: 'initial',
      visibility: 'visible',
    });
    setTimeout(() => {
      Manipulator.style(this.currentImg.parentNode, { transform: 'scale(1)' });
    }, 50);
  }

  _toggleZoom() {
    if (this._zoom !== 1) {
      this._restoreDefaultZoom();
    } else {
      this.zoomIn();
    }
  }

  _updateZoomBtn() {
    if (this._zoom > 1) {
      Manipulator.addClass(this._zoomBtn, 'active');
      this._zoomBtn.setAttribute('aria-label', 'Zoom out');
    } else {
      Manipulator.removeClass(this._zoomBtn, 'active');
      this._zoomBtn.setAttribute('aria-label', 'Zoom in');
    }
  }

  _updateImgPosition() {
    if (this._zoom === 1) {
      this._restoreDefaultPosition();
    }
  }

  _addEvents() {
    const images = SelectorEngine.find('img', this._galleryContent);

    this._onWindowTouchmove = this._onWindowTouchmove.bind(this);
    this._onWindowTouchstart = this._onWindowTouchstart.bind(this);
    this._onImgMousedown = this._onMousedown.bind(this);
    this._onImgMousemove = this._onMousemove.bind(this);
    this._onImgWheel = this._onZoom.bind(this);
    this._onImgMouseup = this._onMouseup.bind(this);
    this._onImgTouchend = this._onTouchend.bind(this);
    this._onImgDoubleClick = this._onDoubleClick.bind(this);
    this._onWindowResize = this._onResize.bind(this);
    this._onWindowFullscreenChange = this._onFullscreenChange.bind(this);
    this._onAnyImgAction = this._resetToolsToggler.bind(this);
    this._onGalleryClick = this._onBackdropClick.bind(this);
    this._onKeyupEvent = this._onKeyup.bind(this);
    this._onRightArrowKeydownEvent = this._onRightArrowKeydown.bind(this);
    this._onFullscreenBtnKeydownEvent = this._onFullscreenBtnKeydown.bind(this);

    images.forEach((img) => {
      EventHandler.on(img, 'mousedown', this._onImgMousedown, { passive: true });
      EventHandler.on(img, 'touchstart', this._onImgMousedown, { passive: true });
      EventHandler.on(img, 'mousemove', this._onImgMousemove, { passive: true });
      EventHandler.on(img, 'touchmove', this._onImgMousemove, { passive: true });
      EventHandler.on(img, 'wheel', this._onImgWheel, { passive: true });
      EventHandler.on(img, 'dblclick', this._onImgDoubleClick, { passive: true });
    });

    document.addEventListener('touchmove', this._onWindowTouchmove, { passive: false });
    EventHandler.on(window, 'touchstart', this._onWindowTouchstart);
    EventHandler.on(window, 'mouseup', this._onImgMouseup);
    EventHandler.on(window, 'touchend', this._onImgTouchend);
    EventHandler.on(window, 'resize', this._onWindowResize);
    EventHandler.on(window, 'orientationchange', this._onWindowResize);
    EventHandler.on(window, 'keyup', this._onKeyupEvent);
    EventHandler.on(window, 'fullscreenchange', this._onWindowFullscreenChange);
    EventHandler.on(this._gallery, 'mousemove', this._onAnyImgAction);
    EventHandler.on(this._gallery, 'click', this._onGalleryClick);
    EventHandler.on(this._rightArrow, 'keydown', this._onRightArrowKeydownEvent);
    EventHandler.on(this._fullscreenBtn, 'keydown', this._onFullscreenBtnKeydownEvent);
  }

  _removeEvents() {
    const images = SelectorEngine.find('img', this._galleryContent);

    images.forEach((img) => {
      EventHandler.off(img, 'mousedown', this._onImgMousedown);
      EventHandler.off(img, 'touchstart', this._onImgMousedown);
      EventHandler.off(img, 'mousemove', this._onImgMousemove);
      EventHandler.off(img, 'touchmove', this._onImgMousemove);
      EventHandler.off(img, 'wheel', this._onImgWheel);
      EventHandler.off(img, 'dblclick', this._onImgDoubleClick);
    });

    document.removeEventListener('touchmove', this._onWindowTouchmove, { passive: false });
    EventHandler.off(window, 'touchstart', this._onWindowTouchstart);
    EventHandler.off(window, 'mouseup', this._onImgMouseup);
    EventHandler.off(window, 'touchend', this._onImgTouchend);
    EventHandler.off(window, 'resize', this._onWindowResize);
    EventHandler.off(window, 'orientationchange', this._onWindowResize);
    EventHandler.off(window, 'keyup', this._onKeyupEvent);
    EventHandler.off(window, 'fullscreenchange', this._onWindowFullscreenChange);
    EventHandler.off(this._gallery, 'mousemove', this._onAnyImgAction);
    EventHandler.off(this._gallery, 'click', this._onGalleryClick);
    EventHandler.off(this._rightArrow, 'keydown', this._onRightArrowKeydownEvent);
    EventHandler.off(this._fullscreenBtn, 'keydown', this._onFullscreenBtnKeydownEvent);
  }

  _onMousedown(e) {
    const touch = e.touches;
    const x = touch ? touch[0].clientX : e.clientX;
    const y = touch ? touch[0].clientY : e.clientY;

    this._originalPositionX = parseFloat(this.currentImg.style.left) || 0;
    this._originalPositionY = parseFloat(this.currentImg.style.top) || 0;
    this._positionX = this._originalPositionX;
    this._positionY = this._originalPositionY;
    this._mousedownPositionX = x * (1 / this._zoom) - this._positionX;
    this._mousedownPositionY = y * (1 / this._zoom) - this._positionY;
    this._mousedown = true;

    if (e.type === 'touchstart') {
      if (e.touches.length > 1) {
        this._multitouch = true;
        this._touchZoomPosition = e.touches;
      }
    }
  }

  _onMousemove(e) {
    if (!this._mousedown) return;

    const touch = e.touches;
    const x = touch ? touch[0].clientX : e.clientX;
    const y = touch ? touch[0].clientY : e.clientY;

    if (touch) this._resetToolsToggler();

    if (!this._multitouch) {
      if (this._zoom !== 1) {
        this._positionX = x * (1 / this._zoom) - this._mousedownPositionX;
        this._positionY = y * (1 / this._zoom) - this._mousedownPositionY;
        Manipulator.style(this.currentImg, {
          left: `${this._positionX}px`,
          top: `${this._positionY}px`,
        });
      } else {
        if (this._images.length <= 1) return;
        this._positionX = x * (1 / this._zoom) - this._mousedownPositionX;
        Manipulator.style(this.currentImg, { left: `${this._positionX}px` });
      }
    }
  }

  _onMouseup(e) {
    this._mousedown = false;
    this._moveImg(e.target);
  }

  _onTouchend(e) {
    this._mousedown = false;

    if (this._multitouch) {
      if (e.targetTouches.length === 0) {
        this._multitouch = false;
        this._touchZoomPosition = [];
      }
    } else if (!this._multitouch) {
      this._checkDoubleTap(e);
      this._moveImg(e.target);
    }
  }

  _calculateTouchZoom(e) {
    const initialDistance = Math.hypot(
      this._touchZoomPosition[1].pageX - this._touchZoomPosition[0].pageX,
      this._touchZoomPosition[1].pageY - this._touchZoomPosition[0].pageY
    );
    const finalDistance = Math.hypot(
      e.touches[1].pageX - e.touches[0].pageX,
      e.touches[1].pageY - e.touches[0].pageY
    );
    const distanceChange = Math.abs(initialDistance - finalDistance);
    const screenWidth = e.view.screen.width;
    if (distanceChange > screenWidth * 0.03) {
      if (initialDistance <= finalDistance) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
      this._touchZoomPosition = e.touches;
    }
  }

  _onWindowTouchstart(e) {
    if (e.touches.length > 1) {
      this._multitouch = true;
      this._touchZoomPosition = e.touches;
    }
  }

  _onWindowTouchmove(e) {
    e.preventDefault();
    if (e.type === 'touchmove' && e.targetTouches.length > 1) {
      this._calculateTouchZoom(e);
    }
  }

  _onRightArrowKeydown(e) {
    switch (e.keyCode) {
      case 9:
        if (e.shiftKey) break;
        e.preventDefault();
        this._focusFullscreenBtn();
        break;
      default:
        break;
    }
  }

  _onFullscreenBtnKeydown(e) {
    switch (e.keyCode) {
      case 9:
        if (!e.shiftKey) break;
        e.preventDefault();
        this._focusRightArrow();
        break;
      default:
        break;
    }
  }

  _onKeyup(e) {
    this._resetToolsToggler();
    switch (e.keyCode) {
      case 39:
        if (isRTL) {
          this.slide('left');
        } else {
          this.slide();
        }

        break;
      case 37:
        if (isRTL) {
          this.slide();
        } else {
          this.slide('left');
        }

        break;
      case 27:
        this.close();
        break;
      case 36:
        this.slide('first');
        break;
      case 35:
        this.slide('last');
        break;
      case 38:
        this.zoomIn();
        break;
      case 40:
        this.zoomOut();
        break;
      default:
        break;
    }
  }

  _focusFullscreenBtn() {
    setTimeout(() => {
      this._fullscreenBtn.focus();
    }, 100);
  }

  _focusRightArrow() {
    this._rightArrow.focus();
  }

  _moveImg(target) {
    if (this._multitouch) return;
    if (this._zoom !== 1 || target !== this.currentImg || this._images.length <= 1) return;

    const movement = this._positionX - this._originalPositionX;
    if (movement > 0) {
      if (isRTL) {
        this.slide();
      } else {
        this.slide('left');
      }
    } else if (movement < 0) {
      if (isRTL) {
        this.slide('left');
      } else {
        this.slide();
      }
    }
  }

  _checkDoubleTap(e) {
    clearTimeout(this._doubleTapTimer);
    const currentTime = new Date().getTime();
    const tapLength = currentTime - this._tapTime;

    if (this._tapCounter > 0 && tapLength < 500) {
      this._onDoubleClick(e);
      this._doubleTapTimer = setTimeout(() => {
        this._tapTime = new Date().getTime();
        this._tapCounter = 0;
      }, 300);
    } else {
      this._tapCounter++;
      this._tapTime = new Date().getTime();
    }
  }

  _resetDoubleTap() {
    this._tapTime = 0;
    this._tapCounter = 0;
    clearTimeout(this._doubleTapTimer);
  }

  _onDoubleClick(e) {
    if (this._multitouch) return;

    if (!e.touches) this._setNewPositionOnZoomIn(e);
    if (this._zoom !== 1) {
      this._restoreDefaultZoom();
    } else {
      this.zoomIn();
    }
  }

  _onZoom(e) {
    if (e.deltaY > 0) {
      this.zoomOut();
    } else {
      if (this._zoom >= 3) return;
      this._setNewPositionOnZoomIn(e);
      this.zoomIn();
    }
  }

  _onBackdropClick(e) {
    this._resetToolsToggler();

    if (e.target.tagName !== 'DIV') return;
    this.close();
  }

  _setNewPositionOnZoomIn(e) {
    clearTimeout(this._zoomTimer);
    this._positionX = window.innerWidth / 2 - e.offsetX - 50;
    this._positionY = window.innerHeight / 2 - e.offsetY - 50;
    this.currentImg.style.transition = 'all 0.5s ease-out';
    this.currentImg.style.left = `${this._positionX}px`;
    this.currentImg.style.top = `${this._positionY}px`;

    this._zoomTimer = setTimeout(() => {
      this.currentImg.style.transition = 'none';
    }, 500);
  }

  _resetToolsToggler() {
    this._showTools();
    clearTimeout(this._toolsToggleTimer);
    this._setToolsToggleTimout();
  }

  _setToolsToggleTimout() {
    this._toolsToggleTimer = setTimeout(() => {
      this._hideTools();
      clearTimeout(this._toolsToggleTimer);
    }, 4000);
  }

  _hideTools() {
    Manipulator.style(this._galleryToolbar, { opacity: 0 });
    Manipulator.style(this._leftArrowWrapper, { opacity: 0 });
    Manipulator.style(this._rightArrowWrapper, { opacity: 0 });
  }

  _showTools() {
    Manipulator.style(this._galleryToolbar, { opacity: 1 });
    Manipulator.style(this._leftArrowWrapper, { opacity: 1 });
    Manipulator.style(this._rightArrowWrapper, { opacity: 1 });
  }

  _disableScroll() {
    Manipulator.addClass(document.body, 'disabled-scroll');

    if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
      Manipulator.addClass(document.body, 'replace-scrollbar');
    }
  }

  _enableScroll() {
    setTimeout(() => {
      Manipulator.removeClass(document.body, 'disabled-scroll');
      Manipulator.removeClass(document.body, 'replace-scrollbar');
    }, 300);
  }

  _animationStart() {
    this._animating = true;
    setTimeout(() => {
      this._animating = false;
    }, 400);
  }

  _restoreDefaultZoom() {
    if (this._zoom !== 1) {
      this._zoom = 1;
      Manipulator.style(this.currentImg.parentNode, { transform: `scale(${this._zoom})` });

      this._updateZoomBtn();
      this._updateImgPosition();
    }
  }

  _restoreDefaultFullscreen() {
    if (this._fullscreen) this.toggleFullscreen();
  }

  _restoreDefaultPosition() {
    clearTimeout(this._zoomTimer);
    const currentImg = this.currentImg;

    Manipulator.style(this.currentImg.parentNode, { left: 0, top: 0 });
    Manipulator.style(this.currentImg, { transition: 'all 0.5s ease-out', left: 0, top: 0 });

    this._calculateImgSize(currentImg);

    setTimeout(() => {
      Manipulator.style(this.currentImg, { transition: 'none' });
    }, 500);
  }

  async _triggerEvents(startEvent, completeEvent) {
    EventHandler.trigger(this._element, `${startEvent}.mdb.lightbox`);

    if (completeEvent) {
      await setTimeout(() => {
        EventHandler.trigger(this._element, `${completeEvent}.mdb.lightbox`);
      }, 505);
    }
  }

  static toggle() {
    return function (event) {
      const lightbox = SelectorEngine.closest(event.target, `.${CLASSNAME_LIGHTBOX}`);
      const instance = Lightbox.getInstance(lightbox) || new Lightbox(lightbox);
      instance.open(event);
    };
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;
      if (!data && /dispose/.test(config)) {
        return;
      }
      if (!data) {
        data = new Lightbox(this, _config);
      }
      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](options);
      }
    });
  }
}

export default Lightbox;
