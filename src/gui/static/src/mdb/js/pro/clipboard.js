import { typeCheckConfig, element } from '../mdb/util/index';
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

const NAME = 'clipboard';
const DATA_KEY = 'mdb.clipboard';
const EVENT_KEY = `.${DATA_KEY}`;

const DEFAULT_OPTIONS = {
  clipboardTarget: null,
};

const OPTIONS_TYPE = {
  clipboardTarget: 'null|string',
};

const EVENT_COPIED = `copied${EVENT_KEY}`;

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Clipboard extends BaseComponent {
  constructor(element, options = {}) {
    super(element);

    this._options = options;

    if (this._element) {
      this._initCopy = this._initCopy.bind(this);

      this._setup();
      Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
      bindCallbackEventsIfNeeded(this.constructor);
    }
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get options() {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...this._options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  get clipboardTarget() {
    return SelectorEngine.findOne(this.options.clipboardTarget);
  }

  get copyText() {
    const clipboardTextExist = this.clipboardTarget.hasAttribute('data-mdb-clipboard-text');
    const inputValue = this.clipboardTarget.value;
    const targetText = this.clipboardTarget.textContent;

    if (clipboardTextExist) {
      return this.clipboardTarget.getAttribute('data-mdb-clipboard-text');
    }

    if (inputValue) {
      return inputValue;
    }

    return targetText;
  }

  // Public

  dispose() {
    EventHandler.off(this._element, 'click', this._initCopy);
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  // Private
  _setup() {
    EventHandler.on(this._element, 'click', this._initCopy);
  }

  _initCopy() {
    const inputToCopy = this._createNewInput();
    document.body.appendChild(inputToCopy);
    this._selectInput(inputToCopy);
    EventHandler.trigger(this._element, EVENT_COPIED, { copyText: this.copyText });

    inputToCopy.remove();
  }

  _createNewInput() {
    const tag = this.clipboardTarget.tagName === 'TEXTAREA' ? 'textarea' : 'input';
    const newInput = element(tag);
    newInput.value = this.copyText;
    Manipulator.style(newInput, { left: '-9999px', position: 'absolute' });

    return newInput;
  }

  _selectInput(input) {
    input.select();
    input.focus();
    input.setSelectionRange(0, 99999);

    document.execCommand('copy');
  }

  // Static

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data) {
        data = new Clipboard(this, _config);
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

export default Clipboard;
