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

const NAME = 'countdown';
const DATA_KEY = `mdb.${NAME}`;

const CLASS_COUNTDOWN_SEPARATOR = `${NAME}-unit-separator`;

const EVENT_START = `start.${DATA_KEY}`;
const EVENT_END = `end.${DATA_KEY}`;

const SELECTOR_DATA_INIT = '[data-mdb-countdown-init]';
const SELECTOR_COUNTDOWN_UNIT = `.${NAME}-unit`;

const DEFAULT_OPTIONS = {
  countdown: '',
  countdownSeparator: '',
  countdownPosition: 'horizontal',
  countdownLabelPosition: 'vertical',
  countdownTextStyle: '',
  countdownLabelStyle: '',
  countdownTextSize: '',
  countdownInterval: 0,
};
const OPTIONS_TYPE = {
  countdown: 'string',
  countdownSeparator: '',
  countdownPosition: 'string',
  countdownLabelPosition: 'string',
  countdownTextStyle: 'string',
  countdownLabelStyle: 'string',
  countdownTextSize: 'string',
  countdownInterval: 'number',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Countdown {
  constructor(element, options = {}) {
    this._element = element;
    this._options = this._getConfig(options);

    this._countdownDate = null;

    this._countingInterval = null;

    this._dateDistance = null;
    this._previousDistance = 0;

    this._isCounting = false;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
      this._init();
    }
  }

  // Public
  dispose() {
    Data.removeData(this._element, DATA_KEY);

    this._stopCounting();

    this._dateDistance = null;

    this._element.querySelectorAll('span').forEach((span) => {
      span.innerHTML = '';
    });

    this._element = null;
  }

  stop() {
    clearInterval(this._countingInterval);

    this._countingInterval = null;
    this._isCounting = false;
    this._previousDistance = 0;

    EventHandler.trigger(this._element, EVENT_END);
  }

  start() {
    EventHandler.trigger(this._element, EVENT_START);

    this._dateDistance = this._checkDateDistance();

    this._isCounting = true;

    this._startInterval();
  }

  setCountdownDate(date) {
    if (!this._isValidDate(this._options.countdown)) {
      this._element.innerHTML = `
        <p class="note note-danger">
          <strong>Invalid Date Format: ${this._options.countdown}</strong>. Please provide
          <a href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse#ECMAScript_5_ISO-8601_format_support' target="_blank">valid date format</a>
        </p>
      `;

      return;
    }

    this._isCounting = false;
    this._previousDistance = 0;

    this._countdownDate = new Date(date).getTime();
    if (!this._isCounting) {
      this.start();
    }
  }

  // Private
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

  _setStyles() {
    const units = SelectorEngine.find(SELECTOR_COUNTDOWN_UNIT, this._element);

    units.forEach((unit) => {
      Manipulator.addClass(unit, `countdown-unit-${this._options.countdownLabelPosition}`);
    });
    Manipulator.addClass(this._element, 'countdown');
    Manipulator.addClass(this._element, `countdown-${this._options.countdownPosition}`);

    if (
      this._options.countdownSeparator !== '' &&
      !this._options.countdownPosition.includes('vertical')
    ) {
      for (let i = 0; i < units.length - 1; i++) {
        units[i].insertAdjacentHTML(
          'afterend',
          `<span class=${CLASS_COUNTDOWN_SEPARATOR}>${this._options.countdownSeparator}</span>`
        );
      }
    }
  }

  _handleInterval() {
    const firstDate = this._options.countdown;
    const step = this._options.countdownInterval * 1000;

    EventHandler.on(this._element, EVENT_END, () => {
      const dateNow = new Date(Date.now()).getTime();
      const loopRange = new Date(firstDate).getTime() + step;

      let timeFromNow = 0;

      if (dateNow > loopRange) {
        const timeDifference = dateNow - loopRange;
        let jump;

        if (timeDifference > step) {
          const passedStep = timeDifference % step;
          jump = step - passedStep;
        } else {
          jump = step - timeDifference;
        }

        timeFromNow = dateNow + jump;
      } else {
        timeFromNow = loopRange;
      }

      this.setCountdownDate(timeFromNow);
    });
  }

  _init() {
    this._setCountDownDate(this._options.countdown);

    this._startCounting();
    if (this._options.countdownInterval > 0) {
      this._handleInterval();
    }
  }

  _setCountDownDate(date) {
    if (!this._isValidDate(this._options.countdown)) {
      this._element.innerHTML = `
      <p class="note note-danger">
      <strong>Invalid Date Format: ${this._options.countdown}</strong>. Please provide
      <a href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse#ECMAScript_5_ISO-8601_format_support' target="_blank">valid date format</a>
      </p>
      `;

      return;
    }

    this._countdownDate = new Date(date).getTime();
  }

  _startCounting() {
    EventHandler.trigger(this._element, EVENT_START);

    this._isCounting = true;

    // first draw of timer counter outside interval - allows to update only those values that's changed
    this._createCounter();

    this._setStyles();

    this._startInterval();
  }

  _startInterval() {
    this._updateCounter(this._dateDistance);

    this._countingInterval = setInterval(() => {
      this._dateDistance = this._checkDateDistance();

      if (!this._isCounting || !this._dateDistance) {
        this._stopCounting();

        return;
      }

      this._updateCounter(this._dateDistance);
    }, 1000);
  }

  _isValidDate(date) {
    date = new Date(date);
    // eslint-disable-next-line no-restricted-globals
    return date instanceof Date && !isNaN(date);
  }

  _checkDateDistance() {
    const actualDate = new Date().getTime();

    let dateDistance = this._countdownDate - actualDate;

    if (dateDistance < 0) {
      return false;
    }

    if (this._previousDistance !== 0 && this._previousDistance - dateDistance > 1000) {
      dateDistance = this._previousDistance - 1000;
    }

    this._previousDistance = dateDistance;
    return dateDistance;
  }

  _createCounter() {
    const dateDistance = this._checkDateDistance();

    const timeUnits = this._calculateTime(dateDistance);

    Object.entries(timeUnits).forEach(([unit, value]) => {
      const unitElement = SelectorEngine.findOne(`.countdown-${unit}`, this._element);

      if (unitElement) {
        const template = this._generateUnitTemplate(unitElement, unit, value);
        unitElement.innerHTML = template;
        Manipulator.setDataAttribute(unitElement, unit, value);
        Manipulator.removeDataAttribute(unitElement, 'countdownLabel');
      }
    });
  }

  _updateCounter(dateDistance) {
    const timeUnits = this._calculateTime(dateDistance);

    Object.entries(timeUnits).forEach(([unit, value]) => {
      const unitElement = SelectorEngine.findOne(`.countdown-${unit}`, this._element);

      if (unitElement) {
        const dataValue = SelectorEngine.findOne('[data-mdb-countdown-value]', unitElement);

        if (dataValue.textContent === value) {
          return;
        }

        dataValue.textContent = value;
        Manipulator.setDataAttribute(unitElement, unit, value);
      }
    });
  }

  _calculateTime(distance) {
    const days = this._formatTime(Math.floor(distance / (1000 * 60 * 60 * 24)));
    const hours = this._formatTime(
      Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    );
    const minutes = this._formatTime(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
    const seconds = this._formatTime(Math.floor((distance % (1000 * 60)) / 1000));

    return { days, hours, minutes, seconds };
  }

  _formatTime(time) {
    return time > 9 ? `${time}` : `0${time}`;
  }

  _generateUnitTemplate(element, name, value) {
    const labelName = Manipulator.getDataAttribute(element, 'countdownLabel');
    const ariaName = `label-${name}`;
    const labbeledBy = `aria-labelledby="${ariaName}"`;

    const valueClass =
      this._options.countdownTextStyle !== '' ? `class="${this._options.countdownTextStyle}"` : '';

    let labelTextSize = '';
    let valueTextSize = '';

    if (this._options.countdownTextSize !== '') {
      const textSize = this._options.countdownTextSize.match(/\d+/)[0];
      const textSizeUnit = this._options.countdownTextSize.split(textSize)[1];

      labelTextSize = `style="font-size: ${textSize / 4}${textSizeUnit}"`;
      valueTextSize = `style="font-size: ${this._options.countdownTextSize}"`;
    }

    const template = `
      <span ${
        labelName ? labbeledBy : ''
      } data-mdb-countdown-value ${valueClass} ${valueTextSize}>${value}</span>
      ${
        labelName
          ? `<span name="${ariaName}" data-mdb-countdown-label class="${this._options.countdownLabelStyle}" ${labelTextSize}>${labelName}</span>`
          : ''
      }
    `;

    return template;
  }

  _stopCounting() {
    clearInterval(this._countingInterval);

    this._countingInterval = null;
    this._isCounting = false;
    this._previousDistance = 0;

    EventHandler.trigger(this._element, EVENT_END);
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
        data = new Countdown(this, _config);
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
  let instance = Countdown.getInstance(el);
  if (!instance) {
    instance = new Countdown(el);
  }

  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Countdown to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Countdown.jQueryInterface;
    $.fn[NAME].Constructor = Countdown;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Countdown.jQueryInterface;
    };
  }
});
export default Countdown;
