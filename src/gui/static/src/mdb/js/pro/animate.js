import { typeCheckConfig } from '../mdb/util/index';
import Manipulator from '../mdb/dom/manipulator';
import SelectorEngine from '../mdb/dom/selector-engine';
import EventHandler from '../mdb/dom/event-handler';
import BaseComponent from '../free/base-component';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'animation';

const DefaultType = {
  animation: 'string',
  animationStart: 'string',
  animationShowOnLoad: 'boolean',
  onStart: '(null|function)',
  onEnd: '(null|function)',
  onHide: '(null|function)',
  onShow: '(null|function)',
  animationOnScroll: '(string)',
  animationWindowHeight: 'number',
  animationOffset: '(number|string)',
  animationDelay: '(number|string)',
  animationDuration: '(number|string)',
  animationReverse: 'boolean',
  animationInterval: '(number|string)',
  animationRepeat: '(number|boolean)',
  animationReset: 'boolean',
};

const Default = {
  animation: 'fade',
  animationStart: 'onClick',
  animationShowOnLoad: true,
  onStart: null,
  onEnd: null,
  onHide: null,
  onShow: null,
  animationOnScroll: 'once',
  animationWindowHeight: 0,
  animationOffset: 0,
  animationDelay: 0,
  animationDuration: 500,
  animationReverse: false,
  animationInterval: 0,
  animationRepeat: false,
  animationReset: false,
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Animate extends BaseComponent {
  constructor(element, options) {
    super(element);

    this._animateElement = this._getAnimateElement();
    this._isFirstScroll = true;
    this._repeatAnimateOnScroll = true;
    this._options = this._getConfig(options);
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters
  static get NAME() {
    return NAME;
  }

  // Public
  init() {
    this._init();
  }

  startAnimation() {
    this._startAnimation();
  }

  stopAnimation() {
    this._clearAnimationClass();
  }

  changeAnimationType(animation) {
    this._options.animation = animation;
  }

  dispose() {
    EventHandler.off(this._element, 'mousedown');
    EventHandler.off(this._animateElement, 'animationend');
    EventHandler.off(window, 'scroll');
    EventHandler.off(this._element, 'mouseover');
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  // Private
  _init() {
    switch (this._options.animationStart) {
      case 'onHover':
        this._bindHoverEvents();
        break;
      case 'onLoad':
        this._startAnimation();
        break;
      case 'onScroll':
        this._bindScrollEvents();
        break;
      case 'onClick':
        this._bindClickEvents();
        break;
      default:
        break;
    }

    this._bindTriggerOnEndCallback();

    if (this._options.animationReset) {
      this._bindResetAnimationAfterFinish();
    }
  }

  _getAnimateElement() {
    const targetId = Manipulator.getDataAttribute(this._element, 'animation-target');
    return targetId ? SelectorEngine.find(targetId)[0] : this._element;
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._animateElement);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _animateOnScroll() {
    const elementOffsetTop = Manipulator.offset(this._animateElement).top;
    const elementHeight = this._animateElement.offsetHeight;
    const windowHeight = window.innerHeight;
    const shouldBeVisible =
      elementOffsetTop + this._options.animationOffset <= windowHeight &&
      elementOffsetTop + this._options.animationOffset + elementHeight >= 0;
    const isElementVisible = this._animateElement.style.visibility === 'visible';

    switch (true) {
      case shouldBeVisible && this._isFirstScroll:
        this._isFirstScroll = false;
        this._startAnimation();
        break;
      case !shouldBeVisible && this._isFirstScroll:
        this._isFirstScroll = false;
        this._hideAnimateElement();
        break;
      case shouldBeVisible && !isElementVisible && this._repeatAnimateOnScroll:
        if (this._options.animationOnScroll !== 'repeat') {
          this._repeatAnimateOnScroll = false;
        }
        this._callback(this._options.onShow);
        this._showAnimateElement();
        this._startAnimation();
        break;
      case !shouldBeVisible && isElementVisible && this._repeatAnimateOnScroll:
        this._hideAnimateElement();
        this._clearAnimationClass();
        this._callback(this._options.onHide);
        break;
      default:
        break;
    }
  }

  _addAnimatedClass() {
    Manipulator.addClass(this._animateElement, 'animation');
    Manipulator.addClass(this._animateElement, this._options.animation);
  }

  _clearAnimationClass() {
    this._animateElement.classList.remove(this._options.animation, 'animation');
  }

  _removeInvisibleClass() {
    Manipulator.removeClass(this._animateElement, 'invisible');
  }

  _startAnimation() {
    this._callback(this._options.onStart);

    this._removeInvisibleClass();
    this._addAnimatedClass();

    if (this._options.animationRepeat && !this._options.animationInterval) {
      this._setAnimationRepeat();
    }

    if (this._options.animationReverse) {
      this._setAnimationReverse();
    }

    if (this._options.animationDelay) {
      this._setAnimationDelay();
    }

    if (this._options.animationDuration) {
      this._setAnimationDuration();
    }

    if (this._options.animationInterval) {
      this._setAnimationInterval();
    }
  }

  _setAnimationReverse() {
    Manipulator.style(this._animateElement, {
      animationIterationCount: this._options.animationRepeat === true ? 'infinite' : '2',
      animationDirection: 'alternate',
    });
  }

  _setAnimationDuration() {
    Manipulator.style(this._animateElement, {
      animationDuration: `${this._options.animationDuration}ms`,
    });
  }

  _setAnimationDelay() {
    Manipulator.style(this._animateElement, {
      animationDelay: `${this._options.animationDelay}ms`,
    });
  }

  _setAnimationRepeat() {
    Manipulator.style(this._animateElement, {
      animationIterationCount:
        this._options.animationRepeat === true ? 'infinite' : this._options.animationRepeat,
    });
  }

  _setAnimationInterval() {
    EventHandler.on(this._animateElement, 'animationend', () => {
      this._clearAnimationClass();
      setTimeout(() => {
        this._addAnimatedClass();
      }, this._options.animationInterval);
    });
  }

  _hideAnimateElement() {
    Manipulator.style(this._animateElement, { visibility: 'hidden' });
  }

  _showAnimateElement() {
    Manipulator.style(this._animateElement, { visibility: 'visible' });
  }

  _bindResetAnimationAfterFinish() {
    EventHandler.on(this._animateElement, 'animationend', () => {
      this._clearAnimationClass();
    });
  }

  _bindTriggerOnEndCallback() {
    EventHandler.on(this._animateElement, 'animationend', () => {
      this._callback(this._options.onEnd);
    });
  }

  _bindScrollEvents() {
    if (!this._options.animationShowOnLoad) {
      this._animateOnScroll();
    }

    EventHandler.on(window, 'scroll', () => {
      this._animateOnScroll();
    });
  }

  _bindClickEvents() {
    EventHandler.on(this._element, 'mousedown', () => {
      this._startAnimation();
    });
  }

  _bindHoverEvents() {
    EventHandler.one(this._element, 'mouseover', () => {
      this._startAnimation();
    });
    EventHandler.one(this._animateElement, 'animationend', () => {
      // wait after bind hoverEvents to prevent animation looping
      setTimeout(() => {
        this._bindHoverEvents();
      }, 100);
    });
  }

  _callback(fn) {
    if (fn instanceof Function) {
      fn();
    }
  }

  // Static
  static autoInit(instance) {
    instance._init();
  }

  static jQueryInterface(options) {
    const animate = new Animate(this[0], options);
    animate.init();
  }
}

export default Animate;
