import { element, typeCheckConfig, getUID, getjQuery, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import EventHandler from './mdb/dom/event-handler';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'ecommerceGallery';
const DATA_KEY = 'mdb.ecommerceGallery';
const CLASSNAME_ECOMMERCE_GALLERY = '.ecommerce-gallery';
const CLASSNAME_ECOMMERCE_MAIN_IMG = '.ecommerce-gallery-main-img';
const CLASSNAME_LIGHTBOX = '.lightbox';
const CLASSNAME_MULTI_CAROUSEL = '.multi-carousel';

const LIGHTBOX_SELECTOR = '[data-mdb-lightbox-init] img:not(.lightbox-disabled)';
const THUMBNAILS_SELECTOR = 'img:not(.ecommerce-gallery-main-img):not(.ecommerce-disabled)';

const SELECTOR_DATA_INIT = '[data-mdb-ecommerce-gallery-init]';

// const EVENT_CLICK_DATA_API_LIGHTBOX = 'click.mdb.lightbox.data-api';

const MULTI_CAROUSEL_SLID_EVENT = 'slid.mdb.multiCarousel';
const LIGHTBOX_SLID_EVENT = 'slid.mdb.lightbox';

const OPTIONS_TYPE = {
  activation: 'string',
  autoHeight: 'boolean',
  zoomEffect: '(string|boolean)',
};

const DEFAULT_OPTIONS = {
  activation: 'click',
  autoHeight: false,
  zoomEffect: false,
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class EcommerceGallery {
  constructor(element, options = {}) {
    this._element = element;
    this._options = options;

    this._activeImg = null;
    this._lightbox = null;
    this._toggleEvent = null;
    this._vertical = this._element.classList.contains('vertical');
    this._animating = false;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }
  }

  // Getters
  static get NAME() {
    return NAME;
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

  get thumbnails() {
    const thumbnails = [];
    SelectorEngine.find(THUMBNAILS_SELECTOR, this._element).forEach((img) => {
      thumbnails.push(img);
    });

    return thumbnails;
  }

  get _multiCarousel() {
    return SelectorEngine.findOne(CLASSNAME_MULTI_CAROUSEL, this._element);
  }

  // Public
  init() {
    this._setGalleryData();
    this._addMdbId();
    if (this._lightbox) this._appendLightboxContent();
    this._addEvents();
  }

  dispose() {
    this._removeEvents();

    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  // Private
  _toggle(e) {
    if (this._animating || e.target.dataset.mdbId === this._activeImg.dataset.activeImg) {
      return;
    }

    this._animationStart();
    this._toggleThumbsClass(e);
    this._toggleMainImg(e);
  }

  _setGalleryData() {
    this._activeImg = SelectorEngine.findOne(CLASSNAME_ECOMMERCE_MAIN_IMG, this._element);
    Manipulator.addClass(this._activeImg, 'active');
    this._lightbox = SelectorEngine.findOne(CLASSNAME_LIGHTBOX, this._element);
  }

  _animationStart() {
    this._animating = true;
    setTimeout(() => {
      this._animating = false;
    }, 500);
  }

  _appendLightboxContent() {
    this._lightbox.innerHTML = '';
    this.thumbnails.forEach((img) => {
      const newImg = element('img');
      newImg.src = img.dataset.mdbImg;
      newImg.dataset.mdbId = img.dataset.mdbId;
      newImg.alt = img.alt;
      if (img.dataset.caption) {
        newImg.dataset.caption = img.dataset.caption;
      }
      if (this.options.autoHeight) {
        Manipulator.style(newImg, { height: 'auto' });
      }

      this._applyLigthboxImgClassList(newImg, img);
      this._lightbox.append(newImg);
    });
  }

  _addMdbId() {
    this.thumbnails.forEach((img) => {
      img.dataset.mdbId = getUID('ecommerce-gallery-');
    });
  }

  _addEvents() {
    this.thumbnails.forEach((img) => {
      this._toggleEvent = this._toggle.bind(this);
      EventHandler.on(img, this.options.activation, this._toggleEvent);
    });

    if (this._multiCarousel) {
      this._updateEventsHandler = this._updateEvents.bind(this);
      EventHandler.on(this._multiCarousel, MULTI_CAROUSEL_SLID_EVENT, this._updateEventsHandler);
    }

    if (this._lightbox) {
      this._onLightboxSlideHandler = this._onLightboxSlide.bind(this);
      EventHandler.on(this._lightbox, LIGHTBOX_SLID_EVENT, this._onLightboxSlideHandler);
    }

    if (this.options.zoomEffect) {
      SelectorEngine.find('img', this._lightbox).forEach((img) => {
        EventHandler.on(img, 'mousemove', this._onMainImgMousemove);
        EventHandler.on(img, 'mouseleave', this._onMainImgMouseleave);
      });
    }
  }

  _updateEvents(e) {
    const closestGallery = SelectorEngine.closest(e.target, CLASSNAME_ECOMMERCE_GALLERY);
    if (closestGallery !== this._element) return;

    this.thumbnails.forEach((img) => {
      this._toggleEvent = this._toggle.bind(this);
      EventHandler.on(img, this.options.activation, this._toggleEvent);
    });
  }

  _removeEvents() {
    this.thumbnails.forEach((img) => {
      EventHandler.off(img, this.options.activation, this._toggleEvent);
    });

    if (this._multiCarousel) {
      EventHandler.off(this._multiCarousel, MULTI_CAROUSEL_SLID_EVENT, this._updateEventsHandler);
    }

    if (this._lightbox) {
      EventHandler.off(this._lightbox, LIGHTBOX_SLID_EVENT, this._onLightboxSlideHandler);
    }

    if (this.options.zoomEffect) {
      SelectorEngine.find('img', this._lightbox).forEach((img) => {
        EventHandler.off(img, 'mousemove', this._onMainImgMousemove);
      });
    }
  }

  _onLightboxSlide() {
    const lightboxInstance = mdb.Lightbox.getInstance(this._lightbox);
    const activeImg = lightboxInstance.activeImg;
    const currentImg = lightboxInstance.currentImg;

    SelectorEngine.find('img', this._lightbox).forEach((img, key) => {
      Manipulator.removeClass(img, 'active');
      if (key === activeImg) Manipulator.addClass(img, 'active');
    });

    SelectorEngine.find(THUMBNAILS_SELECTOR, this._element).forEach((img) => {
      Manipulator.removeClass(img, 'active');
      if (currentImg.src === img.src || currentImg.src === img.dataset.mdbImg) {
        Manipulator.addClass(img, 'active');
      }
    });
  }

  _onMainImgMousemove(e) {
    this._activeImg = e.target;
    const x = -(e.offsetX - this._activeImg.width / 2) / 2;
    const y = -(e.offsetY - this._activeImg.height / 2) / 2;
    Manipulator.style(this._activeImg, { transform: `scale(4.5) translate(${x}px, ${y}px)` });
  }

  _onMainImgMouseleave() {
    Manipulator.style(this._activeImg, { transform: 'scale(1)' });
  }

  _applyLigthboxImgClassList(newImg, img) {
    this._activeImg.classList.forEach((className) => {
      if (className === 'active') return;
      Manipulator.addClass(newImg, className);
    });

    if (img.classList.contains('active')) {
      Manipulator.addClass(newImg, 'active');
    }
  }

  _toggleThumbsClass(e) {
    SelectorEngine.find(THUMBNAILS_SELECTOR, this._element).forEach((img) => {
      Manipulator.removeClass(img, 'active');
    });
    Manipulator.addClass(e.target, 'active');
  }

  _toggleMainImg(e) {
    SelectorEngine.find('img', this._lightbox).forEach((img) => {
      if (e.target.dataset.mdbId === img.dataset.mdbId) {
        this._activeImg = img;
        this._fadeIn(img);
      } else {
        this._fadeOut(img);
      }
    });
  }

  _fadeIn(img) {
    ['animation', 'fade-in', 'faster', 'active'].forEach((className) =>
      Manipulator.addClass(img, className)
    );
    setTimeout(() => {
      ['animation', 'fade-in', 'faster'].forEach((className) =>
        Manipulator.removeClass(img, className)
      );
    }, 500);
  }

  _fadeOut(img) {
    if (img.classList.contains('active')) {
      ['animating', 'animation', 'fade-out', 'faster'].forEach((className) =>
        Manipulator.addClass(img, className)
      );
      setTimeout(() => {
        ['animation', 'animating', 'fade-out', 'faster', 'active'].forEach((className) =>
          Manipulator.removeClass(img, className)
        );
      }, 500);
    }
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;
      if (!data && /dispose/.test(config)) {
        return;
      }
      if (!data) {
        data = new EcommerceGallery(this, _config);
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

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((el) => {
  new EcommerceGallery(el).init();
});

SelectorEngine.find(LIGHTBOX_SELECTOR).forEach((el) => {
  const lightboxInstance = mdb.Lightbox.getInstance(el);
  if (lightboxInstance) lightboxInstance.dispose();
  new mdb.Lightbox(el).init();
});

// EventHandler.on(document, EVENT_CLICK_DATA_API_LIGHTBOX, LIGHTBOX_SELECTOR, mdb.Lightbox.toggle());

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = EcommerceGallery.jQueryInterface;
    $.fn[NAME].Constructor = EcommerceGallery;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return EcommerceGallery.jQueryInterface;
    };
  }
});

export default EcommerceGallery;
