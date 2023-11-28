import { element, getUID, typeCheckConfig } from '../../mdb/util/index';
import { getDelimeters, parseDate, getMonth, getYear, isValidDate, isValidTime } from './utils';
import { ICON_BUTTONS, TOGGLE_BUTTON } from './templates';
import ScrollBarHelper from '../../bootstrap/mdb-prefix/util/scrollbar';
import Data from '../../mdb/dom/data';
import EventHandler from '../../mdb/dom/event-handler';
import Manipulator from '../../mdb/dom/manipulator';
import SelectorEngine from '../../mdb/dom/selector-engine';
import Datepicker from '../datepicker/index';
import Timepicker from '../timepicker';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

const NAME = 'datetimepicker';
const DATA_KEY = `mdb.${NAME}`;

const CLASSNAME_DATEPICKER = 'datepicker';
const CLASSNAME_TIMEPICKER = 'timepicker';
const CLASSNAME_TOGGLE_BUTTON = `${NAME}-toggle-button`;
const CLASSNAME_INVALID_FEEDBACK = 'invalid-feedback';
const CLASSNAME_IS_INVALID = 'is-invalid';

const SELECTOR_TIMEPICKER = `.${CLASSNAME_TIMEPICKER}`;
const SELECTOR_DATEPICKER = `.${CLASSNAME_DATEPICKER}`;
const SELECTOR_DATA_TOGGLE = `[data-mdb-toggle="${NAME}"]`;
const SELECTOR_TOGGLE_BUTTON = `.${CLASSNAME_TOGGLE_BUTTON}`;
const SELECTOR_INVALID_FEEDBACK = `.${CLASSNAME_INVALID_FEEDBACK}`;

