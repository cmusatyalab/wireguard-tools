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

const NAME = 'inputMask';
const DATA_KEY = `mdb.${NAME}`;

const SELECTOR_DATA_INIT = '[data-mdb-input-mask-init]';

const EVENT_COMPLETED = `completed.${DATA_KEY}`;
const EVENT_INPUT = `valueChanged.${DATA_KEY}`;

const MASKS_DEFINITIONS = {
  9: {
    validator: /\d/,
    symbol: '9',
  },
  a: {
    validator: /[a-zżźąćśńółę]/i,
    symbol: 'a',
  },
  '*': {
    validator: /[a-zżźąćśńółę0-9]/i,
    symbol: '*',
  },
};

const DEFAULT_OPTIONS = {
  inputMask: '',
  charPlaceholder: '_',
  inputPlaceholder: true,
  maskPlaceholder: false,
  clearIncomplete: true,
  customMask: '',
  customValidator: '',
};
const OPTIONS_TYPE = {
  inputMask: 'string',
  charPlaceholder: 'string',
  inputPlaceholder: 'boolean',
  maskPlaceholder: 'boolean',
  clearIncomplete: 'boolean',
  customMask: 'string',
  customValidator: 'string',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class InputMask {
  constructor(element, options = {}) {
    this._element = element;
    this._options = this._getConfig(options);
    this._masks = this._options.masks;

    this._inputPlaceholder = '';
    this._previousValue = '';
    this._value = '';

    this._isEmpty = true;
    this._isCompleted = false;

    if (this._element) {
      this._initialValue = this._element.value;

      Data.setData(element, DATA_KEY, this);
      this._init();
    }
  }

  // Public
  dispose() {
    this._unbindEvents();

    Manipulator.removeClass(this._element, 'active');

    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  // Private

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);
    if (typeof dataAttributes.inputMask === 'number') {
      dataAttributes.inputMask = String(dataAttributes.inputMask);
    }

    config = {
      ...DEFAULT_OPTIONS,
      ...dataAttributes,
      ...config,
      masks: { ...MASKS_DEFINITIONS },
    };

    if (dataAttributes.customMask && dataAttributes.customValidator) {
      const customMasks = this._getCustomMasks(
        dataAttributes.customMask,
        dataAttributes.customValidator
      );

      this._customMasks = customMasks;
    } else if (config.customMask && config.customValidator) {
      const customMasks = this._getCustomMasks(config.customMask, config.customValidator);

      this._customMasks = customMasks;
    }

    config.masks = {
      ...config.masks,
      ...this._customMasks,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  _init() {
    if (this._initialValue !== '') {
      this._setInputPlaceholderFromMask(this._initialValue);
      this._validateInputWithMask(this._initialValue);
    } else if (this._options.inputPlaceholder) {
      this._uncoverPlaceholder();
    }

    this._bindEvents();
  }

  _isArray(value) {
    return (Array.isArray && Array.isArray(value)) || value instanceof Array;
  }

  _isValidMaskChar(maskChar) {
    if (this._masks[maskChar] !== undefined) {
      return true;
    }
    return false;
  }

  _uncoverPlaceholder() {
    // force label to show placeholder
    this._element.value = '';

    Manipulator.addClass(this._element, 'active');

    this._element.placeholder = this._options.inputMask;
  }

  _createInputPlaceholderFromMask() {
    return this._options.inputMask
      .split('')
      .map((char, i) => {
        return this._isValidMaskChar(char) ? this._getInputPlaceholderChar(i) : char;
      })
      .join('');
  }

  _getCustomMasks(masks, validators) {
    let customMasks = {};

    masks = masks.split(',');
    validators = validators.split(',');

    if (this._isArray(masks) && this._isArray(validators)) {
      masks.forEach((mask, i) => {
        customMasks = {
          ...customMasks,
          [mask]: {
            validator: validators[i],
            mask,
          },
        };
      });
    } else {
      customMasks = {
        ...customMasks,
        [masks]: {
          validator: validators,
          mask: masks,
        },
      };
    }

    return customMasks;
  }

  _getInputPlaceholderChar(i) {
    if (this._options.charPlaceholder.length === 1) {
      return this._options.charPlaceholder;
    }
    return this._options.charPlaceholder[i];
  }

  _getMaskRegex(maskChar) {
    if (!this._masks[maskChar]) {
      return false;
    }

    const validator = this._masks[maskChar].validator;

    return this._customMasks && this._customMasks[maskChar] !== undefined
      ? new RegExp(validator)
      : validator;
  }

  _setInputPlaceholderFromMask(value) {
    this._element.value = value;
    this._inputPlaceholder = value;
  }

  _setCaretPosition = (position, event) => {
    // because some browsers, e.g. Chrome sets higher order for focus rather than selection
    // setTimeout will place selection after focus
    // needed especially for setting caret position at start after creating inputPlaceholder
    if (event === 'focus') {
      setTimeout(() => {
        this._element.setSelectionRange(position, position, 'none');
      }, 0);
    } else {
      this._element.setSelectionRange(position, position, 'none');
    }
  };

  _validateInputWithMask(value) {
    this._isCompleted = false;
    this._isEmpty = false;

    if (!this._options.inputMask) return value;

    let maskStartRegExp = `^([^${Object.keys(this._masks).join('')}]+)`;

    maskStartRegExp = new RegExp(maskStartRegExp);

    const { isDeleting, isFirstWithMask, isFirstWithoutMask } = this._calculatePositionAndDirection(
      value
    );

    if (
      !isDeleting &&
      (isFirstWithMask || isFirstWithoutMask) &&
      maskStartRegExp.test(this._options.inputMask)
    ) {
      value = maskStartRegExp.exec(this._options.inputMask)[0] + value;
    }

    const maskLength = this._options.inputMask.length;

    let text = '';

    for (let i = 0, x = 1; x && i < maskLength; ++i) {
      const inputChar = value.charAt(i);
      const maskChar = this._options.inputMask.charAt(i);

      if (this._isValidMaskChar(maskChar)) {
        const maskRegExp = this._getMaskRegex(maskChar);

        if (maskRegExp.test(inputChar)) {
          text += inputChar;
        } else {
          x = 0;
        }
      } else {
        text += maskChar;

        if (inputChar && inputChar !== maskChar) {
          value = `${value}`;
        }
      }
    }

    // caret position after input will be set to the last character position, which is end of the placeholder when placeholder is turned on
    // to avoid that we have to dynamically set caret position after each typed charater
    this._futureCaretPosition = isDeleting
      ? text.length - this._calculateCaretJump(text)
      : text.length;

    if (text.length === maskLength) {
      this._handleComplete(text);
    }

    if (text.length === 0) {
      this._isEmpty = true;
    }

    // only at this point we know what was exactly added to input (in case placeholders are turned on)
    EventHandler.trigger(this._element, EVENT_INPUT, { value: text });

    text += this._calculatePlaceholderRest(text, maskLength);

    return text;
  }

  _calculatePositionAndDirection(value) {
    const inputLength = value.length;
    const previousValueLength = this._previousValue.length;
    const placeholderLength = this._inputPlaceholder.length;
    const addedCharsLength = inputLength - placeholderLength;

    const caretPosition = this._element.selectionEnd;

    const isFirstWithMask =
      this._options.maskPlaceholder && addedCharsLength === 1 && caretPosition === 1;

    const isFirstWithoutMask = !this._options.maskPlaceholder && inputLength === 1;

    const isDeleting = inputLength - previousValueLength < 0;

    return {
      isFirstWithMask,
      isFirstWithoutMask,
      isDeleting,
    };
  }

  _calculatePlaceholderRest(text, maskLength) {
    let placeholderRest = '';

    if (this._options.maskPlaceholder) {
      for (let i = text.length; i < maskLength; i++) {
        if (this._inputPlaceholder[i] === this._getInputPlaceholderChar(i)) {
          placeholderRest += this._getInputPlaceholderChar(i);
        } else {
          placeholderRest += this._inputPlaceholder[i];
        }
      }
    }

    return placeholderRest;
  }

  _calculateCaretJump(text) {
    // if while deleting there is 'hardcoded' char into mask e.g. ('/','-'), function won't allow to delete it (because it will be overwritten by placeholderRest)
    // so we have to 'jump' over those hardcoded chars until we find propr char to be deleted

    const charIndex = text.length - 1;
    let caretJump = 0;

    for (let i = charIndex; i >= 0; i--) {
      const maskRegExp = this._getMaskRegex(this._options.inputMask.charAt(i));
      if (text.charAt(i) && !maskRegExp) {
        caretJump++;
      } else {
        i = -1;
      }
    }

    // in situation in which we are deleting characters but few first characters are hardcoded from placeholder
    // they won't be deleted and condition for text.length === 0 will be never met
    // to avoid that we check if caretJump > charIndex, meaning we jumped to the 0 index of the value and typed input value is empty
    if (caretJump > charIndex) {
      this._isEmpty = true;
    }

    return caretJump;
  }

  _bindEvents() {
    this._inputListener = this._handleInput.bind(this);
    this._focusListener = this._handleFocus.bind(this);
    this._blurListener = this._handleBlur.bind(this);

    EventHandler.on(this._element, 'input', this._inputListener);
    EventHandler.on(this._element, 'focus', this._focusListener);
    EventHandler.on(this._element, 'blur', this._blurListener);
  }

  _unbindEvents() {
    EventHandler.off(this._element, 'input', this._inputListener);
    EventHandler.off(this._element, 'focus', this._focusListener);
    EventHandler.off(this._element, 'blur', this._blurListener);
  }

  _handleInput(e) {
    let value = e.target.value;

    if (value && value !== this._previousValue && value.length !== this._previousValue.length) {
      value =
        value.length < this._previousValue.length && !this._options.maskPlaceholder
          ? value
          : this._validateInputWithMask(value);
    }

    this._element.value = value;
    this._previousValue = value;

    this._setCaretPosition(this._futureCaretPosition);
  }

  _handleComplete(value) {
    this._isCompleted = true;

    EventHandler.trigger(this._element, EVENT_COMPLETED, { value });
  }

  _handleFocus() {
    if (this._previousValue) {
      this._element.value = this._previousValue;

      this._setCaretPosition(this._futureCaretPosition, 'focus');
    } else if (this._options.maskPlaceholder) {
      const maskPlaceholder = this._createInputPlaceholderFromMask();

      this._setInputPlaceholderFromMask(maskPlaceholder);

      this._setCaretPosition(0, 'focus');
    }
  }

  _handleBlur() {
    if (
      (this._options.clearIncomplete && !this._isCompleted) ||
      (this._options.inputPlaceholder && (this._isEmpty || this._element.value.length === 0))
    ) {
      this._previousValue = '';
      this._uncoverPlaceholder();
    }
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
        data = new InputMask(this, _config);
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
  let instance = InputMask.getInstance(el);
  if (!instance) {
    instance = new InputMask(el);
  }

  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .InputMask to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = InputMask.jQueryInterface;
    $.fn[NAME].Constructor = InputMask;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return InputMask.jQueryInterface;
    };
  }
});

export default InputMask;
