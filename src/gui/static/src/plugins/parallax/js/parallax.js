/** !
 * The following code contains snippets of simpleParallax.js
 *
 * @license MIT
 * @author Geoffrey Signorato <geoffrey.signorato@gmail.com> (https://github.com/geosigno/simpleParallax.js/)
 * @version 5.6.1
 * */

import { typeCheckConfig, getjQuery, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'parallax';
const DATA_KEY = 'mdb.parallax';

const CLASS_SLIDER = `${NAME}-slider`;

const SELECTOR_DATA_INIT = '[data-mdb-parallax-init]';
const SELECTOR_PARALLAX_SLIDER = `.${CLASS_SLIDER}`;
const SELECTOR_PARALLAX_CONTENT = `.${NAME}-content`;

const DEFAULT_OPTIONS = {
  imageSrc: '',
  direction: 'up',
  delay: 0.4,
  scale: 1.3,
  transition: 'cubic-bezier(0,0,0,1)',
  maxTransition: 0,
  maxHeight: 0,
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  overflow: false,
};
const OPTIONS_TYPE = {
  imageSrc: 'string',
  direction: 'string',
  delay: 'number',
  scale: 'number',
  transition: 'string',
  maxTransition: 'number',
  maxHeight: 'number',
  horizontalAlignment: 'string',
  verticalAlignment: 'string',
  overflow: 'boolean',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Parallax {
  constructor(element, options = {}) {
    this._element = element;
    this._options = this._getConfig(options);

    this._image = null;
    this._imageContainer = null;
    this._contentContainer = null;

    this._isInit = false;
    this._zIndex = -100;

    this._isVisible = false;

    this._viewportTop = null;
    this._viewportHeight = null;
    this._viewportBottom = null;

    this._elementBottom = null;
    this._elementHeight = null;
    this._elementTop = null;

    this._lastViewportPosition = -1;
    this._frameID = null;

    this._resizeWindowHandler = () => this._refresh();

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }

    this._createImageWrapper();
  }

  // Getters

  // Public
  dispose() {
    EventHandler.off(window, 'resize', this._resizeWindowHandler);
    window.cancelAnimationFrame(this._frameID);

    this._disposeContainers();

    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  // Private

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...DEFAULT_OPTIONS,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  _init() {
    if (this._isInit) {
      return;
    }

    this._getTranslateValue();

    this._translate();

    this._handleFrameLoop();

    this._listenToWindowResize();

    this._isInit = true;
  }

  _handleFrameLoop = () => {
    this._getViewportOffsets();

    if (this._lastViewportPosition === this._viewportTop) {
      this._frameID = window.requestAnimationFrame(this._handleFrameLoop);
      return;
    }

    this._getElementOffset();

    this._translateElement();

    this._frameID = window.requestAnimationFrame(this._handleFrameLoop);

    this._lastViewportPosition = this._viewportTop;
  };

  _translateElement() {
    if (!this._isVisible) {
      return;
    }

    const newTranslateValue = this._getTranslateValue();

    if (!newTranslateValue) {
      return;
    }

    this._translate();
  }

  _createImageWrapper() {
    if (!this._options.imageSrc) {
      return;
    }

    const imageWrapper = document.createElement('div');
    const image = document.createElement('img');

    image.setAttribute('src', this._options.imageSrc);
    image.setAttribute('alt', '');

    Manipulator.addStyle(this._element, { position: 'relative' });

    Manipulator.addClass(imageWrapper, CLASS_SLIDER);
    Manipulator.addStyle(imageWrapper, {
      position: 'absolute',
      top: '0px',
      left: '0px',
      overflow: `${this._options.overflow === false ? 'hidden' : ''}`,
    });

    imageWrapper.appendChild(image);
    this._element.insertBefore(imageWrapper, this._element.firstChild);

    EventHandler.on(image, 'load', () => {
      setTimeout(() => {
        this._handleImageLoaded(image);
      }, 100);
    });
  }

  _handleImageLoaded(image) {
    this._image = image;

    this._setContainersDimensions();

    this._getMaxTranslateRange();

    this._setImageStyles();

    this._getViewportOffsets();

    this._getElementOffset();

    this._imageIntersectionObserver();

    this._init();
  }

  _disposeContainers() {
    if (this._contentContainer !== null) {
      Manipulator.addStyle(this._contentContainer, { height: 'auto' });
      this._contentContainer = null;
    }

    if (this._imageContainer) {
      this._imageContainer.parentNode.removeChild(this._imageContainer);
      this._imageContainer = null;
    }
  }

  _setContainersDimensions() {
    const maxHeight =
      this._options.maxHeight > 0 && this._options.maxHeight <= this._image.naturalHeight
        ? this._options.maxHeight
        : this._image.naturalHeight;

    Manipulator.addStyle(this._element, {
      height: `${maxHeight}px`,
      width: '100%',
    });

    this._imageContainer = SelectorEngine.findOne(SELECTOR_PARALLAX_SLIDER, this._element);

    Manipulator.addStyle(this._imageContainer, {
      height: `${maxHeight}px`,
      width: '100%',
    });

    this._contentContainer = SelectorEngine.findOne(SELECTOR_PARALLAX_CONTENT, this._element);

    if (this._contentContainer !== null) {
      Manipulator.addStyle(this._contentContainer, {
        height: '100%',
      });
    }

    this._getMaxTranslateRange();
  }

  _setImageStyles() {
    let positionY = 0;

    // vertical positioning of the image possible only when custom height of the element is given
    // otherwise image is always centered so it can be properly translated
    if (this._options.maxHeight > 0 && this._options.maxHeight <= this._image.naturalHeight) {
      if (this._options.verticalAlignment === 'top') {
        positionY = '0px';
      } else if (this._options.verticalAlignment === 'center') {
        positionY = `${Number(this._maxTranslateRange.y) + this._image.naturalHeight / -2}px`;
      } else if (this._options.verticalAlignment === 'bottom') {
        positionY = `${this._maxTranslateRange.y / 2 + this._image.naturalHeight / -2}px`;
      }
    }

    if (this._options.delay > 0) {
      Manipulator.addStyle(this._image, {
        transition: `transform ${this._options.delay}s ${this._options.transition}`,
      });
    }
    if (this._options.overflow === false) {
      Manipulator.addStyle(this._image, { transform: `scale(${this._options.scale})` });
    }

    Manipulator.addStyle(this._image, {
      willChange: 'transform',
      position: 'absolute',
      top: positionY,
    });

    Manipulator.addStyle(this._image, {
      display: 'block',
      opacity: 1,
      transform: 'scale(1)',
    });
  }

  _getViewportOffsets() {
    this._viewportTop = window.scrollY;

    this._viewportHeight = document.documentElement.clientHeight;

    this._viewportBottom = this._viewportTop + this._viewportHeight;
  }

  _getElementOffset() {
    const rect = this._element.getBoundingClientRect();

    this._elementHeight = rect.height;

    this._elementTop = rect.top + this._viewportTop;

    this._elementBottom = this._elementHeight + this._elementTop;
  }

  _imageIntersectionObserver() {
    const options = {
      root: null,
      threshold: 0,
    };

    this._observer = new IntersectionObserver(this._setIsVisible.bind(this), options);

    this._observer.observe(this._element);
  }

  _setIsVisible(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this._isVisible = true;
      } else {
        this._isVisible = false;
      }
    });
  }

  _createThreshold() {
    const thresholds = [];
    for (let i = 1.0; i <= this._elementHeight; i++) {
      const ratio = i / this._elementHeight;
      thresholds.push(ratio);
    }

    return thresholds;
  }

  _getMaxTranslateRange() {
    this._maxTranslateRange = {
      x: (this._image.naturalWidth * this._options.scale - this._image.naturalWidth).toFixed(0),
      y: (this._image.naturalHeight * this._options.scale - this._image.naturalHeight).toFixed(0),
    };
  }

  _getPercentage() {
    let percentage = (
      (this._viewportBottom - this._elementTop) /
      ((this._viewportHeight + this._elementHeight) / 100)
    ).toFixed(1);

    percentage = Math.min(100, Math.max(0, percentage));

    this._percentage = percentage;
  }

  _getTranslateValue() {
    this._getPercentage();

    if (this._options.maxTransition !== 0 && this._percentage > this._options.maxTransition) {
      this._percentage = this._options.maxTransition;
    }

    if (this._previousPercentage === this._percentage) {
      return false;
    }

    if (!this._maxTranslateRange) {
      this._getMaxTranslateRange();
    }

    this._translateValue = {
      x: (
        (this._percentage / 100) * this._maxTranslateRange.x -
        this._maxTranslateRange.x / 2
      ).toFixed(0),
      y: (
        (this._percentage / 100) * this._maxTranslateRange.y -
        this._maxTranslateRange.y / 2
      ).toFixed(0),
    };

    if (this._previousTranslateValue === this._translateValue) {
      return false;
    }

    this._previousPercentage = this._percentage;
    this._previousTranslateValue = this._translateValue;

    return true;
  }

  _translate() {
    let translateValueY = 0;
    let translateValueX = 0;
    let translateCSS;
    let translateX;

    if (this._options.direction.includes('left') || this._options.direction.includes('right')) {
      translateValueX = `${
        this._options.direction.includes('left')
          ? this._translateValue.y * -1
          : this._translateValue.y
      }px`;
    }

    if (this._options.direction.includes('up') || this._options.direction.includes('down')) {
      translateValueY = `${
        this._options.direction.includes('up')
          ? this._translateValue.y * -1
          : this._translateValue.y
      }px`;
    }
    if (this._options.overflow === false) {
      translateCSS = `translate3d(${translateValueX}, ${translateValueY}, 0) scale(${this._options.scale})`;
    } else {
      translateCSS = `translate3d(${translateValueX}, ${translateValueY}, 0)`;
    }

    if (this._options.horizontalAlignment === 'left') {
      translateX = 'translateX(10%)';
    } else if (this._options.horizontalAlignment === 'right') {
      translateX = 'translateX(-10%)';
    } else if (this._options.horizontalAlignment === 'center') {
      translateX = 'translateX(0%)';
    }

    Manipulator.addStyle(this._image, { transform: translateCSS + translateX });
  }

  _refresh() {
    this._getViewportOffsets();

    this._getElementOffset();

    this._getMaxTranslateRange(this._image.naturalHeight);

    this._lastViewportPosition = -1;

    this._translate();
  }

  _listenToWindowResize() {
    EventHandler.on(window, 'resize', this._resizeWindowHandler);
  }

  // Static
  static get NAME() {
    return NAME;
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Parallax(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](options);
      }
    });
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static init(element) {
    let instance = Parallax.getInstance(element);
    if (!instance) {
      instance = new Parallax(element);
    }

    return instance;
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((el) => {
  let instance = Parallax.getInstance(el);
  if (!instance) {
    instance = new Parallax(el);
  }

  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Parallax to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Parallax.jQueryInterface;
    $.fn[NAME].Constructor = Parallax;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Parallax.jQueryInterface;
    };
  }
});

export default Parallax;
