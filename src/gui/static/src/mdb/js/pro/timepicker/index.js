/* eslint-disable consistent-return */
/* eslint-disable no-else-return */
import { createPopper } from '@popperjs/core';
import ScrollBarHelper from '../../bootstrap/mdb-prefix/util/scrollbar';
import { typeCheckConfig, element, getUID, isRTL} from '../../mdb/util/index';
import { getTimepickerTemplate, getToggleButtonTemplate } from './templates';
import Data from '../../mdb/dom/data';
import Manipulator from '../../mdb/dom/manipulator';
import EventHandler, { EventHandlerMulti } from '../../mdb/dom/event-handler';
import {
  formatToAmPm,
  toggleClassHandler,
  formatNormalHours,
  checkBrowser,
  findMousePosition,
  checkValueBeforeAccept,
  takeValue,
  setMinTime,
  setMaxTime,
  _verifyMinTimeHourAndAddDisabledClass,
  _verifyMaxTimeMinutesTipsAndAddDisabledClass,
  _verifyMinTimeMinutesTipsAndAddDisabledClass,
  _verifyMaxTimeHourAndAddDisabledClass,
  _convertHourToNumber,
} from './utils';
import FocusTrap from '../../mdb/util/focusTrap';
import SelectorEngine from '../../mdb/dom/selector-engine';
import {
  UP_ARROW,
  DOWN_ARROW,
  LEFT_ARROW,
  RIGHT_ARROW,
  ESCAPE,
  ENTER,
} from '../../mdb/util/keycodes';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'timepicker';

