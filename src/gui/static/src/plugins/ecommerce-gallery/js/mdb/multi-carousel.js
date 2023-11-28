import { typeCheckConfig, getjQuery } from './util/index';
import Data from './dom/data';
import EventHandler from './dom/event-handler';
import Manipulator from './dom/manipulator';
import SelectorEngine from './dom/selector-engine';
import Touch from './util/touch';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'multiCarousel';
const DATA_KEY = 'mdb.multiCarousel';

const CLASSNAME_MULTI_CAROUSEL = '.multi-carousel';
const CLASSNAME_MULTI_CAROUSEL_INNER = '.multi-carousel-inner';
const CLASSNAME_MULTI_CAROUSEL_ITEM = '.multi-carousel-item';
const CLASSNAME_MUTLI_CAROUSEL_CONTROL_PREV = '.carousel-control-prev';
const CLASSNAME_MUTLI_CAROUSEL_CONTROL_NEXT = '.carousel-control-next';

const OPTIONS_TYPE = {
  items: '(number|string)',
  breakpoint: '(number|string|boolean)',
  interval: '(number|string|boolean)',
};

const DEFAULT_OPTIONS = {
  items: 3,
  breakpoint: 992,
  interval: false,
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class MultiCarousel {
  constructor(element, options = {}) {
    this._element = element;
    this._options = options;

    this._carouselInner = SelectorEngine.findOne(CLASSNAME_MULTI_CAROUSEL_INNER, this._element);
    this._prevArrow = SelectorEngine.findOne(CLASSNAME_MUTLI_CAROUSEL_CONTROL_PREV, this._element);
    this._nextArrow = SelectorEngine.findOne(CLASSNAME_MUTLI_CAROUSEL_CONTROL_NEXT, this._element);
    this._slideWidth = 0;
    this._slideHeight = 0;
    this._animating = false;
    this._vertical = this._element.classList.contains('vertical');
    this._autoplayInterval = null;
    this._touch = null;

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

  get slides() {
    return SelectorEngine.find(CLASSNAME_MULTI_CAROUSEL_ITEM, this._element);
  }

  get firstSlide() {
    return this.slides[0];
  }

  get lastSlide() {
    return this.slides[this.slides.length - 1];
  }

  get _size() {
    return JSON.parse(this.options.breakpoint) === false ||
      this.options.breakpoint < window.innerWidth
      ? 100 / parseInt(this.options.items, 10)
      : 100;
  }

  // Public
  init() {
    this._calcSlidesSizes();
    this._addEvents();
    this._setInterval();
  }

  slideNext() {
    if (this._animating) return;
    this._animationStart();
    this._setInterval();

    if (this._vertical) {
      this._slideDown();
    } else {
      this._slideRight();
    }
  }

  slidePrev() {
    if (this._animating) return;
    this._animationStart();
    this._setInterval();

    if (this._vertical) {
      this._slideUp();
    } else {
      this._slideLeft();
    }
  }

  dispose() {
    this._removeEvents();
    clearInterval(this._autoplayInterval);

    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  _animationStart() {
    this._animating = true;
    setTimeout(() => {
      this._animating = false;
    }, 400);
  }

  _calcSlidesSizes() {
    if (this._vertical) {
      this.slides.forEach((slide) => {
        this._slideHeight = this._size;
        Manipulator.style(slide, { height: `${this._slideHeight}%`, display: 'flex' });
      });
    } else {
      this.slides.forEach((slide) => {
        this._slideWidth = this._size;
        Manipulator.style(slide, { width: `${this._slideWidth}%` });
      });
    }
  }

  _slideRight() {
    const firstSlideCopy = this.firstSlide.cloneNode(true);
    Manipulator.style(firstSlideCopy, { marginLeft: 0 });
    this._carouselInner.appendChild(firstSlideCopy);
    Manipulator.style(this.firstSlide, { marginLeft: `-${this._slideWidth}%` });
    this._triggerEvents('slide', 'slided');

    setTimeout(() => {
      this._carouselInner.removeChild(this.firstSlide);
    }, 300);
  }

  _slideLeft() {
    const lastSlideCopy = this.lastSlide.cloneNode(true);
    this._carouselInner.insertBefore(lastSlideCopy, this.firstSlide);
    Manipulator.style(lastSlideCopy, { marginLeft: `-${this._slideWidth}%` });

    this._triggerEvents('slide', 'slided');

    setTimeout(() => {
      Manipulator.style(this.firstSlide, { marginLeft: 0 });
    }, 150);

    setTimeout(() => {
      this._carouselInner.removeChild(this.lastSlide);
    }, 300);
  }

  _slideDown() {
    const firstSlideCopy = this.firstSlide.cloneNode(true);
    Manipulator.style(firstSlideCopy, { marginTop: 0 });
    this._carouselInner.appendChild(firstSlideCopy);
    Manipulator.style(this.firstSlide, {
      marginTop: `-${this.firstSlide.getBoundingClientRect().height}px`,
    });
    this._triggerEvents('slide', 'slided');

    setTimeout(() => {
      this._carouselInner.removeChild(this.firstSlide);
    }, 300);
  }

  _slideUp() {
    const lastSlideCopy = this.lastSlide.cloneNode(true);
    Manipulator.style(lastSlideCopy, {
      marginTop: `-${this.lastSlide.getBoundingClientRect().height}px`,
    });
    this._carouselInner.insertBefore(lastSlideCopy, this.firstSlide);

    this._triggerEvents('slide', 'slided');

    setTimeout(() => {
      Manipulator.style(this.firstSlide, { marginTop: 0 });
    }, 150);

    setTimeout(() => {
      this._carouselInner.removeChild(this.lastSlide);
    }, 300);
  }

  _setInterval() {
    if (!this.options.interval) return;
    clearInterval(this._autoplayInterval);
    this._autoplayInterval = setInterval(() => {
      this.slideNext();
    }, parseInt(this.options.interval, 10));
  }

  _addEvents() {
    this._slideNextEvent = this.slideNext.bind(this);
    this._slidePrevEvent = this.slidePrev.bind(this);
    this._arrowKeyupEvent = this._arrowKeyup.bind(this);
    this._onWindowResize = this._onResize.bind(this);

    EventHandler.on(this._nextArrow, 'click', this._slideNextEvent);
    EventHandler.on(this._prevArrow, 'click', this._slidePrevEvent);
    EventHandler.on(this._nextArrow, 'keyup', this._arrowKeyupEvent);
    EventHandler.on(this._prevArrow, 'keyup', this._arrowKeyupEvent);
    EventHandler.on(window, 'resize', this._onWindowResize);

    this._touch = new Touch(this._element, 'swipe', { threshold: 20 });
    this._touch.init();

    if (this._vertical) {
      EventHandler.on(this._element, 'swipedown', this._slidePrevEvent);
      EventHandler.on(this._element, 'swipeup', this._slideNextEvent);
    } else {
      EventHandler.on(this._element, 'swiperight', this._slidePrevEvent);
      EventHandler.on(this._element, 'swipeleft', this._slideNextEvent);
    }
  }

  _removeEvents() {
    EventHandler.off(this._nextArrow, 'click', this._slideNextEvent);
    EventHandler.off(this._prevArrow, 'click', this._slidePrevEvent);
    EventHandler.off(this._nextArrow, 'keyup', this._arrowKeyupEvent);
    EventHandler.off(this._prevArrow, 'keyup', this._arrowKeyupEvent);
    EventHandler.off(window, 'resize', this._onWindowResize);

    if (this._vertical) {
      EventHandler.off(this._element, 'swipedown', this._slidePrevEvent);
      EventHandler.off(this._element, 'swipeup', this._slideNextEvent);
    } else {
      EventHandler.off(this._element, 'swiperight', this._slidePrevEvent);
      EventHandler.off(this._element, 'swipeleft', this._slideNextEvent);
    }
  }

  _onResize() {
    this._calcSlidesSizes();
  }

  _arrowKeyup(e) {
    e.preventDefault();
    e.stopPropagation();
    switch (e.keyCode) {
      case 13:
        if (e.target.dataset.mdbSlide === 'prev') {
          this.slidePrev();
        } else {
          this.slideNext();
        }
        break;
      case 37:
        this.slidePrev();
        break;
      case 39:
        this.slideNext();
        break;
      default:
        break;
    }
  }

  async _triggerEvents(startEvent, completeEvent) {
    EventHandler.trigger(this._element, `${startEvent}.mdb.multiCarousel`);

    if (completeEvent) {
      await setTimeout(() => {
        EventHandler.trigger(this._element, `${completeEvent}.mdb.multiCarousel`);
      }, 305);
    }
  }

  // Static
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
        data = new MultiCarousel(this, _config);
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

SelectorEngine.find(CLASSNAME_MULTI_CAROUSEL).forEach((el) => {
  new MultiCarousel(el).init();
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

const $ = getjQuery();

if ($) {
  const JQUERY_NO_CONFLICT = $.fn[NAME];
  $.fn[NAME] = MultiCarousel.jQueryInterface;
  $.fn[NAME].Constructor = MultiCarousel;
  $.fn[NAME].noConflict = () => {
    $.fn[NAME] = JQUERY_NO_CONFLICT;
    return MultiCarousel.jQueryInterface;
  };
}

export default MultiCarousel;
