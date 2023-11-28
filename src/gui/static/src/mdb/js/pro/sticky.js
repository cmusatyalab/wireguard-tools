import { typeCheckConfig } from '../mdb/util/index';
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

const NAME = 'sticky';
const DATA_KEY = 'mdb.sticky';

const ANIMATED_CLASS = 'animation';

const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_ACTIVATED = `activated${EVENT_KEY}`;
const EVENT_DEACTIVATED = `deactivated${EVENT_KEY}`;

const Default = {
  stickyActiveClass: '',
  stickyAnimationSticky: '',
  stickyAnimationUnsticky: '',
  stickyBoundary: false,
  stickyDelay: 0,
  stickyDirection: 'down',
  stickyMedia: 0,
  stickyOffset: 0,
  stickyPosition: 'top',
};

const DefaultType = {
  stickyActiveClass: 'string',
  stickyAnimationSticky: 'string',
  stickyAnimationUnsticky: 'string',
  stickyBoundary: '(boolean|string)',
  stickyDelay: 'number',
  stickyDirection: 'string',
  stickyMedia: 'number',
  stickyOffset: 'number',
  stickyPosition: 'string',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Sticky extends BaseComponent {
  constructor(element, options) {
    super(element);

    this._hiddenElement = null;
    this._elementPositionStyles = {};
    this._scrollDirection = '';
    this._isSticked = false;
    this._elementOffsetTop = null;
    this._scrollTop = 0;
    this._pushPoint = '';
    this._manuallyDeactivated = false;

    if (this._element) {
      this._options = this._getConfig(options);
      this._init();
      Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
      bindCallbackEventsIfNeeded(this.constructor);
    }
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  // Public

  dispose() {
    const { stickyAnimationUnsticky } = this._options;
    let { animationDuration } = getComputedStyle(this._element);

    animationDuration = stickyAnimationUnsticky !== '' ? parseFloat(animationDuration) * 1000 : 0;

    this._disableSticky();
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    setTimeout(() => {
      super.dispose();
    }, animationDuration);
  }

  activate() {
    // prevent action if sticky is already active
    if (this._isSticked) {
      return;
    }

    this._createHiddenElement();
    this._enableSticky();
    this._changeBoundaryPosition();
    this._isSticked = true;
    this._manuallyDeactivated = false;
  }

  deactivate() {
    // prevent action if sticky is already inactive
    if (!this._isSticked) {
      return;
    }

    this._disableSticky();
    this._isSticked = false;
    this._manuallyDeactivated = true;
  }

  // Private
  _init() {
    this._userActivityListener();
  }

  _userActivityListener() {
    EventHandler.on(window, 'resize', () => {
      this._updateElementPosition();
      this._updateElementOffset();
    });

    EventHandler.on(window, 'scroll', () => {
      if (!this._element) {
        return;
      }

      // prevent action if browser resolution <= user acceptable resolution
      if (window.innerWidth <= this._options.stickyMedia) {
        return;
      }

      // prevent action if user deactivated sticky manually using public methods.
      if (this._manuallyDeactivated) {
        return;
      }

      const doc = document.documentElement;
      const { stickyDirection } = this._options;
      const scrollTop = window.pageYOffset || doc.scrollTop;

      this._updateElementOffset();
      this._updatePushPoint();
      this._updateScrollDirection(scrollTop);
      this._clearInProgressAnimations();

      const isCorrectScrollDirection = [this._scrollDirection, 'both'].includes(stickyDirection);
      const isPushPointReached = this._pushPoint <= scrollTop;

      const shouldBeSticky = isPushPointReached && !this._isSticked && isCorrectScrollDirection;
      const shouldNotBeSticky =
        (!isPushPointReached || !isCorrectScrollDirection) && this._isSticked;

      if (shouldBeSticky) {
        this._createHiddenElement();
        this._enableSticky();
        this._changeBoundaryPosition();
        this._isSticked = true;
      }

      if (shouldNotBeSticky) {
        this._disableSticky();
        this._isSticked = false;
      }

      if (this._isSticked) {
        this._updatePosition({ styles: this._elementPositionStyles });
        this._changeBoundaryPosition();
      }

      this._scrollTop = scrollTop <= 0 ? 0 : scrollTop; // Get last scrollTop position and fix negative scroll
    });
  }

  _updatePushPoint() {
    if (this._options.stickyPosition === 'top') {
      this._pushPoint = this._elementOffsetTop - this._options.stickyDelay;
    } else {
      this._pushPoint =
        this._elementOffsetTop +
        this._element.height -
        document.body.scrollHeight +
        this._options.stickyDelay;
    }
  }

  _updateElementOffset() {
    if (this._hiddenElement) {
      this._elementOffsetTop = this._hiddenElement.offsetTop;
    } else {
      this._elementOffsetTop = this._element.offsetTop;
    }

    if (this._options.stickyAnimationUnsticky) {
      this._elementOffsetTop += this._element.height || 0;
    }
  }

  _updateElementPosition() {
    if (this._hiddenElement) {
      const { left } = this._hiddenElement.getBoundingClientRect();

      this._elementPositionStyles = {
        left: `${left}px`,
      };
    } else {
      this._elementPositionStyles = {};
    }

    this._setStyle(this._element, this._elementPositionStyles);
  }

  _updateScrollDirection(scrollTop) {
    if (scrollTop > this._scrollTop) {
      this._scrollDirection = 'down';
    } else {
      this._scrollDirection = 'up';
    }
  }

  _clearInProgressAnimations() {
    const isScrollUp = this._scrollDirection === 'up';
    const isUnstickyAnimationInProgress = this._element.classList.contains(
      this._options.stickyAnimationUnsticky
    );
    const isScrolledAboveElement = window.scrollY <= this._elementOffsetTop - this._element.height;

    if (isScrollUp && isUnstickyAnimationInProgress && isScrolledAboveElement) {
      this._removeUnstickyAnimation();
      this._resetStyles();
      this._removeHiddenElement();
    }
  }

  _enableSticky() {
    const {
      stickyActiveClass,
      stickyAnimationSticky,
      stickyAnimationUnsticky,
      stickyOffset,
      stickyPosition,
    } = this._options;
    const { height, left, width } = this._element.getBoundingClientRect();

    if (stickyAnimationSticky !== '') {
      Manipulator.addClass(this._element, ANIMATED_CLASS);
      this._toggleClass(stickyAnimationSticky, stickyAnimationUnsticky, this._element);
    }

    this._toggleClass(stickyActiveClass, '', this._element);

    this._setStyle(this._element, {
      top: stickyPosition === 'top' && `${0 + stickyOffset}px`,
      bottom: stickyPosition === 'bottom' && `${0 + stickyOffset}px`,
      height: `${height}px`,
      width: `${width}px`,
      left: `${left}px`,
      zIndex: '100',
      position: 'fixed',
    });

    this._hiddenElement.hidden = false;

    EventHandler.trigger(this._element, EVENT_ACTIVATED);
  }

  _changeBoundaryPosition() {
    const { stickyPosition, stickyBoundary, stickyOffset } = this._options;
    const { height } = this._element.getBoundingClientRect();
    const parentOffset = {
      height: this._element.parentElement.getBoundingClientRect().height,
      ...this._getOffset(this._element.parentElement),
    };
    let stopPoint;
    const stopper = SelectorEngine.findOne(stickyBoundary);

    if (stopper) {
      stopPoint = this._getOffset(stopper).top - height - stickyOffset;
    } else {
      stopPoint = parentOffset.height + parentOffset[stickyPosition] - height - stickyOffset;
    }

    const isStickyTop = stickyPosition === 'top';
    const isStickyBottom = stickyPosition === 'bottom';
    const isStickyBoundary = stickyBoundary;
    const isBelowStopPoint = stopPoint < 0;
    const isBelowParentElementEnd = stopPoint > parentOffset.height - height;
    let elementStyle;

    if (isStickyTop) {
      if (isBelowStopPoint && isStickyBoundary) {
        elementStyle = { top: `${stickyOffset + stopPoint}px` };
      } else {
        elementStyle = { top: `${stickyOffset + 0}px` };
      }
    }

    if (isStickyBottom) {
      if (isBelowStopPoint && isStickyBoundary) {
        elementStyle = { bottom: `${stickyOffset + stopPoint}px` };
      } else if (isBelowParentElementEnd && isStickyBoundary) {
        elementStyle = { bottom: `${stickyOffset + parentOffset.bottom}px` };
      } else {
        elementStyle = { bottom: `${stickyOffset + 0}px` };
      }
    }

    this._setStyle(this._element, elementStyle);
  }

  _disableSticky() {
    const { stickyActiveClass, stickyAnimationUnsticky, stickyAnimationSticky } = this._options;

    let { animationDuration } = getComputedStyle(this._element);

    animationDuration = stickyAnimationUnsticky !== '' ? parseFloat(animationDuration) * 1000 : 0;

    if (this._options.stickyAnimationUnsticky !== '') {
      Manipulator.addClass(this._element, ANIMATED_CLASS);
      this._toggleClass(stickyAnimationUnsticky, stickyAnimationSticky, this._element);
    }

    setTimeout(() => {
      if (this._element.classList.contains(stickyAnimationSticky)) {
        return;
      }

      this._removeUnstickyAnimation();
      this._resetStyles();
      this._removeHiddenElement();
      this._toggleClass('', stickyActiveClass, this._element);

      EventHandler.trigger(this._element, EVENT_DEACTIVATED);
    }, animationDuration);
  }

  _createHiddenElement() {
    if (!this._hiddenElement) {
      this._hiddenElement = this._copyElement(this._element);
    }
  }

  _removeHiddenElement() {
    // prevent to throw error when hidden Element don't exist;
    if (!this._hiddenElement) {
      return;
    }

    this._hiddenElement.remove();
    this._hiddenElement = null;
  }

  _removeUnstickyAnimation() {
    this._toggleClass('', this._options.stickyAnimationUnsticky, this._element);
  }

  _resetStyles() {
    this._setStyle(this._element, {
      top: null,
      bottom: null,
      position: null,
      left: null,
      zIndex: null,
      width: null,
      height: null,
    });
  }

  _updatePosition({ styles }) {
    this._setStyle(this._element, styles);
  }

  _toggleClass(addClass, removeClass, target) {
    if (addClass) {
      Manipulator.addClass(target, addClass);
    }

    if (removeClass) {
      Manipulator.removeClass(target, removeClass);
    }
  }

  _getOffset(element) {
    const offsetElement = Manipulator.offset(element);
    const rectElement = element.getBoundingClientRect();

    const bottom =
      offsetElement.left === 0 && offsetElement.top === 0
        ? 0
        : window.innerHeight - rectElement.bottom;

    return {
      ...offsetElement,
      bottom,
    };
  }

  _copyElement(itemToCopy) {
    const { height, width } = itemToCopy.getBoundingClientRect();
    const COPIED_ITEM = itemToCopy.cloneNode(false);
    COPIED_ITEM.hidden = true;

    this._setStyle(COPIED_ITEM, {
      height: `${height}px`,
      width: `${width}px`,
      opacity: '0',
    });

    itemToCopy.parentElement.insertBefore(COPIED_ITEM, itemToCopy);

    return COPIED_ITEM;
  }

  _getConfig(config = {}) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, DefaultType);
    return config;
  }

  _setStyle(element, styles) {
    Object.keys(styles).forEach((style) => {
      element.style[style] = styles[style];
    });
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose|hide/.test(config)) {
        return;
      }

      if (!data) {
        data = new Sticky(this, _config);
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

export default Sticky;