const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_MOUSEDOWN_DATA_API = `mousedown${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_MOUSEUP_DATA_API = `mouseup${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_MOUSEMOVE_DATA_API = `mousemove${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_MOUSELEAVE_DATA_API = `mouseleave${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_MOUSEOVER_DATA_API = `mouseover${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_TOUCHMOVE_DATA_API = `touchmove${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_TOUCHEND_DATA_API = `touchend${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_TOUCHSTART_DATA_API = `touchstart${EVENT_KEY}${DATA_API_KEY}`;

const EVENT_VALUE_CHANGED = `valueChanged${EVENT_KEY}`;
const EVENT_CLEAR = `clear${EVENT_KEY}`;

const ACTIVE_CLASS = 'active';
const AM_CLASS = `${NAME}-am`;
const BUTTON_CANCEL_CLASS = `${NAME}-cancel`;
const BUTTON_CLEAR_CLASS = `${NAME}-clear`;
const BUTTON_SUBMIT_CLASS = `${NAME}-submit`;
const CIRCLE_CLASS = `${NAME}-circle`;
const CLOCK_ANIMATION_CLASS = `${NAME}-clock-animation`;
const CLOCK_CLASS = `${NAME}-clock`;
const CLOCK_INNER_CLASS = `${NAME}-clock-inner`;
const CLOCK_WRAPPER_CLASS = `${NAME}-clock-wrapper`;
const CURRENT_CLASS = `.${NAME}-current`;
const CURRENT_INLINE_CLASS = `${NAME}-current-inline`;
const WRAPPER_OPEN_ANIMATION_CLASS = 'fade-in';
const WRAPPER_CLOSE_ANIMATION_CLASS = 'fade-out';

const HAND_CLASS = `${NAME}-hand-pointer`;
const HOUR_CLASS = `${NAME}-hour`;
const HOUR_MODE_CLASS = `${NAME}-hour-mode`;
const ICON_DOWN_CLASS = `${NAME}-icon-down`;
const ICON_INLINE_HOUR_CLASS = `${NAME}-icon-inline-hour`;
const ICON_INLINE_MINUTE_CLASS = `${NAME}-icon-inline-minute`;
const ICON_UP_CLASS = `${NAME}-icon-up`;
const ICONS_HOUR_INLINE = `${NAME}-inline-hour-icons`;
const MIDDLE_DOT_CLASS = `${NAME}-middle-dot`;
const MINUTE_CLASS = `${NAME}-minute`;
const MODAL_CLASS = `${NAME}-modal`;
const PM_CLASS = `${NAME}-pm`;
const TIPS_ELEMENT_CLASS = `${NAME}-tips-element`;
const TIPS_HOURS_CLASS = `${NAME}-time-tips-hours`;
const TIPS_INNER_ELEMENT_CLASS = `${NAME}-tips-inner-element`;
const TIPS_INNER_HOURS_CLASS = `${NAME}-time-tips-inner`;
const TIPS_MINUTES_CLASS = `${NAME}-time-tips-minutes`;
const TRANSFORM_CLASS = `${NAME}-transform`;
const WRAPPER_CLASS = `${NAME}-wrapper`;
const INPUT_CLASS = `${NAME}-input`;

const Default = {
  bodyId: '',
  cancelLabel: 'Cancel',
  clearLabel: 'Clear',
  closeModalOnBackdropClick: true,
  closeModalOnMinutesClick: false,
  container: 'body',
  defaultTime: '',
  disabled: false,
  disablePast: false,
  disableFuture: false,
  focusInputAfterApprove: false,
  footerId: '',
  format12: true,
  format24: false,
  headId: '',
  increment: false,
  inline: false,
  invalidLabel: 'Invalid Time Format',
  maxTime: '',
  minTime: '',
  modalId: '',
  okLabel: 'Ok',
  overflowHidden: true,
  pickerId: '',
  readOnly: false,
  showClearBtn: true,
  switchHoursToMinutesOnClick: true,
  iconClass: 'far fa-clock fa-sm timepicker-icon',
  withIcon: true,
  pmLabel: 'PM',
  amLabel: 'AM',
  animations: true,
};

const DefaultType = {
  bodyId: 'string',
  cancelLabel: 'string',
  clearLabel: 'string',
  closeModalOnBackdropClick: 'boolean',
  closeModalOnMinutesClick: 'boolean',
  container: 'string',
  disabled: 'boolean',
  disablePast: 'boolean',
  disableFuture: 'boolean',
  footerId: 'string',
  format12: 'boolean',
  format24: 'boolean',
  headId: 'string',
  increment: 'boolean',
  inline: 'boolean',
  invalidLabel: 'string',
  modalId: 'string',
  okLabel: 'string',
  overflowHidden: 'boolean',
  pickerId: 'string',
  readOnly: 'boolean',
  showClearBtn: 'boolean',
  switchHoursToMinutesOnClick: 'boolean',
  defaultTime: '(string|date|number)',
  iconClass: 'string',
  withIcon: 'boolean',
  pmLabel: 'string',
  amLabel: 'string',
  animations: 'boolean',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Timepicker extends BaseComponent {
  constructor(element, options = {}) {
    super(element);

    this._document = document;
    this._options = this._getConfig(options);
    this._currentTime = null;
    this._toggleButtonId = this._element.id
      ? `timepicker-toggle-${this._element.id}`
      : getUID('timepicker-toggle-');

    this.hoursArray = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    this.innerHours = ['00', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
    this.minutesArray = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

    this.input = SelectorEngine.findOne('input', this._element);
    this.dataWithIcon = element.dataset.withIcon;
    this.dataToggle = element.dataset.toggle;
    this.customIcon = SelectorEngine.findOne('.timepicker-toggle-button', this._element);

    this._checkToggleButton();

    this.inputFormatShow = SelectorEngine.findOne('[data-mdb-timepicker-format24]', this._element);

    this.inputFormat =
      this.inputFormatShow === null ? '' : Object.values(this.inputFormatShow.dataset)[0];
    this.elementToggle = SelectorEngine.findOne('[data-mdb-toggle]', this._element);
    this.toggleElement = Object.values(element.querySelector('[data-mdb-toggle]').dataset)[0];

    this._hour = null;
    this._minutes = null;
    this._AM = null;
    this._PM = null;
    this._wrapper = null;
    this._modal = null;
    this._hand = null;
    this._circle = null;
    this._focusTrap = null;
    this._popper = null;
    this._interval = null;
    this._timeoutInterval = null;

    this._inputValue =
      this._options.defaultTime !== '' ? this._options.defaultTime : this.input.value;

    if (this._options.format24) {
      this._options.format12 = false;

      this._currentTime = formatNormalHours(this._inputValue);
    }

    if (this._options.format12) {
      this._options.format24 = false;
      this._currentTime = formatToAmPm(this._inputValue);
    }

    if (this._options.readOnly) {
      this.input.setAttribute('readonly', true);
    }

    if (this.inputFormat === 'true' && this.inputFormat !== '') {
      this._options.format12 = false;
      this._options.format24 = true;
      this._currentTime = formatNormalHours(this._inputValue);
    }

    this._scrollBar = new ScrollBarHelper();

    this._animations =
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches && this._options.animations;

    this.init();
    this._isHours = true;
    this._isMinutes = false;
    this._isInvalidTimeFormat = false;
    this._isMouseMove = false;
    this._isInner = false;
    this._isAmEnabled = false;
    this._isPmEnabled = false;
    if (this._options.format12 && !this._options.defaultTime) {
      this._isPmEnabled = true;
    }

    this._objWithDataOnChange = { degrees: null };
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  // Public

  init() {
    const { format12, format24 } = this._options;
    let zero;
    let hoursFormat;
    let _amOrPm;
    Manipulator.addClass(this.input, INPUT_CLASS);

    if (this._currentTime !== undefined) {
      const { hours, minutes, amOrPm } = this._currentTime;

      zero = Number(hours) < 10 ? 0 : '';
      hoursFormat = `${zero}${Number(hours)}:${minutes}`;
      _amOrPm = amOrPm;

      if (format12) {
        this.input.value = `${hoursFormat} ${_amOrPm}`;
      } else if (format24) {
        this.input.value = `${hoursFormat}`;
      }
    } else {
      zero = '';
      hoursFormat = '';
      _amOrPm = '';

      this.input.value = '';
    }

    if (this.input.value.length > 0 && this.input.value !== '') {
      Manipulator.addClass(this.input, 'active');
    }

    if (this._options !== null || this._element !== null) {
      this._listenToUserInput();
      this._handleOpen();
      this._listenToToggleKeydown();
    }
  }

  dispose() {
    this._removeModal();

    EventHandler.off(this._document, 'click', `[data-mdb-toggle='${this.toggleElement}']`);
    EventHandler.off(this._element, 'keydown', `[data-mdb-toggle='${this.toggleElement}']`);
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    setTimeout(() => {
      super.dispose();
    }, 350 + 5);
  }

  update(options = {}) {
    this._options = this._getConfig({ ...this._options, ...options });
  }

  // private

  _checkToggleButton() {
    if (this.customIcon === null) {
      if (this.dataWithIcon !== undefined) {
        this._options.withIcon = null;

        if (this.dataWithIcon === 'true') {
          this._appendToggleButton(this._options);
        }
      }

      if (this._options.withIcon) {
        this._appendToggleButton(this._options);
      }
    }
  }

  _appendToggleButton() {
    const toggleButton = getToggleButtonTemplate(this._options, this._toggleButtonId);

    this.input.insertAdjacentHTML('afterend', toggleButton);
  }

  _getDomElements() {
    this._hour = SelectorEngine.findOne(`.${HOUR_CLASS}`);
    this._minutes = SelectorEngine.findOne(`.${MINUTE_CLASS}`);
    this._AM = SelectorEngine.findOne(`.${AM_CLASS}`);
    this._PM = SelectorEngine.findOne(`.${PM_CLASS}`);
    this._wrapper = SelectorEngine.findOne(`.${WRAPPER_CLASS}`);
    this._modal = SelectorEngine.findOne(`.${MODAL_CLASS}`);
    this._hand = SelectorEngine.findOne(`.${HAND_CLASS}`);
    this._circle = SelectorEngine.findOne(`.${CIRCLE_CLASS}`);
    this._clock = SelectorEngine.findOne(`.${CLOCK_CLASS}`);
    this._clockInner = SelectorEngine.findOne(`.${CLOCK_INNER_CLASS}`);
  }

  _handlerMaxMinHoursOptions(degrees, maxHour, minHour, maxFormat, minFormat, e) {
    if (!maxHour && !minHour) {
      return true;
    }
    const { format24, format12, disablePast, disableFuture } = this._options;
    const { _isAmEnabled, _isPmEnabled } = this;
    const key = e.keyCode;
    const _isMouseOnInnerClock =
      e.target.classList.contains('timepicker-clock-inner') ||
      e.target.classList.contains('timepicker-time-tips-inner') ||
      e.target.classList.contains('timepicker-tips-inner-element');

    minHour = setMinTime(minHour, disablePast, format12);
    maxHour = setMaxTime(maxHour, disableFuture, format12);

    let maxHourDegrees = maxHour !== '' ? maxHour * 30 : '';
    let minHourDegrees = minHour !== '' ? minHour * 30 : '';

    if (degrees <= 0) {
      degrees = 360 + degrees;
    }
    const _handleKeyboardEvents = () => {
      const tips = document.querySelectorAll('.timepicker-tips-element');
      const innerTips = document.querySelectorAll('.timepicker-tips-inner-element');
      let currentHour = _convertHourToNumber(this._hour.innerText);
      let nextHourTip;
      let numberToAdd;
      let nextHour;

      if (key === UP_ARROW) {
        numberToAdd = 1;
      } else if (key === DOWN_ARROW) {
        numberToAdd = -1;
      }

      if (currentHour === 12 && key === UP_ARROW) {
        nextHour = 1;
      } else if (currentHour === 0 && key === UP_ARROW) {
        nextHour = 13;
      } else if (currentHour === 0 && key === DOWN_ARROW) {
        nextHour = 23;
      } else if (currentHour === 13 && key === DOWN_ARROW) {
        nextHour = 0;
      } else if (currentHour === 1 && key === DOWN_ARROW) {
        nextHour = 12;
      } else {
        nextHour = currentHour + numberToAdd;
      }

      tips.forEach((tip) => {
        if (tip.textContent == nextHour) {
          nextHourTip = tip;
        }
      });
      innerTips.forEach((innerTip) => {
        if (innerTip.textContent == nextHour) {
          nextHourTip = innerTip;
        }
      });
      return !nextHourTip.parentElement.classList.contains('disabled');
    };

    const _handle24FormatMouseEvents = (e) => {
      let minInnerHourDegrees = minHour !== '' && minHour > 12 ? (minHour - 12) * 30 : '';
      let maxInnerHourDegrees = maxHour !== '' && maxHour > 12 ? (maxHour - 12) * 30 : '';

      if (
        (minInnerHourDegrees && degrees < minInnerHourDegrees) ||
        (maxInnerHourDegrees && degrees > maxInnerHourDegrees) ||
        (maxHour && maxHour < 12)
      ) {
        return;
      }
      return true;
    };

    if (format24 && e.type !== 'keydown' && _isMouseOnInnerClock) {
      return _handle24FormatMouseEvents(e);
    }
    if (e.type === 'keydown') {
      return _handleKeyboardEvents(e);
    }

    const minFormatAndCurrentFormatEqual =
      !minFormat ||
      (minFormat === 'PM' && _isPmEnabled) ||
      (minHour !== '' && minFormat === 'AM' && _isAmEnabled);

    const maxFormatAndCurrentFormatEqual =
      !maxFormat ||
      (maxFormat === 'PM' && _isPmEnabled) ||
      (maxHour !== '' && maxFormat === 'AM' && _isAmEnabled);

    const isMinHourValid = () => {
      if (!minHour) {
        return true;
      } else if (
        (minFormat === 'PM' && _isAmEnabled) ||
        (minFormatAndCurrentFormatEqual && degrees < minHourDegrees)
      ) {
        return;
      }
      return true;
    };

    const isMaxHourValid = () => {
      if (!maxHour) {
        return true;
      } else if (
        (maxFormat === 'AM' && _isPmEnabled) ||
        (maxFormatAndCurrentFormatEqual && degrees > maxHourDegrees)
      ) {
        return;
      }
      return true;
    };
    if (isMinHourValid() && isMaxHourValid()) {
      return true;
    }
  }

  _handleKeyboard() {
    EventHandler.on(this._document, EVENT_KEYDOWN_DATA_API, '', (e) => {
      let hour;
      let minute;
      let innerHour;
      let { increment, maxTime, minTime, format12, disablePast, disableFuture } = this._options;

      let [minHour, minFormat] = takeValue(minTime, false);
      let [maxHour, maxFormat] = takeValue(maxTime, false);

      minHour = setMinTime(minHour, disablePast, format12);
      maxHour = setMaxTime(maxHour, disableFuture, format12);

      const hoursView = SelectorEngine.findOne(`.${TIPS_MINUTES_CLASS}`) === null;
      const innerHoursExist = SelectorEngine.findOne(`.${TIPS_INNER_HOURS_CLASS}`) !== null;

      const degrees = Number(this._hand.style.transform.replace(/[^\d-]/g, ''));

      const allTipsMinutes = SelectorEngine.find(`.${TIPS_MINUTES_CLASS}`, this._modal);
      const allTipsHours = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`, this._modal);
      const allInnerTips = SelectorEngine.find(`.${TIPS_INNER_HOURS_CLASS}`, this._modal);

      let hourTime = this._makeHourDegrees(e.target, degrees, hour).hour;
      const { degrees: hourObjDegrees, addDegrees } = this._makeHourDegrees(
        e.target,
        degrees,
        hour
      );

      let { minute: minHourMinutes, degrees: minObjDegrees } = this._makeMinutesDegrees(
        degrees,
        minute
      );
      const addMinDegrees = this._makeMinutesDegrees(degrees, minute).addDegrees;

      let { hour: innerHourDegrees } = this._makeInnerHoursDegrees(degrees, innerHour);

      if (e.keyCode === ESCAPE) {
        const cancelBtn = SelectorEngine.findOne(`.${BUTTON_CANCEL_CLASS}`, this._modal);
        EventHandler.trigger(cancelBtn, 'click');
      } else if (hoursView) {
        if (innerHoursExist) {
          if (e.keyCode === RIGHT_ARROW) {
            this._isInner = false;
            Manipulator.addStyle(this._hand, {
              height: 'calc(40% + 1px)',
            });
            this._hour.textContent = this._setHourOrMinute(hourTime > 12 ? 1 : hourTime);
            this._toggleClassActive(this.hoursArray, this._hour, allTipsHours);
            this._toggleClassActive(this.innerHours, this._hour, allInnerTips);
          }

          if (e.keyCode === LEFT_ARROW) {
            this._isInner = true;
            Manipulator.addStyle(this._hand, {
              height: '21.5%',
            });

            this._hour.textContent = this._setHourOrMinute(
              innerHourDegrees >= 24 || innerHourDegrees === '00' ? 0 : innerHourDegrees
            );
            this._toggleClassActive(this.innerHours, this._hour, allInnerTips);
            this._toggleClassActive(this.hoursArray, this._hour - 1, allTipsHours);
          }
        }

        if (e.keyCode === UP_ARROW) {
          const isNextHourValid = this._handlerMaxMinHoursOptions(
            hourObjDegrees + 30,
            maxHour,
            minHour,
            maxFormat,
            minFormat,
            e
          );
          if (!isNextHourValid) {
            return;
          }

          const addRotate = () => {
            return Manipulator.addStyle(this._hand, {
              transform: `rotateZ(${hourObjDegrees + addDegrees}deg)`,
            });
          };

          addRotate();

          if (this._isInner) {
            innerHourDegrees += 1;

            if (innerHourDegrees === 24) {
              innerHourDegrees = 0;
            } else if (innerHourDegrees === 25 || innerHourDegrees === '001') {
              innerHourDegrees = 13;
            }

            this._hour.textContent = this._setHourOrMinute(innerHourDegrees);
            this._toggleClassActive(this.innerHours, this._hour, allInnerTips);
          } else {
            hourTime += 1;
            this._hour.textContent = this._setHourOrMinute(hourTime > 12 ? 1 : hourTime);
            this._toggleClassActive(this.hoursArray, this._hour, allTipsHours);
          }
        }
        if (e.keyCode === DOWN_ARROW) {
          const isNextHourValid = this._handlerMaxMinHoursOptions(
            hourObjDegrees - 30,
            maxHour,
            minHour,
            maxFormat,
            minFormat,
            e
          );

          if (!isNextHourValid) {
            return;
          }

          const addRotate = () => {
            return Manipulator.addStyle(this._hand, {
              transform: `rotateZ(${hourObjDegrees - addDegrees}deg)`,
            });
          };

          addRotate();
          if (this._isInner) {
            innerHourDegrees -= 1;

            if (innerHourDegrees === 12) {
              innerHourDegrees = 0;
            } else if (innerHourDegrees === -1) {
              innerHourDegrees = 23;
            }

            this._hour.textContent = this._setHourOrMinute(innerHourDegrees);
            this._toggleClassActive(this.innerHours, this._hour, allInnerTips);
          } else {
            hourTime -= 1;

            this._hour.textContent = this._setHourOrMinute(hourTime === 0 ? 12 : hourTime);
            this._toggleClassActive(this.hoursArray, this._hour, allTipsHours);
          }
        }
      } else {
        if (e.keyCode === UP_ARROW) {
          minObjDegrees += addMinDegrees;
          Manipulator.addStyle(this._hand, {
            transform: `rotateZ(${minObjDegrees}deg)`,
          });
          minHourMinutes += 1;
          if (increment) {
            minHourMinutes += 4;

            if (minHourMinutes === '0014') {
              minHourMinutes = 5;
            }
          }

          this._minutes.textContent = this._setHourOrMinute(
            minHourMinutes > 59 ? 0 : minHourMinutes
          );
          this._toggleClassActive(this.minutesArray, this._minutes, allTipsMinutes);
          this._toggleBackgroundColorCircle(`${TIPS_MINUTES_CLASS}`);
        }
        if (e.keyCode === DOWN_ARROW) {
          minObjDegrees -= addMinDegrees;
          Manipulator.addStyle(this._hand, {
            transform: `rotateZ(${minObjDegrees}deg)`,
          });
          if (increment) {
            minHourMinutes -= 5;
          } else {
            minHourMinutes -= 1;
          }

          if (minHourMinutes === -1) {
            minHourMinutes = 59;
          } else if (minHourMinutes === -5) {
            minHourMinutes = 55;
          }

          this._minutes.textContent = this._setHourOrMinute(minHourMinutes);
          this._toggleClassActive(this.minutesArray, this._minutes, allTipsMinutes);
          this._toggleBackgroundColorCircle(`${TIPS_MINUTES_CLASS}`);
        }
      }
    });
  }

  _setActiveClassToTipsOnOpen(hour, ...rest) {
    if (this._isInvalidTimeFormat) {
      return;
    }

    if (!this._options.format24) {
      [...rest].filter((e) => {
        if (e.toLowerCase() === 'pm') {
          Manipulator.addClass(this._PM, ACTIVE_CLASS);
        } else if (e.toLowerCase() === 'am') {
          Manipulator.addClass(this._AM, ACTIVE_CLASS);
        } else {
          Manipulator.removeClass(this._AM, ACTIVE_CLASS);
          Manipulator.removeClass(this._PM, ACTIVE_CLASS);
        }

        return e;
      });

      const allTipsHours = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`, this._modal);
      this._addActiveClassToTip(allTipsHours, hour);
    } else {
      const allTipsHours = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`, this._modal);
      const allInnerTips = SelectorEngine.find(`.${TIPS_INNER_HOURS_CLASS}`, this._modal);

      this._addActiveClassToTip(allTipsHours, hour);
      this._addActiveClassToTip(allInnerTips, hour);
    }
  }

  _setTipsAndTimesDependOnInputValue(hour, minute) {
    const { inline, format12 } = this._options;

    if (!this._isInvalidTimeFormat) {
      const rotateDegrees = hour > 12 ? hour * 30 - 360 : hour * 30;
      this._hour.textContent = hour;
      this._minutes.textContent = minute;

      if (!inline) {
        Manipulator.addStyle(this._hand, {
          transform: `rotateZ(${rotateDegrees}deg)`,
        });
        Manipulator.addClass(this._circle, 'active');

        if (Number(hour) > 12 || hour === '00') {
          Manipulator.addStyle(this._hand, {
            height: '21.5%',
          });
        }
      }
    } else {
      this._hour.textContent = '12';
      this._minutes.textContent = '00';

      if (!inline) {
        Manipulator.addStyle(this._hand, {
          transform: 'rotateZ(0deg)',
        });
      }
      if (format12) {
        Manipulator.addClass(this._PM, ACTIVE_CLASS);
      }
    }
  }

  _listenToToggleKeydown() {
    EventHandler.on(this._element, 'keydown', `[data-mdb-toggle='${this.toggleElement}']`, (e) => {
      if (e.keyCode === ENTER) {
        e.preventDefault();
        EventHandler.trigger(this.elementToggle, 'click');
      }
    });
  }

  _handleOpen() {
    const container = this._getContainer();
    EventHandlerMulti.on(
      this._element,
      'click',
      `[data-mdb-toggle='${this.toggleElement}']`,
      (e) => {
        if (this._options === null) {
          return;
        }

        // Fix for input with open, if is not for settimeout input has incorrent jumping label
        const fixForInput = Manipulator.getDataAttribute(this.input, 'toggle') !== null ? 200 : 0;

        setTimeout(() => {
          Manipulator.addStyle(this.elementToggle, {
            pointerEvents: 'none',
          });

          this.elementToggle.blur();

          let checkInputValue;

          if (takeValue(this.input)[0] === '' || this._isInvalidTimeFormat) {
            checkInputValue = ['12', '00', 'PM'];
          } else {
            checkInputValue = takeValue(this.input);
          }

          const { modalId, inline, format12 } = this._options;
          const [hour, minute, format] = checkInputValue;
          const div = element('div');

          if (Number(hour) > 12 || hour === '00') {
            this._isInner = true;
          }

          this.input.blur();
          e.target.blur();

          div.innerHTML = getTimepickerTemplate(this._options);
          Manipulator.addClass(div, MODAL_CLASS);

          div.setAttribute('role', 'dialog');
          div.setAttribute('tabIndex', '-1');
          div.setAttribute('id', modalId);

          if (!inline) {
            container.appendChild(div);
            this._scrollBar.hide();
          } else {
            this._popper = createPopper(this.input, div, {
              placement: 'bottom-start',
            });

            container.appendChild(div);
          }

          this._getDomElements();
          if (this._animations) {
            this._toggleBackdropAnimation();
          } else {
            Manipulator.addClass(this._wrapper, 'opacity-100');
          }
          this._setActiveClassToTipsOnOpen(hour, minute, format);
          this._appendTimes();
          this._setActiveClassToTipsOnOpen(hour, minute, format);
          this._setTipsAndTimesDependOnInputValue(hour, minute);

          if (this.input.value === '') {
            const allTipsHours = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`, this._modal);

            if (format12) {
              Manipulator.addClass(this._PM, ACTIVE_CLASS);
            }

            this._hour.textContent = '12';
            this._minutes.textContent = '00';
            this._addActiveClassToTip(allTipsHours, Number(this._hour.textContent));
          }

          this._handleSwitchTimeMode();
          this._handleOkButton();
          this._handleClose();

          if (inline) {
            this._handleHoverInlineBtn();
            this._handleDocumentClickInline();
            this._handleInlineClicks();
          } else {
            this._handleSwitchHourMinute();
            this._handleClockClick();
            this._handleKeyboard();

            Manipulator.addStyle(this._hour, {
              pointerEvents: 'none',
            });
            Manipulator.addStyle(this._minutes, {
              pointerEvents: '',
            });
          }

          this._focusTrap = new FocusTrap(this._wrapper, {
            event: 'keydown',
            condition: ({ key }) => key === 'Tab',
          });
          this._focusTrap.trap();
        }, fixForInput);
      }
    );
  }

  _handleInlineClicks() {
    let selectedHour;
    let minuteNumber;
    const countMinutes = (count) => {
      let minutes = count;

      if (minutes > 59) {
        minutes = 0;
      } else if (minutes < 0) {
        minutes = 59;
      }

      return minutes;
    };

    const countHours = (count) => {
      let hour = count;

      if (this._options.format24) {
        if (hour > 24) {
          hour = 1;
        } else if (hour < 0) {
          hour = 23;
        }

        if (hour > 23) {
          hour = 0;
        }
      } else {
        if (hour > 12) {
          hour = 1;
        } else if (hour < 1) {
          hour = 12;
        }

        if (hour > 12) {
          hour = 1;
        }
      }

      return hour;
    };

    const incrementHours = (hour) => {
      const counteredNumber = countHours(hour);
      this._hour.textContent = this._setHourOrMinute(counteredNumber);
    };
    const incrementMinutes = (minutes) => {
      const counteredNumber = countMinutes(minutes);
      this._minutes.textContent = this._setHourOrMinute(counteredNumber);
    };

    const addHours = () => {
      selectedHour = countHours(selectedHour) + 1;
      incrementHours(selectedHour);
    };
    const addMinutes = () => {
      minuteNumber = countMinutes(minuteNumber) + 1;
      incrementMinutes(minuteNumber);
    };

    const subHours = () => {
      selectedHour = countHours(selectedHour) - 1;
      incrementHours(selectedHour);
    };

    const subMinutes = () => {
      minuteNumber = countMinutes(minuteNumber) - 1;
      incrementMinutes(minuteNumber);
    };

    const _clearAsyncs = () => {
      clearInterval(this._interval);
      clearTimeout(this._timeoutInterval);
    };

    const _clearAndSetThisInterval = (addHoursOrAddMinutes) => {
      _clearAsyncs();
      this._timeoutInterval = setTimeout(() => {
        this._interval = setInterval(addHoursOrAddMinutes, 100);
      }, 500);
    };
    EventHandlerMulti.on(
      this._modal,
      'click mousedown mouseup touchstart touchend contextmenu',
      `.${ICON_UP_CLASS}, .${ICON_DOWN_CLASS}`,
      (e) => {
        selectedHour = Number(this._hour.textContent);
        minuteNumber = Number(this._minutes.textContent);
        const { target, type } = e;
        const isEventTypeMousedownOrTouchstart = type === 'mousedown' || type === 'touchstart';

        if (Manipulator.hasClass(target, ICON_UP_CLASS)) {
          if (Manipulator.hasClass(target.parentNode, ICONS_HOUR_INLINE)) {
            if (isEventTypeMousedownOrTouchstart) {
              _clearAndSetThisInterval(addHours);
            } else if (type === 'mouseup' || type === 'touchend' || type === 'contextmenu') {
              _clearAsyncs();
            } else {
              addHours();
            }
          } else {
            // eslint-disable-next-line no-lonely-if
            if (isEventTypeMousedownOrTouchstart) {
              _clearAndSetThisInterval(addMinutes);
            } else if (type === 'mouseup' || type === 'touchend' || type === 'contextmenu') {
              _clearAsyncs();
            } else {
              addMinutes();
            }
          }
        } else if (Manipulator.hasClass(target, ICON_DOWN_CLASS)) {
          if (Manipulator.hasClass(target.parentNode, ICONS_HOUR_INLINE)) {
            if (isEventTypeMousedownOrTouchstart) {
              _clearAndSetThisInterval(subHours);
            } else if (type === 'mouseup' || type === 'touchend') {
              _clearAsyncs();
            } else {
              subHours();
            }
          } else {
            // eslint-disable-next-line no-lonely-if
            if (isEventTypeMousedownOrTouchstart) {
              _clearAndSetThisInterval(subMinutes);
            } else if (type === 'mouseup' || type === 'touchend') {
              _clearAsyncs();
            } else {
              subMinutes();
            }
          }
        }
      }
    );

    EventHandlerMulti.on(
      this._document,
      `${EVENT_MOUSEUP_DATA_API} ${EVENT_TOUCHEND_DATA_API}`,
      () => {
        _clearAsyncs();
      }
    );

    EventHandler.on(window, EVENT_KEYDOWN_DATA_API, (e) => {
      const key = e.code;
      const isHourBtnFocused = document.activeElement.classList.contains('timepicker-hour');
      const isMinuteBtnFocused = document.activeElement.classList.contains('timepicker-minute');
      const isBodyFocused = document.activeElement === document.body;
      selectedHour = Number(this._hour.textContent);
      minuteNumber = Number(this._minutes.textContent);

      switch (key) {
        case 'ArrowUp':
          e.preventDefault();
          if (isBodyFocused || isHourBtnFocused) {
            this._hour.focus();
            addHours();
          } else if (isMinuteBtnFocused) {
            addMinutes();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (isBodyFocused || isHourBtnFocused) {
            this._hour.focus();
            subHours();
          } else if (isMinuteBtnFocused) {
            subMinutes();
          }
          break;
      }
    });
  }

  _handleClose() {
    EventHandler.on(
      this._modal,
      'click',
      `.${WRAPPER_CLASS}, .${BUTTON_CANCEL_CLASS}, .${BUTTON_CLEAR_CLASS}`,
      ({ target }) => {
        const { closeModalOnBackdropClick } = this._options;

        const runRemoveFunction = () => {
          Manipulator.addStyle(this.elementToggle, {
            pointerEvents: 'auto',
          });

          if (this._animations) {
            this._toggleBackdropAnimation(true);
          }

          this._removeModal();
          this._focusTrap.disable();
          this._focusTrap = null;

          if (this.elementToggle) {
            this.elementToggle.focus();
          } else if (this.input) {
            this.input.focus();
          }
        };

        if (Manipulator.hasClass(target, BUTTON_CLEAR_CLASS)) {
          this._toggleAmPm('PM');
          this.input.value = '';

          EventHandler.trigger(this.input, EVENT_CLEAR);

          Manipulator.removeClass(this.input, 'active');

          let checkInputValue;

          if (takeValue(this.input)[0] === '') {
            checkInputValue = ['12', '00', 'PM'];
          } else {
            checkInputValue = takeValue(this.input);
          }

          const [hour, minute, format] = checkInputValue;
          this._setTipsAndTimesDependOnInputValue('12', '00');
          this._setActiveClassToTipsOnOpen(hour, minute, format);
          this._hour.click();
        } else if (Manipulator.hasClass(target, BUTTON_CANCEL_CLASS)) {
          runRemoveFunction();
        } else if (Manipulator.hasClass(target, WRAPPER_CLASS) && closeModalOnBackdropClick) {
          runRemoveFunction();
        }
      }
    );
  }

  showValueInput() {
    return this.input.value;
  }

  _handleOkButton() {
    EventHandlerMulti.on(this._modal, 'click', `.${BUTTON_SUBMIT_CLASS}`, () => {
      let { maxTime, minTime } = this._options;
      const { format12, format24, readOnly, focusInputAfterApprove, disablePast, disableFuture } =
        this._options;
      const hourModeActive = this._document.querySelector(`.${HOUR_MODE_CLASS}.${ACTIVE_CLASS}`);
      const currentValue = `${this._hour.textContent}:${this._minutes.textContent}`;
      const selectedHour = Number(this._hour.textContent);
      const selectedMinutes = Number(this._minutes.textContent);

      minTime = setMinTime(minTime, disablePast, format12);
      maxTime = setMaxTime(maxTime, disableFuture, format12);

      const [maxTimeHour, maxTimeMinutes, maxTimeFormat] = takeValue(maxTime, false);
      const [minTimeHour, minTimeMinutes, minTimeFormat] = takeValue(minTime, false);
      const isHourLessThanMinHour = selectedHour < Number(minTimeHour);
      const isHourGreaterThanMaxHour = selectedHour > Number(maxTimeHour);
      let maxFormatAndCurrentFormatEqual = true;
      if (hourModeActive) {
        maxFormatAndCurrentFormatEqual = maxTimeFormat === hourModeActive.textContent;
      }

      let minFormatAndCurrentFormatEqual = true;
      if (hourModeActive) {
        minFormatAndCurrentFormatEqual = minTimeFormat === hourModeActive.textContent;
      }

      const hourEqualToMaxAndMinutesGreaterThanMax =
        selectedMinutes > maxTimeMinutes && selectedHour === Number(maxTimeHour);
      const hourEqualToMinAndMinutesLessThanMin =
        selectedMinutes < minTimeMinutes && selectedHour === Number(minTimeHour);

      Manipulator.addClass(this.input, 'active');
      Manipulator.addStyle(this.elementToggle, {
        pointerEvents: 'auto',
      });

      if (maxTime !== '') {
        if (
          maxFormatAndCurrentFormatEqual &&
          (isHourGreaterThanMaxHour || hourEqualToMaxAndMinutesGreaterThanMax)
        ) {
          return;
        } else if (maxTimeFormat === 'AM' && hourModeActive.textContent === 'PM') {
          return;
        }
      }
      if (minTime !== '') {
        if (
          minFormatAndCurrentFormatEqual &&
          (isHourLessThanMinHour || hourEqualToMinAndMinutesLessThanMin)
        ) {
          return;
        }
        if (minTimeFormat === 'PM' && hourModeActive.textContent === 'AM') {
          return;
        }
      }

      if (
        checkValueBeforeAccept(
          this._options,
          this.input,
          this._hour.textContent,
          this._minutes.textContent
        ) === undefined
      ) {
        return;
      }

      if (this._isInvalidTimeFormat) {
        Manipulator.removeClass(this.input, 'is-invalid');
      }

      if (!readOnly && focusInputAfterApprove) {
        this.input.focus();
      }

      Manipulator.addStyle(this.elementToggle, {
        pointerEvents: 'auto',
      });

      if (format24) {
        this.input.value = currentValue;
      } else if (hourModeActive === null) {
        this.input.value = `${currentValue} PM`;
      } else {
        this.input.value = `${currentValue} ${hourModeActive.textContent}`;
      }

      if (this._animations) {
        this._toggleBackdropAnimation(true);
      }

      this._removeModal();

      EventHandler.trigger(this.input, EVENT_VALUE_CHANGED);
    });
  }

  _handleHoverInlineBtn() {
    EventHandlerMulti.on(
      this._modal,
      'mouseover mouseleave',
      `.${CURRENT_INLINE_CLASS}`,
      ({ type, target }) => {
        const allIconsInlineHour = SelectorEngine.find(`.${ICON_INLINE_HOUR_CLASS}`, this._modal);
        const allIconsInlineMinute = SelectorEngine.find(
          `.${ICON_INLINE_MINUTE_CLASS}`,
          this._modal
        );

        if (type === 'mouseover') {
          if (Manipulator.hasClass(target, HOUR_CLASS)) {
            allIconsInlineHour.forEach((icon) => Manipulator.addClass(icon, ACTIVE_CLASS));
          } else {
            allIconsInlineMinute.forEach((icon) => Manipulator.addClass(icon, ACTIVE_CLASS));
          }
        } else {
          // eslint-disable-next-line no-lonely-if
          if (Manipulator.hasClass(target, HOUR_CLASS)) {
            allIconsInlineHour.forEach((icon) => Manipulator.removeClass(icon, ACTIVE_CLASS));
          } else {
            allIconsInlineMinute.forEach((icon) => Manipulator.removeClass(icon, ACTIVE_CLASS));
          }
        }
      }
    );
  }

  _handleDocumentClickInline() {
    EventHandler.on(document, EVENT_CLICK_DATA_API, ({ target }) => {
      if (
        this._modal &&
        !this._modal.contains(target) &&
        !Manipulator.hasClass(target, 'timepicker-icon')
      ) {
        clearInterval(this._interval);
        Manipulator.addStyle(this.elementToggle, {
          pointerEvents: 'auto',
        });
        this._removeModal();
      }
    });
  }

  _handleSwitchHourMinute() {
    toggleClassHandler('click', CURRENT_CLASS);

    EventHandler.on(this._modal, 'click', CURRENT_CLASS, () => {
      const { format24 } = this._options;
      const current = SelectorEngine.find(CURRENT_CLASS, this._modal);
      const allTipsMinutes = SelectorEngine.find(`.${TIPS_MINUTES_CLASS}`, this._modal);
      const allTipsHours = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`, this._modal);
      const allInnerTips = SelectorEngine.find(`.${TIPS_INNER_HOURS_CLASS}`, this._modal);
      const hourValue = Number(this._hour.textContent);
      const minuteValue = Number(this._minutes.textContent);

      const switchTips = (array, classes) => {
        allTipsHours.forEach((tip) => tip.remove());
        allTipsMinutes.forEach((tip) => tip.remove());
        Manipulator.addClass(this._hand, TRANSFORM_CLASS);

        setTimeout(() => {
          Manipulator.removeClass(this._hand, TRANSFORM_CLASS);
        }, 401);

        this._getAppendClock(array, `.${CLOCK_CLASS}`, classes);

        const toggleActiveClass = () => {
          const allTipsHours = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`, this._modal);
          const allTipsMinutes = SelectorEngine.find(`.${TIPS_MINUTES_CLASS}`, this._modal);

          this._addActiveClassToTip(allTipsHours, hourValue);
          this._addActiveClassToTip(allTipsMinutes, minuteValue);
        };

        if (!format24) {
          setTimeout(() => {
            toggleActiveClass();
          }, 401);
        } else {
          const allTipsInnerHours = SelectorEngine.find(`.${TIPS_INNER_HOURS_CLASS}`, this._modal);

          setTimeout(() => {
            this._addActiveClassToTip(allTipsInnerHours, hourValue);
            toggleActiveClass();
          }, 401);
        }
      };

      current.forEach((e) => {
        if (Manipulator.hasClass(e, ACTIVE_CLASS)) {
          if (Manipulator.hasClass(e, MINUTE_CLASS)) {
            Manipulator.addClass(this._hand, TRANSFORM_CLASS);

            Manipulator.addStyle(this._hand, {
              transform: `rotateZ(${this._minutes.textContent * 6}deg)`,
              height: 'calc(40% + 1px)',
            });

            if (format24 && allInnerTips.length > 0) {
              allInnerTips.forEach((innerTip) => innerTip.remove());
            }
            switchTips(this.minutesArray, `${TIPS_MINUTES_CLASS}`, allTipsMinutes);
            this._hour.style.pointerEvents = '';
            this._minutes.style.pointerEvents = 'none';
          } else if (Manipulator.hasClass(e, HOUR_CLASS)) {
            Manipulator.addStyle(this._hand, {
              transform: `rotateZ(${this._hour.textContent * 30}deg)`,
            });

            if (Number(this._hour.textContent) > 12) {
              Manipulator.addStyle(this._hand, {
                transform: `rotateZ(${this._hour.textContent * 30 - 360}deg)`,
                height: '21.5%',
              });

              if (Number(this._hour.textContent) > 12) {
                Manipulator.addStyle(this._hand, {
                  height: '21.5%',
                });
              }
            } else {
              Manipulator.addStyle(this._hand, {
                height: 'calc(40% + 1px)',
              });
            }

            if (format24) {
              this._getAppendClock(
                this.innerHours,
                `.${CLOCK_INNER_CLASS}`,
                TIPS_INNER_HOURS_CLASS
              );
            }
            if (allInnerTips.length > 0) {
              allInnerTips.forEach((innerTip) => innerTip.remove());
            }

            switchTips(this.hoursArray, `${TIPS_HOURS_CLASS}`, allTipsHours);

            Manipulator.addStyle(this._hour, {
              pointerEvents: 'none',
            });
            Manipulator.addStyle(this._minutes, {
              pointerEvents: '',
            });
          }
        }
      });
    });
  }

  _handleDisablingTipsMaxTime(selectedFormat, maxTimeFormat, maxTimeMinutes, maxTimeHour) {
    if (!this._options.maxTime && !this._options.disableFuture) {
      return;
    }

    const outerHoursTips = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`);
    const innerHoursTips = SelectorEngine.find(`.${TIPS_INNER_HOURS_CLASS}`);
    const allTipsMinutes = SelectorEngine.find(`.${TIPS_MINUTES_CLASS}`);

    if (!maxTimeFormat || maxTimeFormat === selectedFormat) {
      _verifyMaxTimeHourAndAddDisabledClass(innerHoursTips, maxTimeHour);
      _verifyMaxTimeHourAndAddDisabledClass(outerHoursTips, maxTimeHour);
      _verifyMaxTimeMinutesTipsAndAddDisabledClass(
        allTipsMinutes,
        maxTimeMinutes,
        maxTimeHour,
        this._hour.textContent
      );
      return;
    }
    if (maxTimeFormat === 'AM' && selectedFormat === 'PM') {
      outerHoursTips.forEach((tip) => {
        Manipulator.addClass(tip, 'disabled');
      });
      allTipsMinutes.forEach((tip) => {
        Manipulator.addClass(tip, 'disabled');
      });
    }
  }

  _handleDisablingTipsMinTime(selectedFormat, minTimeFormat, minTimeMinutes, minTimeHour) {
    if (!this._options.minTime && !this._options.disablePast) {
      return;
    }

    const outerHoursTips = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`);
    const innerHoursTips = SelectorEngine.find(`.${TIPS_INNER_HOURS_CLASS}`);
    const allTipsMinutes = SelectorEngine.find(`.${TIPS_MINUTES_CLASS}`);

    if (!minTimeFormat || minTimeFormat === selectedFormat) {
      _verifyMinTimeHourAndAddDisabledClass(outerHoursTips, minTimeHour);
      _verifyMinTimeHourAndAddDisabledClass(innerHoursTips, minTimeHour);
      _verifyMinTimeMinutesTipsAndAddDisabledClass(
        allTipsMinutes,
        minTimeMinutes,
        minTimeHour,
        this._hour.textContent
      );
    } else if (minTimeFormat === 'PM' && selectedFormat === 'AM') {
      outerHoursTips.forEach((tip) => Manipulator.addClass(tip, 'disabled'));
      allTipsMinutes.forEach((tip) => Manipulator.addClass(tip, 'disabled'));
    }
  }
  _toggleAmPm = (enabled) => {
    if (enabled == 'PM') {
      this._isPmEnabled = true;
      this._isAmEnabled = false;
    } else if (enabled == 'AM') {
      this._isPmEnabled = false;
      this._isAmEnabled = true;
    }
  };

  _handleSwitchTimeMode() {
    EventHandler.on(document, 'click', `.${HOUR_MODE_CLASS}`, ({ target }) => {
      let { maxTime, minTime } = this._options;
      const { disablePast, disableFuture, format12 } = this._options;

      minTime = setMinTime(minTime, disablePast, format12);
      maxTime = setMaxTime(maxTime, disableFuture, format12);

      let [maxTimeHour, maxTimeMinutes, maxTimeFormat] = takeValue(maxTime, false);
      let [minTimeHour, minTimeMinutes, minTimeFormat] = takeValue(minTime, false);

      const allTipsHour = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`);
      const allTipsMinutes = SelectorEngine.find(`.${TIPS_MINUTES_CLASS}`);

      const clearDisabledClassForAllTips = () => {
        allTipsHour.forEach((tip) => {
          Manipulator.removeClass(tip, 'disabled');
        });

        allTipsMinutes.forEach((tip) => {
          Manipulator.removeClass(tip, 'disabled');
        });
      };

      clearDisabledClassForAllTips();
      this._handleDisablingTipsMinTime(
        target.textContent,
        minTimeFormat,
        minTimeMinutes,
        minTimeHour
      );
      this._handleDisablingTipsMaxTime(
        target.textContent,
        maxTimeFormat,
        maxTimeMinutes,
        maxTimeHour
      );
      this._toggleAmPm(target.textContent);

      if (!Manipulator.hasClass(target, ACTIVE_CLASS)) {
        const allHoursMode = SelectorEngine.find(`.${HOUR_MODE_CLASS}`);

        allHoursMode.forEach((element) => {
          if (Manipulator.hasClass(element, ACTIVE_CLASS)) {
            Manipulator.removeClass(element, ACTIVE_CLASS);
          }
        });

        Manipulator.addClass(target, ACTIVE_CLASS);
      }
    });
  }

  _handleClockClick() {
    let { maxTime, minTime } = this._options;
    const { disablePast, disableFuture, format12 } = this._options;
    minTime = setMinTime(minTime, disablePast, format12);
    maxTime = setMaxTime(maxTime, disableFuture, format12);

    const maxTimeFormat = takeValue(maxTime, false)[2];
    const minTimeFormat = takeValue(minTime, false)[2];

    const maxTimeHour = takeValue(maxTime, false)[0];
    const minTimeHour = takeValue(minTime, false)[0];

    const clockWrapper = SelectorEngine.findOne(`.${CLOCK_WRAPPER_CLASS}`);
    EventHandlerMulti.on(
      document,
      `${EVENT_MOUSEDOWN_DATA_API} ${EVENT_MOUSEUP_DATA_API} ${EVENT_MOUSEMOVE_DATA_API} ${EVENT_MOUSELEAVE_DATA_API} ${EVENT_MOUSEOVER_DATA_API} ${EVENT_TOUCHSTART_DATA_API} ${EVENT_TOUCHMOVE_DATA_API} ${EVENT_TOUCHEND_DATA_API}`,
      '',
      (e) => {
        if (!checkBrowser()) {
          e.preventDefault();
        }

        const { type, target } = e;
        const { closeModalOnMinutesClick, switchHoursToMinutesOnClick } = this._options;
        const minutes = SelectorEngine.findOne(`.${TIPS_MINUTES_CLASS}`, this._modal) !== null;
        const hours = SelectorEngine.findOne(`.${TIPS_HOURS_CLASS}`, this._modal) !== null;
        const innerHours =
          SelectorEngine.findOne(`.${TIPS_INNER_HOURS_CLASS}`, this._modal) !== null;

        const allTipsMinutes = SelectorEngine.find(`.${TIPS_MINUTES_CLASS}`, this._modal);

        const mouseClick = findMousePosition(e, clockWrapper);
        const radius = clockWrapper.offsetWidth / 2;

        let rds = Math.atan2(mouseClick.y - radius, mouseClick.x - radius);
        if (checkBrowser()) {
          const touchClick = findMousePosition(e, clockWrapper, true);
          rds = Math.atan2(touchClick.y - radius, touchClick.x - radius);
        }

        let xPos = null;
        let yPos = null;
        let elFromPoint = null;

        if (
          type === 'mousedown' ||
          type === 'mousemove' ||
          type === 'touchmove' ||
          type === 'touchstart'
        ) {
          if (type === 'mousedown' || type === 'touchstart' || type === 'touchmove') {
            if (
              this._hasTargetInnerClass(target) ||
              Manipulator.hasClass(target, CLOCK_WRAPPER_CLASS) ||
              Manipulator.hasClass(target, CLOCK_CLASS) ||
              Manipulator.hasClass(target, TIPS_MINUTES_CLASS) ||
              Manipulator.hasClass(target, TIPS_HOURS_CLASS) ||
              Manipulator.hasClass(target, CIRCLE_CLASS) ||
              Manipulator.hasClass(target, HAND_CLASS) ||
              Manipulator.hasClass(target, MIDDLE_DOT_CLASS) ||
              Manipulator.hasClass(target, TIPS_ELEMENT_CLASS)
            ) {
              this._isMouseMove = true;

              if (checkBrowser() && e.touches) {
                xPos = e.touches[0].clientX;
                yPos = e.touches[0].clientY;
                elFromPoint = document.elementFromPoint(xPos, yPos);
              }
            }
          }
        } else if (type === 'mouseup' || type === 'touchend') {
          this._isMouseMove = false;
          if (
            this._hasTargetInnerClass(target) ||
            Manipulator.hasClass(target, CLOCK_CLASS) ||
            Manipulator.hasClass(target, TIPS_HOURS_CLASS) ||
            Manipulator.hasClass(target, CIRCLE_CLASS) ||
            Manipulator.hasClass(target, HAND_CLASS) ||
            Manipulator.hasClass(target, MIDDLE_DOT_CLASS) ||
            Manipulator.hasClass(target, TIPS_ELEMENT_CLASS)
          ) {
            if ((hours || innerHours) && switchHoursToMinutesOnClick) {
              const isHourLessThanMinOrGreaterThanMax =
                Number(this._hour.textContent) > maxTimeHour ||
                Number(this._hour.textContent) < minTimeHour;
              if (
                this._options.format24 &&
                maxTimeHour != '' &&
                minTimeHour != '' &&
                isHourLessThanMinOrGreaterThanMax
              ) {
                return;
              } else if (
                this._options.format24 &&
                maxTimeHour != '' &&
                this._hour.textContent > maxTimeHour
              ) {
                return;
              } else if (
                this._options.format24 &&
                minTimeHour != '' &&
                this._hour.textContent < minTimeHour
              ) {
                return;
              }
            }
            if (!Manipulator.hasClass(this._minutes, ACTIVE_CLASS)) {
              EventHandler.trigger(this._minutes, 'click');
            }
          }

          if (minutes && closeModalOnMinutesClick) {
            const submitBtn = SelectorEngine.findOne(`.${BUTTON_SUBMIT_CLASS}`, this._modal);
            EventHandler.trigger(submitBtn, 'click');
          }
        }

        if (minutes) {
          let minute;
          const degrees = Math.trunc((rds * 180) / Math.PI) + 90;
          const { degrees: minDegrees, minute: minTimeObj } = this._makeMinutesDegrees(
            degrees,
            minute
          );

          if (this._handlerMaxMinMinutesOptions(minDegrees, minTimeObj) === undefined) {
            return;
          }

          const { degrees: _degrees, minute: minuteTimes } = this._handlerMaxMinMinutesOptions(
            minDegrees,
            minTimeObj
          );

          if (this._isMouseMove) {
            Manipulator.addStyle(this._hand, {
              transform: `rotateZ(${_degrees}deg)`,
            });

            if (minuteTimes === undefined) {
              return;
            }

            const changeMinutes = () => {
              return minuteTimes >= 10 || minuteTimes === '00' ? minuteTimes : `0${minuteTimes}`;
            };

            this._minutes.textContent = changeMinutes();

            this._toggleClassActive(this.minutesArray, this._minutes, allTipsMinutes);
            this._toggleBackgroundColorCircle(`${TIPS_MINUTES_CLASS}`);

            this._objWithDataOnChange.degreesMinutes = _degrees;
            this._objWithDataOnChange.minutes = minuteTimes;
          }
        }

        if (hours || innerHours) {
          let hour;

          let degrees = Math.trunc((rds * 180) / Math.PI) + 90;
          degrees = Math.round(degrees / 30) * 30;

          Manipulator.addClass(this._circle, 'active');

          if (this._makeHourDegrees(target, degrees, hour) === undefined) {
            return;
          }
          const makeDegrees = () => {
            if (checkBrowser() && degrees && elFromPoint) {
              const { degrees: touchDegrees, hour: touchHours } = this._makeHourDegrees(
                elFromPoint,
                degrees,
                hour
              );
              return this._handleMoveHand(elFromPoint, touchHours, touchDegrees);
            } else {
              const { degrees: movedDegrees, hour: movedHours } = this._makeHourDegrees(
                target,
                degrees,
                hour
              );
              return this._handleMoveHand(target, movedHours, movedDegrees);
            }
          };

          this._objWithDataOnChange.degreesHours = degrees;

          if (
            this._handlerMaxMinHoursOptions(
              degrees,
              maxTimeHour,
              minTimeHour,
              maxTimeFormat,
              minTimeFormat,
              e
            )
          ) {
            makeDegrees();
          }
        }

        e.stopPropagation();
      }
    );
  }

  _hasTargetInnerClass(target) {
    return (
      Manipulator.hasClass(target, CLOCK_INNER_CLASS) ||
      Manipulator.hasClass(target, TIPS_INNER_HOURS_CLASS) ||
      Manipulator.hasClass(target, TIPS_INNER_ELEMENT_CLASS)
    );
  }

  _handleMoveHand(target, hour, degrees) {
    const allTipsHours = SelectorEngine.find(`.${TIPS_HOURS_CLASS}`, this._modal);
    const allTipsInner = SelectorEngine.find(`.${TIPS_INNER_HOURS_CLASS}`, this._modal);

    if (this._isMouseMove) {
      if (this._hasTargetInnerClass(target)) {
        Manipulator.addStyle(this._hand, {
          height: '21.5%',
        });
      } else {
        Manipulator.addStyle(this._hand, {
          height: 'calc(40% + 1px)',
        });
      }

      Manipulator.addStyle(this._hand, {
        transform: `rotateZ(${degrees}deg)`,
      });

      this._hour.textContent = hour >= 10 || hour === '00' ? hour : `0${hour}`;

      this._toggleClassActive(this.hoursArray, this._hour, allTipsHours);
      this._toggleClassActive(this.innerHours, this._hour, allTipsInner);

      this._objWithDataOnChange.hour = hour >= 10 || hour === '00' ? hour : `0${hour}`;
    }
  }

  _handlerMaxMinMinutesOptions(degrees, minute) {
    let { maxTime, minTime } = this._options;
    const { format12, increment, disablePast, disableFuture } = this._options;

    minTime = setMinTime(minTime, disablePast, format12);
    maxTime = setMaxTime(maxTime, disableFuture, format12);

    const maxMin = takeValue(maxTime, false)[1];
    const minMin = takeValue(minTime, false)[1];
    const maxHourTime = takeValue(maxTime, false)[0];
    const minHourTime = takeValue(minTime, false)[0];

    const maxTimeFormat = takeValue(maxTime, false)[2];
    const minTimeFormat = takeValue(minTime, false)[2];

    const maxMinDegrees = maxMin !== '' ? maxMin * 6 : '';
    const minMinDegrees = minMin !== '' ? minMin * 6 : '';

    const selectedHour = Number(this._hour.textContent);

    if (!maxTimeFormat && !minTimeFormat) {
      if (maxTime !== '' && minTime !== '') {
        if (
          (maxHourTime == selectedHour && degrees > maxMinDegrees) ||
          (minHourTime == selectedHour && degrees < minMinDegrees)
        ) {
          return degrees;
        }
      } else if (minTime !== '' && selectedHour <= Number(minHourTime)) {
        if (degrees <= minMinDegrees - 6) {
          return degrees;
        }
      } else if (maxTime !== '' && selectedHour >= Number(maxHourTime)) {
        if (degrees >= maxMinDegrees + 6) {
          return degrees;
        }
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (minTime !== '') {
        if (minTimeFormat === 'PM' && this._isAmEnabled) {
          return;
        }

        if (minTimeFormat === 'PM' && this._isPmEnabled) {
          if (selectedHour < Number(minHourTime)) {
            return;
          }

          if (selectedHour <= Number(minHourTime)) {
            if (degrees <= minMinDegrees - 6) {
              return degrees;
            }
          }
        } else if (minTimeFormat === 'AM' && this._isAmEnabled) {
          if (selectedHour < Number(minHourTime)) {
            return;
          }

          if (selectedHour <= Number(minHourTime)) {
            if (degrees <= minMinDegrees - 6) {
              return degrees;
            }
          }
        }
      }
      if (maxTime !== '') {
        if (maxTimeFormat === 'AM' && this._isPmEnabled) {
          return;
        }

        if (maxTimeFormat === 'PM' && this._isPmEnabled) {
          if (selectedHour >= Number(maxHourTime)) {
            if (degrees >= maxMinDegrees + 6) {
              return degrees;
            }
          }
        } else if (maxTimeFormat === 'AM' && this._isAmEnabled) {
          if (selectedHour >= Number(maxHourTime)) {
            if (degrees >= maxMinDegrees + 6) {
              return degrees;
            }
          }
        }
      }
    }

    if (increment) {
      degrees = Math.round(degrees / 30) * 30;
    }

    if (degrees <= 0) {
      degrees = 360 + degrees;
    } else if (degrees >= 360) {
      degrees = 0;
    }

    return {
      degrees,
      minute,
    };
  }

  _removeModal() {
    if (this._animations) {
      setTimeout(() => {
        this._removeModalElements();
        this._scrollBar.reset();
      }, 300);
    } else {
      this._removeModalElements();
      this._scrollBar.reset();
    }

    EventHandlerMulti.off(
      this._document,
      `${EVENT_CLICK_DATA_API} ${EVENT_KEYDOWN_DATA_API} ${EVENT_MOUSEDOWN_DATA_API} ${EVENT_MOUSEUP_DATA_API} ${EVENT_MOUSEMOVE_DATA_API} ${EVENT_MOUSELEAVE_DATA_API} ${EVENT_MOUSEOVER_DATA_API} ${EVENT_TOUCHSTART_DATA_API} ${EVENT_TOUCHMOVE_DATA_API} ${EVENT_TOUCHEND_DATA_API}`
    );
    EventHandler.off(window, EVENT_KEYDOWN_DATA_API);
  }

  _removeModalElements() {
    if (this._modal) {
      this._modal.remove();
    }
  }

  _toggleBackdropAnimation(isToRemove = false) {
    if (isToRemove) {
      Manipulator.addClass(this._wrapper, 'animation');
      Manipulator.addClass(this._wrapper, WRAPPER_CLOSE_ANIMATION_CLASS);
      this._wrapper.style.animationDuration = '300ms';
    } else {
      Manipulator.addClass(this._wrapper, 'animation');
      Manipulator.addClass(this._wrapper, WRAPPER_OPEN_ANIMATION_CLASS);
      this._wrapper.style.animationDuration = '300ms';

      if (!this._options.inline) Manipulator.addClass(this._clock, CLOCK_ANIMATION_CLASS);
    }
  }

  _toggleBackgroundColorCircle = (classes) => {
    const tips = this._modal.querySelector(`.${classes}.${ACTIVE_CLASS}`) !== null;

    if (tips) {
      Manipulator.addClass(this._circle, 'active');
      return;
    }
    Manipulator.removeClass(this._circle, 'active');
  };

  _toggleClassActive = (array, { textContent }, tips) => {
    const findInArray = [...array].find((e) => Number(e) === Number(textContent));

    return tips.forEach((e) => {
      if (!Manipulator.hasClass(e, 'disabled')) {
        if (e.textContent === findInArray) {
          Manipulator.addClass(e, ACTIVE_CLASS);
        } else {
          Manipulator.removeClass(e, ACTIVE_CLASS);
        }
      }
    });
  };

  _addActiveClassToTip(tips, value) {
    tips.forEach((tip) => {
      if (Number(tip.textContent) === Number(value)) {
        Manipulator.addClass(tip, ACTIVE_CLASS);
      }
    });
  }

  _makeMinutesDegrees = (degrees, minute) => {
    const { increment } = this._options;

    if (degrees < 0) {
      minute = Math.round(360 + degrees / 6) % 60;
      degrees = 360 + Math.round(degrees / 6) * 6;
    } else {
      minute = Math.round(degrees / 6) % 60;
      degrees = Math.round(degrees / 6) * 6;
    }

    if (increment) {
      degrees = Math.round(degrees / 30) * 30;
      minute = (Math.round(degrees / 6) * 6) / 6;

      if (minute === 60) {
        minute = '00';
      }
    }

    if (degrees >= 360) {
      degrees = 0;
    }

    return {
      degrees,
      minute,
      addDegrees: increment ? 30 : 6,
    };
  };

  _makeHourDegrees = (target, degrees, hour) => {
    if (!target) {
      return;
    }

    if (this._hasTargetInnerClass(target)) {
      if (degrees < 0) {
        hour = Math.round(360 + degrees / 30) % 24;
        degrees = 360 + degrees;
      } else {
        hour = Math.round(degrees / 30) + 12;
        if (hour === 12) {
          hour = '00';
        }
      }
    } else if (degrees < 0) {
      hour = Math.round(360 + degrees / 30) % 12;
      degrees = 360 + degrees;
    } else {
      hour = Math.round(degrees / 30) % 12;
      if (hour === 0 || hour > 12) {
        hour = 12;
      }
    }

    if (degrees >= 360) {
      degrees = 0;
    }

    return {
      degrees,
      hour,
      addDegrees: 30,
    };
  };

  _makeInnerHoursDegrees = (degrees, hour) => {
    if (degrees < 0) {
      hour = Math.round(360 + degrees / 30) % 24;
      degrees = 360 + degrees;
    } else {
      hour = Math.round(degrees / 30) + 12;
      if (hour === 12) {
        hour = '00';
      }
    }

    return {
      degrees,
      hour,
      addDegrees: 30,
    };
  };

  _setHourOrMinute(number) {
    return number < 10 ? `0${number}` : number;
  }

  _appendTimes() {
    const { format24 } = this._options;

    if (format24) {
      this._getAppendClock(this.hoursArray, `.${CLOCK_CLASS}`, `${TIPS_HOURS_CLASS}`);
      this._getAppendClock(this.innerHours, `.${CLOCK_INNER_CLASS}`, TIPS_INNER_HOURS_CLASS);
    } else {
      this._getAppendClock(this.hoursArray, `.${CLOCK_CLASS}`, `${TIPS_HOURS_CLASS}`);
    }
  }

  _getAppendClock = (array = [], clockClass = `.${CLOCK_CLASS}`, tipsClass) => {
    let { minTime, maxTime } = this._options;
    const { inline, format12, disablePast, disableFuture } = this._options;
    minTime = setMinTime(minTime, disablePast, format12);
    maxTime = setMaxTime(maxTime, disableFuture, format12);

    const [maxTimeHour, maxTimeMinutes, maxTimeFormat] = takeValue(maxTime, false);
    const [minTimeHour, minTimeMinutes, minTimeFormat] = takeValue(minTime, false);

    // fix for append clock for max/min if input has invalid  value
    if (!inline) {
      if (format12) {
        if (this._isInvalidTimeFormat && !Manipulator.hasClass(this._AM, 'active')) {
          Manipulator.addClass(this._PM, 'active');
        }
      }
    }

    const clock = SelectorEngine.findOne(clockClass);

    const elements = 360 / array.length;

    function rad(el) {
      return el * (Math.PI / 180);
    }

    if (clock === null) {
      return;
    }

    const clockWidth = (clock.offsetWidth - 32) / 2;
    const clockHeight = (clock.offsetHeight - 32) / 2;
    const radius = clockWidth - 4;

    setTimeout(() => {
      let currentFormat;
      if (format12) {
        currentFormat = SelectorEngine.findOne(`.${HOUR_MODE_CLASS}.${ACTIVE_CLASS}`).textContent;
      }
      this._handleDisablingTipsMinTime(currentFormat, minTimeFormat, minTimeMinutes, minTimeHour);
      this._handleDisablingTipsMaxTime(currentFormat, maxTimeFormat, maxTimeMinutes, maxTimeHour);
    }, 0);

    [...array].forEach((e, i) => {
      const angle = rad(i * elements);

      const span = element('span');
      const spanToTips = element('span');

      spanToTips.innerHTML = e;
      Manipulator.addClass(span, tipsClass);

      const itemWidth = span.offsetWidth;
      const itemHeight = span.offsetHeight;

      Manipulator.addStyle(span, {
        left: `${clockWidth + Math.sin(angle) * radius - itemWidth}px`,
        bottom: `${clockHeight + Math.cos(angle) * radius - itemHeight}px`,
      });

      if (array.includes('05')) {
        Manipulator.addClass(span, `${TIPS_MINUTES_CLASS}`);
      }

      if (array.includes('13')) {
        spanToTips.classList.add(TIPS_INNER_ELEMENT_CLASS);
      } else {
        spanToTips.classList.add(TIPS_ELEMENT_CLASS);
      }

      span.appendChild(spanToTips);
      return clock.appendChild(span);
    });
  };

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
      isRTL,
    };

    typeCheckConfig(NAME, config, DefaultType);
    return config;
  }

  _getContainer() {
    return SelectorEngine.findOne(this._options.container);
  }

  _listenToUserInput() {
    EventHandler.on(this.input, 'input', (event) => {
      this._handleUserInput(event.target.value);
    });
  }

  _handleUserInput(input) {
    const { format24, format12 } = this._options;

    if (this.input.value === '') {
      return;
    }

    const regexAMFormat = /^(0?[1-9]|1[0-2]):[0-5][0-9] [APap][mM]$/;
    const regexNormalFormat = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    const testedAMRegex = regexAMFormat.test(input);
    const testedNormalRegex = regexNormalFormat.test(input);

    if (testedNormalRegex === true && format24) {
      this._isInvalidTimeFormat = false;
      this._inputValue = this.input.value;
      this._currentTime = formatNormalHours(this._inputValue);
    } else if (testedAMRegex === true && format12) {
      this._isInvalidTimeFormat = false;
      this._inputValue = this.input.value;
      this._currentTime = formatToAmPm(this._inputValue);
    } else {
      this._isInvalidTimeFormat = true;
    }
  }

  // Static

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose|hide/.test(config)) {
        return;
      }

      if (!data) {
        data = new Timepicker(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config]();
      }
    });
  }
}

export default Timepicker;
