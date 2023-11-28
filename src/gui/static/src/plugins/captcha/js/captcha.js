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

const NAME = 'captcha';
const DATA_KEY = 'mdb.captcha';
const EVENT_KEY = `.${DATA_KEY}`;

const EVENT_EXPIRE = `captchaExpire${EVENT_KEY}`;
const EVENT_ERROR = `captchaError${EVENT_KEY}`;
const EVENT_SUCCESS = `captchaSuccess${EVENT_KEY}`;

const DEFAULT_OPTIONS = {
  sitekey: '',
  theme: 'light',
  size: 'normal',
  tabindex: 0,
  lang: 'en',
};
const OPTIONS_TYPE = {
  sitekey: 'string',
  theme: 'string',
  size: 'string',
  tabindex: 'number',
  lang: 'string',
};

const SELECTOR_DATA_INIT = '[data-mdb-captcha-init]';

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Captcha {
  constructor(element, options = {}) {
    this._element = element;
    this._options = this._getConfig(options);

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
      this._init();
    }
  }

  // Getters
  _getConfig(options) {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  // Public
  dispose() {
    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  reset() {
    if (this._instance === null) {
      return;
    }
    window.grecaptcha.reset(this._instance);
  }

  getResponse() {
    if (this._instance === null) {
      return null;
    }
    return window.grecaptcha.getResponse(this._instance);
  }

  onExpire() {
    EventHandler.trigger(this._element, EVENT_EXPIRE);
  }

  onError() {
    EventHandler.trigger(this._element, EVENT_ERROR);
  }

  onSuccess() {
    EventHandler.trigger(this._element, EVENT_SUCCESS);
  }

  // Private
  _init() {
    if (window.grecaptcha) {
      if (!window.grecaptcha.render) {
        setTimeout(() => {
          this._initRecaptcha();
        }, 100);
      } else {
        this._initRecaptcha();
      }
    } else {
      window.onloadCallback = () => {
        this._initRecaptcha();
      };
    }
  }

  _initRecaptcha() {
    this._instance = window.grecaptcha.render(this._element, {
      sitekey: this._options.sitekey,
      theme: this._options.theme,
      size: this._options.size,
      tabindex: this._options.tabindex,
      hl: this._options.lang,
      callback: () => {
        this.onSuccess();
      },
      'expired-callback': () => {
        this.onExpire();
      },
      'error-callback': () => {
        this.onError();
      },
    });
  }

  // Static
  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Captcha(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](options);
      }
    });
  }

  static get NAME() {
    return NAME;
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }
}

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((captcha) => {
  let instance = Captcha.getInstance(captcha);
  if (!instance) {
    instance = new Captcha(captcha);
  }
});

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Captcha.jQueryInterface;
    $.fn[NAME].Constructor = Captcha;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Captcha.jQueryInterface;
    };
  }
});

export default Captcha;