const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_OPEN = `open${EVENT_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_VALUE_CHANGED = `valueChanged${EVENT_KEY}`;

const EVENT_CLOSE_DATEPICKER = 'close.mdb.datepicker';
const EVENT_VALUE_CHANGED_TIMEPICKER = 'valueChanged.mdb.timepicker';

const BUTTONS_WRAPPER = element('div');

const Default = {
  appendValidationInfo: true,
  inline: false,
  toggleButton: true,
  container: 'body',
  disabled: false,
  disablePast: false,
  disableFuture: false,
  defaultTime: '',
  defaultDate: '',
  timepicker: {},
  datepicker: {},
  invalidLabel: 'Invalid Date or Time Format',
  showFormat: false,
};

const DefaultType = {
  appendValidationInfo: 'boolean',
  inline: 'boolean',
  toggleButton: 'boolean',
  container: 'string',
  disabled: 'boolean',
  disablePast: 'boolean',
  disableFuture: 'boolean',
  defaultTime: '(string|date|number)',
  defaultDate: '(string|date|number)',
  timepicker: 'object',
  datepicker: 'object',
  invalidLabel: 'string',
  showFormat: 'boolean',
};

class Datetimepicker extends BaseComponent {
  constructor(element, options) {
    super(element);

    this._input = SelectorEngine.findOne('input', this._element);
    this._options = this._getConfig(options);
    this._timepicker = null;
    this._datepicker = null;
    this._dateValue = this._options.defaultDate ? this._options.defaultDate : '';
    this._timeValue = this._options.defaultTime ? this._options.defaultTime : '';
    this._isInvalidTimeFormat = false;
    this._validationInfo = null;
    this._format = this._options.datepicker.format ? this._options.datepicker.format : 'dd/mm/yyyy';
    this._cancel = false;

    this._scrollBar = new ScrollBarHelper();

    this._init();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get toggleButton() {
    return SelectorEngine.findOne(SELECTOR_TOGGLE_BUTTON, this._element);
  }

  dispose() {
    EventHandler.off(this._element, 'click', this._openDatePicker);
    EventHandler.off(this._input, 'input', this._handleInput);
    EventHandler.off(this._element, 'click');

    this._removeTimePicker();
    this._removeDatepicker();
    const toggleButton = this.toggleButton;
    if (toggleButton) {
      this.toggleButton.remove();
    }
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  update(options = {}) {
    const tempOptions = this._getConfig({ ...this._options, ...options });

    EventHandler.off(this._element, 'click', this._openDatePicker);
    EventHandler.off(this._input, 'input', this._handleInput);
    EventHandler.off(this._element, 'click');

    this._removeTimePicker();
    this._removeDatepicker();
    const toggleButton = this.toggleButton;
    if (toggleButton) {
      this.toggleButton.remove();
    }

    this._options = Default;
    this._timepicker = null;
    this._datepicker = null;
    this._dateValue = null;
    this._timeValue = null;
    this._isInvalidTimeFormat = null;
    this._validationInfo = null;

    this._options = tempOptions;

    this._init();
  }

  // Private

  _init() {
    this._addDatepicker();
    this._addTimePicker();
    this._appendToggleButton();
    this._listenToToggleClick();
    this._listenToUserInput();
    this._disableInput();
    this._setInitialDefaultInput();
    this._appendValidationInfo();
    this._applyFormatPlaceholder();

    if (this._options.disablePast) {
      this._handleTimepickerDisablePast();
    }
    if (this._options.disableFuture) {
      this._handleTimepickerDisableFuture();
    }
  }

  _removeDatepicker() {
    const datepicker = this._element.querySelector('.datepicker');
    if (datepicker) {
      datepicker.remove();
    }
  }

  _addDatepicker() {
    const DATEPICKER_WRAPPER = element('div');
    DATEPICKER_WRAPPER.id = this._element.id
      ? `datepicker-${this._element.id}`
      : getUID('datepicker-');

    const DATEPICKER_INPUT = '<input type="text" class="form-control">';
    DATEPICKER_WRAPPER.innerHTML = DATEPICKER_INPUT;

    Manipulator.addClass(DATEPICKER_WRAPPER, CLASSNAME_DATEPICKER);
    this._element.appendChild(DATEPICKER_WRAPPER);
    Manipulator.style(DATEPICKER_WRAPPER, { display: 'none' });

    let datepickerOptions = {
      ...this._options.datepicker,
      ...{
        container: this._options.container,
        disablePast: this._options.disablePast,
        disableFuture: this._options.disableFuture,
      },
    };

    if (this._options.inline || this._options.datepicker.inline) {
      datepickerOptions = { ...datepickerOptions, ...{ inline: true } };
    }
    this._datepicker = new Datepicker(DATEPICKER_WRAPPER, datepickerOptions);
    this._datepicker._input.value = this._dateValue;
  }

  _removeTimePicker() {
    const timepicker = this._element.querySelector('.timepicker');
    if (timepicker) {
      timepicker.remove();
      this._scrollBar.reset();
    }
  }

  _addTimePicker() {
    const TIMEPICKER_WRAPPER = element('div');
    TIMEPICKER_WRAPPER.id = this._element.id
      ? `timepicker-${this._element.id}`
      : getUID('timepicker-');

    const TIMEPICKER_INPUT = '<input type="text" class="form-control">';
    TIMEPICKER_WRAPPER.innerHTML = TIMEPICKER_INPUT;

    Manipulator.addClass(TIMEPICKER_WRAPPER, CLASSNAME_TIMEPICKER);
    this._element.appendChild(TIMEPICKER_WRAPPER);
    Manipulator.style(TIMEPICKER_WRAPPER, { display: 'none' });

    let timepickerOptions = {
      ...this._options.timepicker,
      ...{ container: this._options.container },
    };

    if (this._options.inline || this._options.timepicker.inline) {
      timepickerOptions = { timepickerOptions, ...{ inline: true } };
    }

    this._timepicker = new Timepicker(TIMEPICKER_WRAPPER, timepickerOptions);
    this._timepicker.input.value = this._timeValue;
  }

  _addIconButtons() {
    Manipulator.addClass(BUTTONS_WRAPPER, 'buttons-container');
    BUTTONS_WRAPPER.innerHTML = ICON_BUTTONS;

    if (this._options.inline || this._options.datepicker.inline) {
      return;
    }

    this._scrollBar.hide();

    if (this._datepicker._isOpen) {
      const headerDate = SelectorEngine.findOne(`${SELECTOR_DATEPICKER}-header`, document.body);
      headerDate.appendChild(BUTTONS_WRAPPER);
    } else if (this._timepicker._modal && !this._options.timepicker.inline) {
      const header = SelectorEngine.findOne(`${SELECTOR_TIMEPICKER}-elements`, document.body);
      const headerTime = SelectorEngine.findOne(
        `${SELECTOR_TIMEPICKER}-clock-wrapper`,
        document.body
      );
      header.insertBefore(BUTTONS_WRAPPER, headerTime);
    }
  }

  _enableOrDisableToggleButton() {
    if (this._options.disabled) {
      this.toggleButton.disabled = true;
      this.toggleButton.style.pointerEvents = 'none';
    } else {
      this.toggleButton.disabled = false;
      this.toggleButton.style.pointerEvents = 'pointer';
    }
  }

  _appendToggleButton() {
    if (!this._options.toggleButton) {
      return;
    }
    this._element.insertAdjacentHTML('beforeend', TOGGLE_BUTTON);

    this._enableOrDisableToggleButton();
  }

  _appendValidationInfo() {
    const { invalidLabel, appendValidationInfo } = this._options;

    if (appendValidationInfo) {
      this._validationInfo = element('div');
      Manipulator.addClass(this._validationInfo, CLASSNAME_INVALID_FEEDBACK);
      this._validationInfo.innerHTML = invalidLabel;

      Manipulator.addStyle(this._input, { marginBottom: 0 });
      Manipulator.addStyle(this._validationInfo, { bottom: '-23px' });
    }
  }

  _applyFormatPlaceholder() {
    if (this._options.showFormat) {
      this._input.placeholder = this._format;
    }
  }

  _listenToCancelClick() {
    const DATEPICKER_CANCEL_BTN = SelectorEngine.findOne(
      `${SELECTOR_DATEPICKER}-cancel-btn`,
      document.body
    );

    EventHandler.one(DATEPICKER_CANCEL_BTN, 'mousedown', () => {
      this._cancel = true;
      this._scrollBar.reset();
      EventHandler.off(DATEPICKER_CANCEL_BTN, 'mousedown');
    });
  }

  _listenToToggleClick() {
    EventHandler.on(this._element, 'click', SELECTOR_DATA_TOGGLE, (event) => {
      event.preventDefault();
      this._openDatePicker();
    });
  }

  _listenToUserInput() {
    EventHandler.on(this._input, 'input', (event) => {
      this._handleInput(event.target.value);
    });
  }

  _disableInput() {
    if (this._options.disabled) {
      this._input.disabled = 'true';
    }
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, DefaultType);
    return config;
  }

  _handleInput(input) {
    const dateTimeSplited = input.split(', ');
    const dateDelimeters = getDelimeters(this._format);

    const inputFirstValue = dateTimeSplited[0];
    const inputSecondValue = dateTimeSplited[1] || '';

    const date = parseDate(
      inputFirstValue,
      this._format,
      dateDelimeters,
      this._datepicker._options
    );

    if (!inputFirstValue) {
      this._removeInvalidClass(this._input);
    } else if (dateTimeSplited.length === 2) {
      const isInputValid = isValidDate(date) && isValidTime(inputSecondValue);

      if (isInputValid) {
        this._dateValue = inputFirstValue;
        this._timeValue = inputSecondValue;
        this._removeInvalidClass(this._input);
        this._datepicker._input.value = this._dateValue;
        this._datepicker._activeDate = this._dateValue;
        this._datepicker._selectedYear = getYear(date);
        this._datepicker._selectedMonth = getMonth(date);
        this._datepicker._headerDate = date;
        this._timepicker.input.value = this._timeValue;
        this._timepicker._isInvalidTimeFormat = false;
      } else {
        this._datepicker._activeDate = new Date();
        this._datepicker._selectedDate = null;
        this._datepicker._selectedMonth = null;
        this._datepicker._selectedYear = null;
        this._datepicker._headerDate = null;
        this._datepicker._headerMonth = null;
        this._datepicker._headerYear = null;
        this._timepicker._isInvalidTimeFormat = true;
        this._addInvalidClass(this._input, this._validationInfo);
      }
    } else {
      this._addInvalidClass(this._input, this._validationInfo);
    }
  }

  _addInvalidClass() {
    const { appendValidationInfo } = this._options;
    if (appendValidationInfo) {
      Manipulator.addClass(this._input, CLASSNAME_IS_INVALID);

      if (!SelectorEngine.findOne(SELECTOR_INVALID_FEEDBACK)) {
        this._input.parentNode.insertBefore(this._validationInfo, this._input.nextSibling);
      }
    }
  }

  _removeInvalidClass(input) {
    Manipulator.removeClass(input, CLASSNAME_IS_INVALID);
    this._isInvalidTimeFormat = false;
    const allInvalid = SelectorEngine.findOne(SELECTOR_INVALID_FEEDBACK);

    if (allInvalid === null) {
      return;
    }
    allInvalid.remove();
  }

  _openDatePicker() {
    const openEvent = EventHandler.trigger(this._element, EVENT_OPEN);

    if (openEvent.defaultPrevented) {
      return;
    }

    this._datepicker.open();

    if (!this._options.inline) {
      this._scrollBar.hide();
    }

    if (this._options.inline || this._options.datepicker.inline) {
      this._openDropdownDate();
    }
    this._addIconButtons();

    this._listenToCancelClick();

    if (this._options.inline && this._datepicker._isOpen) {
      this.toggleButton.style.pointerEvents = 'none';
    }

    EventHandler.one(this._datepicker._element, EVENT_CLOSE_DATEPICKER, () => {
      this._dateValue = this._datepicker._input.value;
      this._updateInputValue();

      if (this._cancel) {
        this._cancel = false;
        return;
      }

      EventHandler.on(this._datepicker.container, 'click', (e) => {
        if (!this._datepicker._selectedDate && e.target.classList.contains('datepicker-ok-btn')) {
          return;
        }
        this._openTimePicker();
      });
      setTimeout(() => {
        const timepicker = SelectorEngine.findOne(`${SELECTOR_TIMEPICKER}-wrapper`, document.body);
        if (!timepicker) {
          this._scrollBar.reset();
        }
      }, 10);
      if (this._options.inline) {
        this.toggleButton.style.pointerEvents = 'auto';
      }
    });

    const CLOCK_BTN = SelectorEngine.findOne(`${SELECTOR_TIMEPICKER}-button-toggle`, document.body);
    EventHandler.on(CLOCK_BTN, 'click', () => {
      this._datepicker.close();
      this._scrollBar.hide();
      EventHandler.trigger(this._datepicker._element, EVENT_CLOSE_DATEPICKER);
    });
  }

  _handleTimepickerDisablePast() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    EventHandler.on(this._datepicker._element, 'dateChange.mdb.datepicker', () => {
      if (this._datepicker._selectedDate.getTime() === currentDate.getTime()) {
        this._timepicker.update({ disablePast: true });
      } else {
        this._timepicker.update({ disablePast: false });
      }
    });
  }

  _handleTimepickerDisableFuture() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    EventHandler.on(this._datepicker._element, 'dateChange.mdb.datepicker', () => {
      if (this._datepicker._selectedDate.getTime() === currentDate.getTime()) {
        this._timepicker.update({ disableFuture: true });
      } else {
        this._timepicker.update({ disableFuture: false });
      }
    });
  }

  _handleEscapeKey() {
    EventHandler.one(document.body, 'keyup', () => {
      setTimeout(() => {
        const timepicker = SelectorEngine.findOne(`${SELECTOR_TIMEPICKER}-wrapper`, document.body);
        if (!timepicker) {
          this._scrollBar.reset();
        }
      }, 250);
    });
  }

  _handleCancelButton() {
    const CANCEL_BTN = SelectorEngine.findOne(`${SELECTOR_TIMEPICKER}-cancel`, document.body);
    EventHandler.one(CANCEL_BTN, 'mousedown', () => {
      this._scrollBar.reset();
    });
  }

  _openDropdownDate() {
    const datePopper = this._datepicker._popper;
    datePopper.state.elements.reference = this._input;
    this._scrollBar.reset();
  }

  _openTimePicker() {
    EventHandler.trigger(this._timepicker.elementToggle, 'click');
    setTimeout(() => {
      this._addIconButtons();

      if (this._options.inline || this._options.timepicker.inline) {
        this._openDropdownTime();
      }
      if (this._timepicker._modal) {
        const CANCEL_BTN = SelectorEngine.findOne(`${SELECTOR_TIMEPICKER}-cancel`, document.body);
        this._handleEscapeKey();
        this._handleCancelButton();
        EventHandler.on(this._timepicker._modal, 'click', (e) => {
          if (
            e.target.classList.contains(`${CLASSNAME_TIMEPICKER}-wrapper`) ||
            e.target.classList.contains(`${CLASSNAME_TIMEPICKER}-submit`)
          ) {
            setTimeout(() => {
              this._scrollBar.reset();
            }, 200);
          }
          if (e.target.classList.contains(`${CLASSNAME_TIMEPICKER}-clear`)) {
            EventHandler.trigger(this._timepicker._element, EVENT_VALUE_CHANGED_TIMEPICKER);
          }
          if (e.target.classList.contains(`${CLASSNAME_DATEPICKER}-button-toggle`)) {
            EventHandler.trigger(CANCEL_BTN, 'click');
            setTimeout(() => {
              this._openDatePicker();
              this._scrollBar.hide();
            }, 200);
          }
        });
      }
    });

    EventHandler.one(this._timepicker._element, EVENT_VALUE_CHANGED_TIMEPICKER, () => {
      this._timeValue = this._timepicker.input.value;
      this._updateInputValue();
      EventHandler.trigger(this._element, EVENT_CLOSE);
    });
  }

  _openDropdownTime() {
    const timePopper = this._timepicker._popper;
    timePopper.state.elements.reference = this._input;
    timePopper.update();
    this._scrollBar.reset();
  }

  _setInitialDefaultInput() {
    const shouldUpdate = this._options.defaultDate || this._options.defaultTime;

    if (shouldUpdate) {
      this._updateInputValue();
    }
  }

  _updateInputValue() {
    const isDateTimeFilled = this._timeValue && this._dateValue;

    if (isDateTimeFilled) {
      this._input.value = `${this._dateValue}, ${this._timeValue}`;
      this._removeInvalidClass(this._input);

      const changeEvent = EventHandler.trigger(this._element, EVENT_VALUE_CHANGED);

      if (changeEvent.defaultPrevented) {
        return;
      }
    }

    EventHandler.trigger(this._input, 'focus');
  }

  // static

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Datetimepicker(this, _config);
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

export default Datetimepicker;
