import { getjQuery, typeCheckConfig, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';

import { ESCAPE, HOME, END, LEFT_ARROW, RIGHT_ARROW } from './mdb/util/keycodes';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'onboarding';
const DATA_KEY = 'mdb.onboarding';

const EVENT_START = `start.${DATA_KEY}`;
const EVENT_END = `end.${DATA_KEY}`;
const EVENT_OPEN = `open.${DATA_KEY}`;
const EVENT_CLOSE = `close.${DATA_KEY}`;
const EVENT_NEXT_STEP = `next.${DATA_KEY}`;
const EVENT_PREV_STEP = `prev.${DATA_KEY}`;

const SELECTOR_BTN_PREV = '.prev';
const SELECTOR_BTN_NEXT = '.next';
const SELECTOR_BTN_CLOSE = '.end';
const SELECTOR_BTN_CONTROL = '.control';

const SELECTOR_DATA_INIT = '[data-mdb-onboarding-init]';

const DEFAULT_OPTIONS = {
  nextLabel: 'Next',
  prevLabel: 'Back',
  skipLabel: 'Skip',
  finishLabel: 'Finish',
  pauseLabel: 'Pause',
  resumeLabel: 'Resume',
  steps: [],
  startTrigger: '',
  startEvent: 'click',
  autostart: false,
  autoplay: false,
  startDelay: 0,
  stepsDuration: 0,
  autoscroll: true,
  startIndex: 1,
  debounce: 300,
  backdrop: false,
  backdropOpacity: 0.5,
  btnMain: 'btn-primary',
  btnClose: 'btn-danger',
  btnPause: 'btn-primary',
  btnResume: 'btn-success',
  autofocus: false,
  customClass: '',
};
const OPTIONS_TYPE = {
  nextLabel: 'string',
  prevLabel: 'string',
  skipLabel: 'string',
  finishLabel: 'string',
  pauseLabel: 'string',
  resumeLabel: 'string',
  steps: 'array',
  startTrigger: 'string',
  startEvent: 'string',
  autostart: 'boolean',
  autoplay: 'boolean',
  startDelay: 'number',
  stepsDuration: 'number',
  autoscroll: 'boolean',
  startIndex: 'number',
  debounce: 'number',
  backdrop: 'boolean',
  backdropOpacity: 'number',
  btnMain: 'string',
  btnClose: 'string',
  btnPause: 'string',
  btnResume: 'string',
  autofocus: 'boolean',
  customClass: 'string',
};

const STEP_OPTIONS_TYPE = {
  nextLabel: 'string',
  prevLabel: 'string',
  skipLabel: 'string',
  finishLabel: 'string',
  pauseLabel: 'string',
  resumeLabel: 'string',
  btnMain: 'string',
  btnClose: 'string',
  btnPause: 'string',
  btnResume: 'string',
  onboardingContent: 'string',
  placement: 'string',
  index: 'number',
  target: '(string || null)',
  node: 'element',
  backdrop: '(boolean || null)',
  backdropOpacity: 'number',
  duration: 'number',
  autoplay: 'boolean',
  title: 'string',
};

const STEP_OPTIONS_DEFAULT = {
  nextLabel: '',
  prevLabel: '',
  skipLabel: '',
  finishLabel: '',
  pauseLabel: '',
  resumeLabel: '',
  btnMain: '',
  btnClose: '',
  btnPause: '',
  btnResume: '',
  onboardingContent: '',
  placement: 'bottom',
  index: null,
  target: null,
  node: null,
  backdrop: null,
  backdropOpacity: 0.6,
  duration: 0,
  autoplay: true,
  title: '',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Onboarding {
  constructor(element, options = {}) {
    this._element = element;

    this._options = this._getConfig(options);

    this._triggerElement = null;

    this._steps = null;
    this._currentStepIndex = null;
    this._currentStep = null;
    this._currentPopover = null;

    this._isPopoverOpen = false;

    this._container = null;
    this._canvas = null;
    this._ctx = null;

    this._debounceTimeId = null;

    this._autoPlayInterval = null;
    this._remainingInterval = null;
    this._isPaused = false;
    this._startTime = null;

    this._observer = null;

    this._openStepClickHandler = (e) => this._handleOpenStepClicks(e);
    this._openStepKeydownHandler = (e) => this._debounceStepKeyDown(e);
    this._canvasScrollHandler = (e) => this._handleCanvasContainerScroll(e);
    this._canvasResizeHandler = (e) => this._handleCanvasResize(e);

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }

    this._init();
  }

  // Getters

  get prevBtn() {
    return SelectorEngine.findOne(SELECTOR_BTN_PREV, this._currentPopover.tip);
  }

  get nextBtn() {
    return SelectorEngine.findOne(SELECTOR_BTN_NEXT, this._currentPopover.tip);
  }

  get closeBtn() {
    return SelectorEngine.findOne(SELECTOR_BTN_CLOSE, this._currentPopover.tip);
  }

  get controlBtn() {
    return SelectorEngine.findOne(SELECTOR_BTN_CONTROL, this._currentPopover.tip);
  }

  // Public
  dispose() {
    if (this._isPopoverOpen) {
      this._handlePopoverClose();
    }

    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  open(index) {
    this._setCurrentStepIndex(index || this._options.startIndex - 1);
    this._handleToggleStep();
  }

  close() {
    this._handlePopoverClose();
  }

  nextStep() {
    this._setCurrentStepIndex(this._currentStepIndex + 1);
    this._handleToggleStep();
  }

  prevStep() {
    this._setCurrentStepIndex(this._currentStepIndex - 1);
    this._handleToggleStep();
  }

  pause() {
    this._pauseInterval();
  }

  resume() {
    this._resumeInterval();
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
    if (this._options.steps.length) {
      this._steps = this._getStepsFromJS(this._options.steps);
    } else {
      const elements = SelectorEngine.find('[data-mdb-step]', this._element);
      this._steps = this._getStepsFromHTML(elements);
    }

    if (this._options.autoplay) {
      this._steps.forEach((step) => {
        step.duration = step.duration !== 0 ? step.duration : this._options.stepsDuration;
      });
    }

    this._initPopovers();

    this._getStartingOptions();
  }

  _getStepsFromJS(objectList) {
    const steps = [];

    objectList.forEach((item) => {
      const nodeElement = SelectorEngine.findOne(`[data-mdb-target=${item.target}]`);

      item = {
        ...STEP_OPTIONS_DEFAULT,
        ...item,
        node: nodeElement,
        nextLabel: item.nextLabel ? item.nextLabel : this._options.nextLabel,
        prevLabel: item.prevLabel ? item.prevLabel : this._options.prevLabel,
        skipLabel: item.skipLabel ? item.skipLabel : this._options.skipLabel,
        finishLabel: item.finishLabel ? item.finishLabel : this._options.finishLabel,
        pauseLabel: item.pauseLabel ? item.pauseLabel : this._options.pauseLabel,
        resumeLabel: item.resumeLabel ? item.resumeLabel : this._options.resumeLabel,
        btnMain: item.btnMain ? item.btnMain : this._options.btnMain,
        btnClose: item.btnClose ? item.btnClose : this._options.btnClose,
        btnPause: item.btnPause ? item.btnPause : this._options.btnPause,
        btnResume: item.btnResume ? item.btnResume : this._options.btnResume,
      };

      typeCheckConfig(NAME, item, STEP_OPTIONS_TYPE);
      steps.push(item);
    });

    return steps.sort((a, b) => this._sortByStepIndex(a, b));
  }

  _getStepsFromHTML(nodeList) {
    const steps = [];

    nodeList.forEach((item) => {
      steps.push(this._parseHTMLSteps(item));
    });

    return steps.sort((a, b) => this._sortByStepIndex(a, b));
  }

  _parseHTMLSteps(item) {
    const attributes = Manipulator.getDataAttributes(item);
    if (!attributes) {
      return;
    }

    const data = {
      ...STEP_OPTIONS_DEFAULT,
      ...attributes,
      index: parseInt(attributes.index, 10),
      node: item,
      nextLabel: attributes.nextLabel ? attributes.nextLabel : this._options.nextLabel,
      prevLabel: attributes.prevLabel ? attributes.prevLabel : this._options.prevLabel,
      skipLabel: attributes.skipLabel ? attributes.skipLabel : this._options.skipLabel,
      finishLabel: attributes.finishLabel ? attributes.finishLabel : this._options.finishLabel,
      pauseLabel: attributes.pauseLabel ? attributes.pauseLabel : this._options.pauseLabel,
      resumeLabel: attributes.resumeLabel ? attributes.resumeLabel : this._options.resumeLabel,
      btnMain: attributes.btnMain ? attributes.btnMain : this._options.btnMain,
      btnClose: attributes.btnClose ? attributes.btnClose : this._options.btnClose,
      btnPause: attributes.btnPause ? attributes.btnPause : this._options.btnPause,
      btnResume: attributes.btnResume ? attributes.btnResume : this._options.btnResume,
    };

    typeCheckConfig(NAME, data, STEP_OPTIONS_TYPE);

    // eslint-disable-next-line consistent-return
    return data;
  }

  _sortByStepIndex(a, b) {
    if (a.index < b.index) {
      return -1;
    }
    if (a.index > b.index) {
      return 1;
    }
    return 0;
  }

  _getStartingOptions() {
    const { startTrigger, startEvent, autostart, startDelay } = this._options;
    // start onboarding automatically after specific amount of time passed by user in seconds, default 0
    if (autostart || startDelay !== 0) {
      window.setTimeout(() => {
        this._start();
      }, startDelay * 1000);
    }
    if (startTrigger && startEvent) {
      // check if user wants to start onboarding via event on specific element e.g. button click
      let triggerElement = SelectorEngine.findOne(startTrigger, this._element);

      if (startTrigger === 'window') {
        triggerElement = window;
      }

      this._triggerElement = triggerElement;

      EventHandler.on(this._triggerElement, startEvent, () => {
        this._start();
      });
    }
  }

  _start() {
    if (this._currentStep) {
      this._handlePopoverClose();
    }
    EventHandler.trigger(this._element, EVENT_START);

    this._setCurrentStepIndex(this._options.startIndex - 1);

    this._toggleStep();
  }

  _handleAutoToggle() {
    this._autoPlayInterval = setInterval(() => {
      if (this._currentStepIndex + 1 >= this._steps.length) {
        this._handlePopoverClose();
        return;
      }

      this._setCurrentStepIndex(this._currentStepIndex + 1);
      this._toggleStep();
      this._startTime = Date.now();
    }, this._currentStep.duration * 1000);
  }

  _setCurrentStepIndex(index) {
    if (index > this._steps.length - 1 || index < 0) {
      return;
    }

    if (index > this._currentStepIndex) {
      EventHandler.trigger(this._element, EVENT_NEXT_STEP, {
        onboarding: this._element,
        nextStepIndex: index,
        currentStepIndex: this._currentStepIndex,
      });
    } else if (index < this._currentStepIndex) {
      EventHandler.trigger(this._element, EVENT_PREV_STEP, {
        onboarding: this._element,
        prevStepIndex: index,
        currentStepIndex: this._currentStepIndex,
      });
    }

    this._currentStepIndex = index;
  }

  _toggleStep() {
    this._currentStep = this._steps[this._currentStepIndex];

    this._checkStepAutoPlay();

    const newPopover = this._currentStep.popover;

    if (this._currentPopover && this._currentPopover._element !== newPopover._element) {
      this._currentPopover.hide();
    }

    this._currentPopover = newPopover;

    if (this._options.autoscroll) {
      this._handleWithScrollToggle();
    } else {
      this._currentPopover.show();
    }

    if (
      (this._currentStep.backdrop !== false && this._currentStep.backdrop !== null) ||
      (this._options.backdrop && this._currentStep.backdrop !== false)
    ) {
      if (!this._canvas) {
        this._createCanvas();
      }
      this._createBackdrop();
    } else {
      this._clearCanvas();
    }

    setTimeout(() => {
      this._setOpenStepEventHandlers();
    });

    this._isPopoverOpen = true;
    EventHandler.trigger(this._element, EVENT_OPEN, {
      onboarding: this._element,
      currentStep: this._currentStep,
    });
  }

  _createPopoverObserver() {
    this._observer = new MutationObserver(() => {
      const popover = SelectorEngine.findOne('.popover');

      if (popover && popover.classList.contains('show')) {
        if (this._options.customClass) Manipulator.addClass(popover, this._options.customClass);

        setTimeout(() => {
          popover.setAttribute('tabindex', '-1');

          if (this._options.autofocus) popover.focus();

          this._observer.disconnect();
        }, 100);
      }
    });

    this._observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }

  _createBackdrop() {
    const { left } = this._getCanvasBounding();
    const step = this._currentStep.node;
    const stepRect = step.getBoundingClientRect();

    this._clearCanvas();
    this._fillCanvas();

    if (this._container && this._container !== window) {
      this._ctx.clearRect(
        stepRect.left - 5 - left,
        step.offsetTop - this._container.offsetTop - 5 - this._container.scrollTop,
        stepRect.width + 10,
        stepRect.height + 10
      );

      // canvas doesn't support container overflow so updating canvas on scroll is needed
      EventHandler.on(this._container, 'scroll', this._canvasScrollHandler);
    } else {
      this._ctx.clearRect(
        stepRect.left - 5,
        stepRect.top - 5 + window.scrollY,
        stepRect.width + 10,
        stepRect.height + 10
      );
    }

    EventHandler.on(window, 'resize', this._canvasResizeHandler);
  }

  _createCanvas() {
    const canvas = document.createElement('canvas');
    Manipulator.addClass(canvas, 'onboarding-backdrop');

    if (this._container && this._container !== window) {
      this._container.appendChild(canvas);
    } else {
      document.body.appendChild(canvas);
    }

    this._canvas = canvas;

    const { left, top, width, height } = this._getCanvasBounding();

    this._setCanvasDimensions(left, top, width, height);

    this._ctx = this._canvas.getContext('2d');
  }

  _clearCanvas() {
    if (!this._canvas) {
      return;
    }
    this._ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  _fillCanvas() {
    let opacity;
    if (this._currentStep.backdrop) {
      opacity = this._currentStep.backdropOpacity;
    } else if (this._options.backdrop) {
      opacity = this._options.backdropOpacity;
    }

    this._ctx.fillStyle = `rgba(0,0,0, ${opacity})`;
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
  }

  _getCanvasBounding() {
    let left;
    let top;
    let width;
    let height;

    if (this._container && this._container !== window) {
      const rect = this._container.getBoundingClientRect();

      left = rect.left;
      top = rect.top + window.scrollY;
      width = this._container.clientWidth;
      height = rect.height;
    } else {
      const body = document.body;
      const html = document.documentElement;

      const maxHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
      left = 0;
      top = 0;
      width = body.clientWidth;
      height = maxHeight;
    }

    return { left, top, width, height };
  }

  _setCanvasDimensions(left, top, width, height) {
    this._canvas.style.top = `${top}px`;
    this._canvas.style.left = `${left}px`;

    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;
    this._canvas.style.position = 'absolute';

    this._canvas.width = width;
    this._canvas.height = height;
  }

  _removeCanvas() {
    this._canvas.parentNode.removeChild(this._canvas);
    EventHandler.off(this._container, 'scroll', this._canvasScrollHandler);
    EventHandler.off(window, 'resize', this._canvasResizeHandler);

    this._canvas = null;
    this._ctx = null;
  }

  _handleCanvasContainerScroll() {
    if (
      (this._currentStep.backdrop === false && !this._currentStep.backdrop) ||
      (!this._options.backdrop && !this._currentStep.backdrop)
    ) {
      EventHandler.off(this._container, 'scroll', this._canvasScrollHandler);
      return;
    }

    const { left } = this._getCanvasBounding();
    const step = this._steps[this._currentStepIndex].node;
    const stepRect = step.getBoundingClientRect();

    this._clearCanvas();
    this._fillCanvas();

    this._ctx.clearRect(
      stepRect.left - 5 - left,
      step.offsetTop - this._container.offsetTop - 5 - this._container.scrollTop,
      stepRect.width + 10,
      stepRect.height + 10
    );
  }

  _handleCanvasResize() {
    if (!this._canvas) {
      return;
    }

    this._removeCanvas();
    this._createCanvas();
    this._createBackdrop();
  }

  _handleWithScrollToggle() {
    return this._handleScrollIntoStep().then(() => {
      if (this._currentPopover) {
        this._currentPopover.show();
      }
    });
  }

  _setOpenStepEventHandlers() {
    EventHandler.on(document, 'click', this._openStepClickHandler);
    EventHandler.on(document, 'keydown', this._openStepKeydownHandler);

    this._createPopoverObserver();
  }

  _initPopovers() {
    this._steps.forEach((step) => {
      this._createPopover(step);
    });
  }

  _createPopover(step) {
    const template = this._popoverContentTemplate(step);

    step.popover = new mdb.Popover(step.node, {
      trigger: 'manual',
      placement: step.placement,
      html: true,
      content: template,
      sanitize: false,
      title: step.title.length > 0 ? step.title : `${step.index} / ${this._steps.length}`,
    });
  }

  _handleScrollIntoStep() {
    const step = this._steps[this._currentStepIndex];
    const container = this._getScrollContainer(step.node);

    if (container !== document.body) {
      this._container = container;
      return this._scrollContainerToStep(step);
    }

    this._container = window;
    return this._scrollWindowToStep(step);
  }

  _scrollWindowToStep(step) {
    const windowHeight = window.innerHeight;
    const windowScroll = window.scrollY;

    const rect = step.node.getBoundingClientRect();
    const stepHeight = rect.height;
    const stepOffset = rect.top + windowScroll;

    const scrollTop = this._getScrollTop(step.placement, stepOffset, stepHeight, windowHeight);
    return new Promise((resolve) => {
      this._scrollTo(scrollTop).then(() => {
        resolve();
      });
    });
  }

  _scrollContainerToStep(step) {
    const windowHeight = window.innerHeight;
    const windowScroll = window.scrollY;

    const rect = this._container.getBoundingClientRect();
    const containerHeight = rect.height;
    const containerOffset = rect.top + windowScroll;
    const maxContainerScroll = this._container.scrollHeight - this._container.clientHeight;

    const stepHeight = step.node.clientHeight;
    const stepOffset = step.node.offsetTop - containerOffset;

    const scrollTop = Math.min(
      this._getScrollTop(step.placement, stepOffset, stepHeight, containerHeight),
      maxContainerScroll
    );

    let windowScrollTop;

    // check whether window scroll needs to be updated
    if (containerHeight < windowHeight) {
      windowScrollTop = containerOffset - (windowHeight - containerHeight) / 2;
    } else if (containerHeight > windowHeight) {
      windowScrollTop = containerOffset + scrollTop;
    }
    return new Promise((resolve) => {
      this._scrollTo(scrollTop).then(() => {
        window.scrollTo({ top: windowScrollTop, behavior: 'smooth' });
        resolve();
      });
    });
  }

  _getScrollTop(placement, elementOffset, elementHeight, containerHeight) {
    switch (placement) {
      case 'top':
        return Math.max(0, elementOffset - containerHeight / 2);
      case 'left':
      case 'right':
        return Math.max(0, elementOffset + elementHeight / 2 - containerHeight / 2);
      case 'bottom':
        return Math.max(0, elementOffset + elementHeight - containerHeight / 2);
      default:
        return Math.max(0, elementOffset + elementHeight - containerHeight / 2);
    }
  }

  _scrollTo(scrollTop) {
    return new Promise((resolve) => {
      const scrollListener = (event) => {
        if (typeof event === 'undefined') {
          resolve();
        }

        const currentScroll = event.target.scrollTop || window.scrollY;

        // scroll is not very precise so we need to check scroll position within some range
        if (this._compareWithinRange(currentScroll, scrollTop, 5)) {
          EventHandler.off(this._container, 'scroll', scrollListener);
          resolve();
        }
      };

      EventHandler.on(this._container, 'scroll', scrollListener);
      this._container.scrollTo({ top: scrollTop, behavior: 'smooth' });

      if (
        this._compareWithinRange(this._container.scrollTop, scrollTop, 5) ||
        this._compareWithinRange(this._container.scrollY, scrollTop, 5)
      ) {
        EventHandler.off(this._container, 'scroll', scrollListener);
        resolve();
      }
    });
  }

  _compareWithinRange(firstValue, secondValue, precision) {
    return firstValue >= secondValue - precision && firstValue <= secondValue + precision;
  }

  _getScrollContainer(element) {
    let style = getComputedStyle(element);
    const excludeStaticParent = style.position === 'absolute';
    const overflowRegex = /(auto|scroll)/;

    if (style.position === 'fixed') {
      return document.body;
    }

    // eslint-disable-next-line
    for (let container = element; (container = container.parentElement); ) {
      style = getComputedStyle(container);
      if (excludeStaticParent && style.position === 'static') {
        continue;
      }
      if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) return container;
    }

    return document.body;
  }

  _checkStepAutoPlay() {
    this._clearInterval();
    if (
      this._currentStep.duration !== 0 &&
      !this._autoPlayInterval &&
      this._currentStep.autoplay !== false
    ) {
      this._handleAutoToggle();
    } else if (this._currentStep.duration === 0 || this._currentStep.autoplay === false) {
      return;
    }
  }

  _handleAutoPlayControls() {
    const { pauseLabel, btnPause, btnResume, resumeLabel } = this._currentStep;

    if (this._isPaused) {
      this._resumeInterval();
      this._isPaused = false;

      this.controlBtn.textContent = pauseLabel;
      this._removeClasses(btnResume, this.controlBtn);
      this._addClasses(btnPause, this.controlBtn);
    } else if (!this._isPaused) {
      this._pauseInterval();
      this._isPaused = true;

      this.controlBtn.textContent = resumeLabel;
      this._removeClasses(btnPause, this.controlBtn);
      this._addClasses(btnResume, this.controlBtn);
    }
  }

  // in case user wants to add or remove multiple classes to a button element
  _addClasses(classes, element) {
    const classArr = classes.split(' ');
    classArr.forEach((style) => {
      Manipulator.addClass(element, style);
    });
  }

  _removeClasses(classes, element) {
    const classArr = classes.split(' ');
    classArr.forEach((style) => {
      if (element.classList.contains(style)) {
        Manipulator.removeClass(element, style);
      }
    });
  }

  _pauseInterval() {
    const duration =
      this._currentStep.duration !== 0 ? this._currentStep.duration : this._options.stepsDuration;
    this._remainingInterval = duration * 1000 - (Date.now() - this._startTime);
    clearInterval(this._autoPlayInterval);
  }

  _resumeInterval() {
    this._setCurrentStepIndex(this._currentStepIndex + 1);
    window.setTimeout(() => {
      this._toggleStep();
    }, this._remainingInterval);
    this._remainingInterval = null;
    this._startTime = null;
  }

  _clearInterval() {
    clearInterval(this._autoPlayInterval);

    this._autoPlayInterval = null;
    this._remainingInterval = null;
    this._startTime = null;
    this._isPaused = false;
  }

  _handlePopoverClose() {
    this._clearInterval();

    if (this._currentStepIndex === this._steps.length - 1) {
      EventHandler.trigger(this._element, EVENT_END);
    }
    EventHandler.trigger(this._element, EVENT_CLOSE, {
      onboarding: this._element,
      currentStep: this._currentStep,
    });

    this._currentStep = null;

    if (this._currentPopover._popper) {
      this._currentPopover.hide();
    }
    this._currentPopover = null;
    this._isPopoverOpen = false;

    if (this._canvas) {
      this._removeCanvas();
    }

    this._container = null;

    EventHandler.off(document, 'click', this._openStepClickHandler);
    EventHandler.off(document, 'keydown', this._openStepKeydownHandler);
  }

  _handleOpenStepClicks(event) {
    if (!this._currentPopover) {
      return;
    }

    const { target } = event;

    const prevBtn = target === this.prevBtn;
    const nextBtn = target === this.nextBtn;
    const closeBtn = target === this.closeBtn;
    const controlBtn = target === this.controlBtn;
    const outsideClick = !this._currentPopover.tip.contains(target);

    if (prevBtn) {
      this.prevStep();
    } else if (nextBtn) {
      this.nextStep();
    } else if (controlBtn) {
      this._handleAutoPlayControls();
    } else if (closeBtn || outsideClick) {
      this.close();
    }
  }

  _handleToggleStep() {
    if (this._autoPlayInterval) {
      this._clearInterval();
    }
    this._toggleStep();
  }

  _debounceStepKeyDown(event) {
    const debounceTime = this._options.debounce;
    if (this._debounceTimeoutId) {
      clearTimeout(this._debounceTimeoutId);
    }

    this._debounceTimeoutId = setTimeout(() => {
      this._handleKeyDown(event);
    }, debounceTime);
  }

  _handleKeyDown(event) {
    const { keyCode, shiftKey } = event;

    if (shiftKey) {
      event.preventDefault();
      if (this._currentStep.duration !== 0) {
        this._handleAutoPlayControls();
      }
      return;
    }

    switch (keyCode) {
      case ESCAPE:
        this.close();
        break;
      case LEFT_ARROW:
        event.preventDefault();
        this.prevStep();
        break;
      case RIGHT_ARROW:
        event.preventDefault();
        this.nextStep();
        break;
      case HOME:
        event.preventDefault();
        this._setCurrentStepIndex(0);
        this._handleToggleStep();
        break;
      case END:
        event.preventDefault();
        this._setCurrentStepIndex(this._steps.length - 1);
        this._handleToggleStep();
        break;
      default:
        break;
    }
  }

  _popoverContentTemplate(step) {
    const {
      index,
      prevLabel,
      nextLabel,
      pauseLabel,
      resumeLabel,
      finishLabel,
      skipLabel,
      btnMain,
      btnClose,
      btnPause,
      btnResume,
      autoplay,
      duration,
      onboardingContent,
    } = step;

    const isFirst = index === 1;
    const isLast = index === this._steps.length;
    const doneLabel = isLast ? finishLabel : skipLabel;
    const controlLabel = this._isPaused ? resumeLabel : pauseLabel;
    const isPrevDisabled = isFirst ? 'disabled' : '';
    const isNextDisabled = isLast ? 'disabled' : '';

    const btnClass = (btn) => `btn btn-sm ${btn} mx-0`;

    const mainBtn = btnClass(btnMain);
    const closeBtn = btnClass(btnClose);
    const btnControlClass = this._isPaused ? btnClass(btnResume) : btnClass(btnPause);

    return `
        <p class="popover-text">${onboardingContent}</p>
        <hr />
        <button class="${mainBtn} ${isPrevDisabled} prev" data-mdb-role="prev" data-mdb-ripple-init  aria-disabled="${!!isPrevDisabled}">${prevLabel}
    </button>
      ${
        duration !== 0 && autoplay !== false
          ? `<button class="${btnControlClass} control" data-mdb-role="pause-resume" data-mdb-ripple-init >${controlLabel}</button>`
          : ''
      }
      <button class="${mainBtn} ${isNextDisabled} next" data-mdb-role="next" data-mdb-ripple-init  aria-disabled="${!!isNextDisabled}">${nextLabel}</button>
        <button role="button" class="${closeBtn} float-right end" data-mdb-role="end" data-mdb-ripple-init >${doneLabel}</button>
    `;
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
        data = new Onboarding(this, _config);
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
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((el) => {
  let instance = Onboarding.getInstance(el);
  if (!instance) {
    instance = new Onboarding(el);
  }

  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Onboarding to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Onboarding.jQueryInterface;
    $.fn[NAME].Constructor = Onboarding;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Onboarding.jQueryInterface;
    };
  }
});
export default Onboarding;
