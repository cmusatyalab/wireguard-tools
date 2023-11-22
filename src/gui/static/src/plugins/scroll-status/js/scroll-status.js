import { typeCheckConfig, getjQuery, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';
import EventHandler from './mdb/dom/event-handler';
import ScrollBarHelper from './mdb/util/scrollbar';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'scrollStatus';
const DATA_KEY = `mdb.${NAME}`;

const CLASSNAME_SCROLL_STATUS = '.scroll-status';
const CLASSNAME_SCROLL_PROGRESS = `${CLASSNAME_SCROLL_STATUS}-progress`;

const SELECTOR_DATA_INIT = '[data-mdb-scroll-status-init]';

const EVENT_SCROLL = 'scroll';
const EVENT_HIDDEN = 'hidden.bs.modal';

const DEFAULT_OPTIONS = {
  color: '#1266F1',
  offset: 0,
  height: '10px',
  global: false,
  scroll: 0,
  target: '',
  openOnce: true,
};

const OPTIONS_TYPE = {
  color: 'string',
  offset: 'number',
  height: 'string',
  global: 'boolean',
  scroll: 'number',
  target: 'string',
  openOnce: 'boolean',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class ScrollStatus {
  constructor(element, options = {}) {
    this._element = element;
    this._options = this._getConfig(options);
    this._parent = null;
    this._progressBar = SelectorEngine.findOne(CLASSNAME_SCROLL_PROGRESS, element);
    this._isAlreadyOpenedOnce = false;
    this._isModalLocked = false;
    this._scrollPercentagePosition = 0;
    this._scrollbar = new ScrollBarHelper();

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
      this._init();
    }
  }

  // Public
  dispose() {
    Data.removeData(this._element, DATA_KEY);
    EventHandler.off(this._parent, EVENT_SCROLL);
    EventHandler.off(this._parent, EVENT_HIDDEN, () => {
      this._scrollbar.reset();
    });
    this._parent = null;
    this._progressBar = null;
    this._options = null;
    this._isAlreadyOpenedOnce = null;
    this._isModalLocked = null;
    this._scrollPercentagePosition = 0;
    this._element = null;
    this._scrollbar = null;
  }

  // Private
  _init() {
    this._setScrollTarget();
    this._setStyles();
    this._bindScrollProgress();
    this._bindModalListener();
  }

  _getConfig(options) {
    const attributes = Manipulator.getDataAttributes(this._element);

    const config = {
      ...DEFAULT_OPTIONS,
      ...attributes,
      ...options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  _bindModalListener() {
    if (!this._options.target) {
      return;
    }

    if (this._options.global) {
      this._scrollbar._element = document.body;
    } else {
      this._scrollbar._element = this._parent;
    }

    EventHandler.on(this._parent, EVENT_HIDDEN, () => {
      this._scrollbar.reset();
    });
  }

  _bindScrollProgress() {
    EventHandler.on(this._parent, EVENT_SCROLL, () => {
      this._calculateScroll();
      Manipulator.addStyle(this._progressBar, { width: `${this._scrollPercentagePosition}%` });

      if (!this._options.target || this._isAlreadyOpenedOnce) {
        return;
      }

      const shouldOpenModal =
        (!this._isModalLocked && this._scrollPercentagePosition >= this._options.scroll) ||
        (this._isModalLocked && this._scrollPercentagePosition <= this._options.scroll);

      if (shouldOpenModal) {
        this._isModalLocked = !this._isModalLocked;
        this._showModal();
        this._scrollbar.hide();
      }
    });
  }

  _calculateScroll() {
    let scrollHeight;
    let fullHeight;

    if (this._options.global) {
      scrollHeight =
        window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      fullHeight =
        document.documentElement.scrollHeight - window.innerHeight ||
        document.scrollingElement.clientHeight;
    } else {
      scrollHeight = this._parent.scrollTop;
      fullHeight = this._parent.scrollHeight - this._parent.clientHeight;
    }

    this._scrollPercentagePosition = (scrollHeight / fullHeight) * 100;
  }

  _showModal() {
    if (this._options.openOnce) {
      this._isAlreadyOpenedOnce = true;
    }

    const myModalEl = SelectorEngine.findOne(this._options.target);

    if (myModalEl) {
      const modal = new mdb.Modal(myModalEl);
      modal.show();
    }
  }

  _setScrollTarget() {
    if (this._options.global) {
      this._parent = window;
    } else {
      this._parent = this._element.parentNode;
    }
  }

  _setStyles() {
    Manipulator.addStyle(this._progressBar, { background: this._options.color });
    Manipulator.addStyle(this._element, { top: `${this._options.offset}%` });
    Manipulator.addStyle(this._progressBar, { height: this._options.height });
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
        data = new ScrollStatus(this, _config);
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
  let instance = ScrollStatus.getInstance(el);
  if (!instance) {
    instance = new ScrollStatus(el);
  }

  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .ScrollStatus to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = ScrollStatus.jQueryInterface;
    $.fn[NAME].Constructor = ScrollStatus;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return ScrollStatus.jQueryInterface;
    };
  }
});

export default ScrollStatus;
