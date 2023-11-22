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

const NAME = 'draggable';
const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;

const SELECTOR_DATA_INIT = '[data-mdb-draggable-init]';
const CLASS_NAME_SHADOW = 'shadow-3-strong';
const CLASS_NAME_CURSOR_GRAB = 'draggable-cursor-grab';
const CLASS_NAME_DISABLED = 'draggable-disabled';
const CLASS_NAME_RETURN_ANIMATION = 'draggable-return-animate';

const DEFAULT_OPTIONS = {
  container: 'body',
  blockXAxis: false,
  blockYAxis: false,
  delay: 0,
  disabled: false,
  dragHandle: '',
  scrollPixels: 40,
  draggingClass: 'dragging',
};
const OPTIONS_TYPE = {
  container: 'string',
  blockXAxis: 'boolean',
  blockYAxis: 'boolean',
  delay: 'number',
  disabled: 'boolean',
  dragHandle: 'string',
  draggingClass: 'string',
};

const EVENT_START = `start${EVENT_KEY}`;
const EVENT_END = `end${EVENT_KEY}`;
const EVENT_MOVE = `itemMove${EVENT_KEY}`;

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Draggable {
  constructor(element, options = {}) {
    this._element = element;
    this._options = options;
    this._dragActive = false;
    this._currentX = undefined;
    this._currentY = undefined;
    this._initialX = undefined;
    this._initialY = undefined;
    this._xOffset = 0;
    this._yOffset = 0;
    this._topY = -this.containerTop;
    this._bottomY = this.containerBottom;
    this._leftX = -this.containerLeft;
    this._rightX = this.containerRight;
    this._scrollableX = this.containerScrollableX;
    this._scrollableY = this.containerScrollableY;
    this._timeStart = 0;
    this._timeEnd = 0;
    this._delayTimeout = undefined;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);

      this._dragStart = this._dragStart.bind(this);
      this._dragEnd = this._dragEnd.bind(this);
      this._drag = this._drag.bind(this);
      this._takeAgainCoordinates = this._takeAgainCoordinates.bind(this);

      this._setup();
    }
  }

  // Getters
  get options() {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...this._options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  get customContainerExist() {
    return this.options.container !== 'body';
  }

  get container() {
    return this.customContainerExist ? SelectorEngine.findOne(this.options.container) : window;
  }

  get timeNow() {
    return performance.now();
  }

  get dragEl() {
    const dragBtnExist = this.options.dragHandle.length;
    if (dragBtnExist) {
      let dragBtn = SelectorEngine.findOne(this.options.dragHandle, this._element);
      dragBtn = !dragBtn ? this._element : dragBtn;
      return dragBtn;
    }

    return this._element;
  }

  get containerTop() {
    const containerTopOffset = this.customContainerExist
      ? this.container.getBoundingClientRect().top
      : 1;
    const elTopOffset = this._element.getBoundingClientRect().top;

    return this.customContainerExist ? elTopOffset - containerTopOffset : 1;
  }

  get containerBottom() {
    return (
      this.customContainerExist &&
      -this.containerTop +
        this.container.getBoundingClientRect().height -
        this._element.getBoundingClientRect().height
    );
  }

  get containerLeft() {
    const containerLeftOffset = this.customContainerExist
      ? this.container.getBoundingClientRect().left
      : 1;
    const elLeftOffset = this._element.getBoundingClientRect().left;

    return this.customContainerExist ? elLeftOffset - containerLeftOffset : 1;
  }

  get containerRight() {
    return (
      this.customContainerExist &&
      this.container.getBoundingClientRect().width -
        this._element.getBoundingClientRect().width -
        this.containerLeft
    );
  }

  get containerScrollableY() {
    return this.container.scrollHeight > this.container.clientHeight;
  }

  get containerScrollableX() {
    return this.container.scrollWidth > this.container.clientWidth;
  }

  // Public
  dispose() {
    EventHandler.off(this.dragEl, 'touchstart', this._dragStart);
    EventHandler.off(this.dragEl, 'mousedown', this._dragStart);
    EventHandler.off(window, 'resize', this._takeAgainCoordinates);
    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  resetPosition() {
    this._element.classList.add(CLASS_NAME_RETURN_ANIMATION);
    this._setTranslate(0, 0);
    this._xOffset = 0;
    this._yOffset = 0;

    setTimeout(() => {
      this._element.classList.remove(CLASS_NAME_RETURN_ANIMATION);
    }, 350);
  }

  // Private
  _setup() {
    if (!this.options.disabled) {
      this._dragTriggers();
      Manipulator.addClass(this.dragEl, CLASS_NAME_CURSOR_GRAB);
    } else {
      Manipulator.addClass(this.dragEl, CLASS_NAME_DISABLED);
    }
  }

  _dragTriggers() {
    EventHandler.on(this.dragEl, 'touchstart', this._dragStart);
    EventHandler.on(this.dragEl, 'mousedown', this._dragStart);
    EventHandler.on(window, 'resize', this._takeAgainCoordinates);
  }

  _dragStart(e) {
    this._timeStart = this.timeNow;
    if (this.options.delay > 0) {
      this._delayTimeout = setTimeout(() => {
        this._turnOnAnimations();
        this._getInitialPos(e);
      }, this.options.delay);
    } else {
      this._turnOnAnimations();
      this._getInitialPos(e);
    }

    EventHandler.on(this.container, 'touchend', this._dragEnd);
    this.container.addEventListener('touchmove', this._drag, { passive: false });

    EventHandler.on(window, 'mouseup', this._dragEnd);
    EventHandler.on(window, 'mousemove', this._drag);
  }

  _getInitialPos(e) {
    EventHandler.trigger(this._element, EVENT_START);
    this._dragActive = true;

    const touch = e.touches;
    const clientX = touch ? touch[0].clientX : e.clientX;
    const clientY = touch ? touch[0].clientY : e.clientY;

    const scrollLeft = this._scrollableX ? this.container.scrollLeft : 0;
    const scrollTop = this._scrollableY ? this.container.scrollTop : 0;

    this._initialX = clientX - this._xOffset + scrollLeft;
    this._initialY = clientY - this._yOffset + scrollTop;
  }

  _turnOnAnimations() {
    Manipulator.addClass(this.dragEl, this.options.draggingClass);
    Manipulator.addClass(this._element, CLASS_NAME_SHADOW);
  }

  _dragEnd() {
    this._turnOffAnimations();
    if (this._dragActive) {
      EventHandler.trigger(this._element, EVENT_END);
      this._dragActive = false;
    }

    this._initialX = this._currentX;
    this._initialY = this._currentY;

    EventHandler.off(this.container, 'touchend', this._dragEnd);
    this.container.removeEventListener('touchmove', this._drag, { passive: false });

    EventHandler.off(window, 'mouseup', this._dragEnd);
    EventHandler.off(window, 'mousemove', this._drag);
  }

  _turnOffAnimations() {
    this.dragEl.classList.remove(this.options.draggingClass);
    this._element.classList.remove(CLASS_NAME_SHADOW);
  }

  _drag(e) {
    e.preventDefault();

    this._timeEnd = this.timeNow;
    const timeExecuted = this._timeEnd - this._timeStart > this.options.delay;

    if (timeExecuted) {
      EventHandler.trigger(this._element, EVENT_MOVE);

      const isTouchMove = e.type === 'touchmove';
      const clientX = isTouchMove ? e.touches[0].clientX : e.clientX;
      const clientY = isTouchMove ? e.touches[0].clientY : e.clientY;

      const moveDistanceY = this._getDistanceY(clientY);
      const moveDistanceX = this._getDistanceX(clientX);

      const scrollLeft = this._scrollableX ? this.container.scrollLeft : 0;
      const scrollTop = this._scrollableY ? this.container.scrollTop : 0;

      this._currentX = this.options.blockXAxis ? 0 : moveDistanceX + scrollLeft;
      this._currentY = this.options.blockYAxis ? 0 : moveDistanceY + scrollTop;

      if (this.customContainerExist) {
        this._scroll(clientX, clientY);
      }

      this._xOffset = this._currentX;
      this._yOffset = this._currentY;

      this._setTranslate(this._currentX, this._currentY);
    } else {
      clearTimeout(this._delayTimeout);
      this._dragEnd();
    }
  }

  _getDistanceY(coordinates) {
    const topLimit = this._topY < coordinates - this._initialY;
    const bottomLimit = this._bottomY > coordinates - this._initialY;
    const distance = coordinates - this._initialY;

    let moveDistance = topLimit ? distance : this._topY;
    moveDistance = bottomLimit ? moveDistance : this._bottomY;
    moveDistance = this.customContainerExist ? moveDistance : distance;

    return moveDistance;
  }

  _getDistanceX(coordinates) {
    const leftLimit = this._leftX < coordinates - this._initialX;
    const rightLimit = this._rightX > coordinates - this._initialX;
    const distance = coordinates - this._initialX;

    let moveDistance = leftLimit ? distance : this._leftX;
    moveDistance = rightLimit ? moveDistance : this._rightX;
    moveDistance = this.customContainerExist ? moveDistance : distance;

    return moveDistance;
  }

  _scroll(clientX, clientY) {
    const activeRight = this._scrollActiveRight(clientX);
    const activeLeft = this._scrollActiveLeft(clientX);
    const activeBot = this._scrollActiveBot(clientY);
    const activeTop = this._scrollActiveTop(clientY);

    const scrollRight = this.container.scrollLeft + this.options.scrollPixels;
    const scrollLeft = this.container.scrollLeft - this.options.scrollPixels;
    const scrollBot = this.container.scrollTop + this.options.scrollPixels;
    const scrollTop = this.container.scrollTop - this.options.scrollPixels;

    if (activeRight) {
      this.container.scrollTo({
        left: scrollRight,
      });
    } else if (activeLeft) {
      this.container.scrollTo({
        left: scrollLeft,
      });
    }

    if (activeBot) {
      this.container.scrollTo({
        top: scrollBot,
      });
    } else if (activeTop) {
      this.container.scrollTo({
        top: scrollTop,
      });
    }
  }

  _scrollActiveRight(clientX) {
    return this._rightX < clientX - this._initialX;
  }

  _scrollActiveLeft(clientX) {
    return this._leftX > clientX - this._initialX;
  }

  _scrollActiveBot(clientY) {
    return this._bottomY < clientY - this._initialY;
  }

  _scrollActiveTop(clientY) {
    return this._topY > clientY - this._initialY;
  }

  _setTranslate(xPos, yPos) {
    Manipulator.style(this._element, {
      transform: `translate3d(${xPos}px, ${yPos}px, 0px)`,
    });
  }

  _takeAgainCoordinates() {
    this._topY = -this.containerTop + this._yOffset;
    this._bottomY = this.containerBottom + this._yOffset;
    this._leftX = -this.containerLeft + this._xOffset;
    this._rightX = this.containerRight + this._xOffset;
  }

  // Static
  static get NAME() {
    return NAME;
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data) {
        data = new Draggable(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](this);
      }
    });
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((draggableEl) => {
  let instance = Draggable.getInstance(draggableEl);
  if (!instance) {
    instance = new Draggable(draggableEl);
  }
  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Draggable.jQueryInterface;
    $.fn[NAME].Constructor = Draggable;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Draggable.jQueryInterface;
    };
  }
});

export default Draggable;
