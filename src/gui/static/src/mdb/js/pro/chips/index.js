import { typeCheckConfig, element } from '../../mdb/util/index';
import Manipulator from '../../mdb/dom/manipulator';
import SelectorEngine from '../../mdb/dom/selector-engine';
import Chip from './chip';
import Input from '../../free/input';
import Data from '../../mdb/dom/data';
import { getInputField } from './templates';
import EventHandler from '../../mdb/dom/event-handler';
import {
  LEFT_ARROW,
  RIGHT_ARROW,
  ENTER,
  BACKSPACE,
  UP_ARROW,
  DOWN_ARROW,
  DELETE,
} from '../../mdb/util/keycodes';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

// import FocusTrap from '../../mdb/util/focusTrap';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'chips';

const DATA_KEY = `mdb.${NAME}`;

const CLASSNAME_ACTIVE = 'active';
const CLASSNAME_CHIPS_INITIAL = `${NAME}-initial`;
const CLASSNAME_CHIPS_PLACEHOLDER = `${NAME}-placeholder`;
const CLASSNAME_CLOSE_OPACITY = 'close-opacity';
const CLASSNAME_CHIP_OPACITY = 'chip-opacity';
const CLASSNAME_CHIPS_PADDING = `${NAME}-padding`;
const CLASSNAME_CHIPS_TANSITION = `${NAME}-transition`;
const CLASSNAME_CHIPS_WRAPPER = `${NAME}-input-wrapper`;

const SELECTOR_CHIP = '.chip';
const SELECTOR_CHIP_ACTIVE = `${SELECTOR_CHIP}.${CLASSNAME_ACTIVE}`;
const SELECTOR_CLOSE = '.close';

const EVENT_ADD = 'add.mdb.chips';
const EVENT_ADDED = 'added.mdb.chips';
const EVENT_ARROW_DOWN = 'arrowDown.mdb.chips';
const EVENT_ARROW_LEFT = 'arrowLeft.mdb.chips';
const EVENT_ARROW_RIGHT = 'arrowRight.mdb.chips';
const EVENT_ARROW_UP = 'arrowUp.mdb.chips';
const EVENT_DELETE = 'delete.mdb.chips';
const EVENT_SELECT = 'select.mdb.chips';

const DefaultType = {
  inputID: 'string',
  parentSelector: 'string',
  initialValues: 'array',
  editable: 'boolean',
  labelText: 'string',
};

const Default = {
  inputID: '',
  parentSelector: '',
  initialValues: [{ tag: 'init1' }, { tag: 'init2' }],
  editable: false,
  labelText: 'Example label',
};

class ChipsInput extends Chip {
  constructor(element, data = {}) {
    super(element, data);
    this._options = this._getConfig(data);
    this.numberClicks = 0;
    this._inputInstance = null;

    this.init();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get activeChip() {
    return SelectorEngine.findOne(SELECTOR_CHIP_ACTIVE, this._element);
  }

  get input() {
    return SelectorEngine.findOne('input', this._element);
  }

  get allChips() {
    return SelectorEngine.find(SELECTOR_CHIP, this._element);
  }

  get chipsInputWrapper() {
    return SelectorEngine.findOne(`.${CLASSNAME_CHIPS_WRAPPER}`, this._element);
  }

  // Public

  init() {
    this._setChipsClass();
    this._appendInputToElement(CLASSNAME_CHIPS_PLACEHOLDER);
    this._handleInitialValue();
    this._initializeInput();
    this._handleInputText();
    this._handleKeyboard();
    this._handleChipsOnSelect();
    this._handleEditable();
    this._handleChipsFocus();
    this._handleClicksOnChips();
  }

  dispose() {
    Manipulator.removeClass(this._element, 'chips');
    this.allChips.forEach((chip) => {
      const instance = Chip.getInstance(chip);
      if (instance) {
        chip.remove();
        EventHandler.off(chip, 'dblclick');
        instance.dispose();
      }
    });
    if (this._inputInstance) {
      this._inputInstance.dispose();
    }
    this.chipsInputWrapper.remove();
    EventHandler.off(this._element, 'click');
    EventHandler.off(this._element, 'keypress');
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  // Private

  _initializeInput() {
    const formOutline = this._element.querySelector('.form-outline');

    this._inputInstance = new Input(formOutline).init();
  }

  _setChipsClass() {
    Manipulator.addClass(this._element, 'chips');
  }

  _handleDeleteEvents(event) {
    const [last] = this.allChips.slice(-1);

    if (this.activeChip === null) {
      last.remove();

      this._handleEvents(event, EVENT_DELETE);
    } else {
      const index = this.allChips.findIndex((chip) => chip === this.activeChip);
      const activeChipAfter = this._handleActiveChipAfterRemove(index);
      const arr = [];

      if (this.activeChip === null) return;

      this.activeChip.remove();
      this._handleEvents(event, EVENT_DELETE);

      this.numberClicks = index;

      Manipulator.addClass(activeChipAfter, CLASSNAME_ACTIVE);

      this.allChips.forEach((chip) => {
        if (Manipulator.hasClass(chip, CLASSNAME_ACTIVE)) {
          arr.push(chip);

          if (arr.length > 1) {
            this.allChips.forEach((chip) => chip.remove());
          }
        }
      });
    }
  }

  _handleUpEvents(event) {
    this.numberClicks += 1;

    if (this.numberClicks === this.allChips.length + 1) this.numberClicks = 0;

    this._handleRightKeyboardArrow(this.numberClicks);

    this._handleEvents(event, EVENT_ARROW_RIGHT);
    this._handleEvents(event, EVENT_ARROW_UP);
  }

  _handleDownEvents(event) {
    this.numberClicks -= 1;

    if (this.numberClicks <= 0) this.numberClicks = this.allChips.length;

    this._handleLeftKeyboardArrow(this.numberClicks);

    this._handleEvents(event, EVENT_ARROW_LEFT);
    this._handleEvents(event, EVENT_ARROW_DOWN);
  }

  _keyboardEvents(event) {
    const { target, keyCode, ctrlKey } = event;

    if (target.value.length > 0 || this.allChips.length === 0) return;

    if (keyCode === BACKSPACE || keyCode === DELETE) {
      this._handleDeleteEvents(event);
    } else if (keyCode === RIGHT_ARROW || keyCode === UP_ARROW) {
      this._handleUpEvents(event);
    } else if (keyCode === LEFT_ARROW || keyCode === DOWN_ARROW) {
      this._handleDownEvents(event);
    } else if (keyCode === 65 && ctrlKey) {
      this._handleAddActiveClass();
    }
  }

  _handleKeyboard() {
    EventHandler.on(this.input, 'keydown', (event) => this._keyboardEvents(event));
  }

  _handleEditable() {
    const { editable } = this._options;

    if (!editable) return;

    this.allChips.forEach((chip) => {
      EventHandler.on(chip, 'dblclick', (e) => {
        const close = SelectorEngine.findOne('.close', chip);

        chip.contentEditable = true;
        chip.focus();

        setTimeout(() => {
          Manipulator.addStyle(close, { display: 'none' });
        }, 200);
        Manipulator.addClass(close, 'close-opacity');

        const obj = {};

        obj.tag = e.target.textContent;

        EventHandler.trigger(chip, EVENT_SELECT, { event: e, allChips: this.allChips });
      });

      EventHandler.on(document, 'click', ({ target }) => {
        const close = SelectorEngine.findOne('.close', chip);
        const chipText = SelectorEngine.findOne('.text-chip', chip);

        const isContainer = target === chip;
        const isContainerContent = chip && chip.contains(target);

        if (!isContainer && !isContainerContent) {
          chip.contentEditable = false;
          if (chipText.textContent !== '') {
            setTimeout(() => {
              Manipulator.addStyle(close, { display: 'block' });
              Manipulator.removeClass(close, 'close-opacity');
            }, 160);
          }
        }

        if (chipText.textContent === '') {
          setTimeout(() => {
            Manipulator.addClass(chip, CLASSNAME_CHIP_OPACITY);
          }, 200);

          setTimeout(() => {
            chip.remove();
          }, 300);
        }
      });
    });
  }

  _handleRemoveActiveClass() {
    this.allChips.forEach((chip) => Manipulator.removeClass(chip, CLASSNAME_ACTIVE));
  }

  _handleAddActiveClass() {
    this.allChips.forEach((chip) => Manipulator.addClass(chip, CLASSNAME_ACTIVE));
  }

  _handleRightKeyboardArrow(num) {
    this._handleRemoveActiveClass();

    if (num === 0) num = 1;

    this._handleAddActiveClassWithKeyboard(num);
  }

  _handleLeftKeyboardArrow(num) {
    this._handleRemoveActiveClass();
    this._handleAddActiveClassWithKeyboard(num);
  }

  _handleActiveChipAfterRemove(index) {
    const chipIndex = index === 0 ? 1 : index - 1;

    return this.allChips[chipIndex];
  }

  _handleClicksOnChips() {
    EventHandler.on(this._element, 'click', () => {
      if (this.allChips.length === 0) {
        Manipulator.removeClass(this.chipsInputWrapper, CLASSNAME_CHIPS_PADDING);
        Manipulator.removeClass(this.input, CLASSNAME_ACTIVE);
      }
    });
  }

  _handleTextContent() {
    const arr = [];

    this.allChips.forEach((chip) => arr.push({ tag: chip.textContent.trim() }));

    return arr;
  }

  _handleEvents(event, eventName) {
    const arr = this._handleTextContent();

    const filterActive = this.allChips.filter(
      (chip) => Manipulator.hasClass(chip, CLASSNAME_ACTIVE) && chip
    );

    EventHandler.trigger(this._element, eventName, {
      event,
      allChips: this.allChips,
      arrOfObjects: arr,
      active: filterActive,
      activeObj: {
        tag: filterActive.length <= 0 ? '' : filterActive[0].textContent.trim(),
      },
    });
  }

  _handleChipsFocus() {
    EventHandler.on(this._element, 'click', ({ target: { classList } }) => {
      if (
        classList.contains('chip') ||
        classList.contains('close') ||
        classList.contains('text-chip')
      ) {
        return;
      }

      this.input.focus();
    });
  }

  _handleInitialValue() {
    this._appendInputToElement(CLASSNAME_CHIPS_INITIAL);

    if (Manipulator.hasClass(this._element, CLASSNAME_CHIPS_INITIAL)) {
      const { initialValues } = this._options;

      initialValues.forEach(({ tag }) => this._handleCreateChip(this.input, tag));

      Manipulator.addClass(this.input, CLASSNAME_ACTIVE);
    }

    if (this.allChips.length > 0) {
      Manipulator.addClass(this.chipsInputWrapper, CLASSNAME_CHIPS_PADDING);
      Manipulator.addClass(this.chipsInputWrapper, CLASSNAME_CHIPS_TANSITION);
    }
  }

  _handleKeysInputToElement(event) {
    const { keyCode, target } = event;

    if (Manipulator.hasClass(target, 'chip')) {
      const close = SelectorEngine.findOne(SELECTOR_CLOSE, target);

      if (keyCode === ENTER) {
        target.contentEditable = false;

        if (target.textContent !== '') {
          setTimeout(() => {
            Manipulator.addStyle(close, { display: 'block' });
            Manipulator.removeClass(close, CLASSNAME_CLOSE_OPACITY);
          }, 160);
        } else if (target.textContent === '') {
          setTimeout(() => {
            Manipulator.addClass(target, CLASSNAME_CHIP_OPACITY);
          }, 200);

          setTimeout(() => {
            target.remove();
          }, 300);
        }
      }

      return;
    }

    if (keyCode === ENTER) {
      if (target.value === '') return;
      event.preventDefault();

      this._handleCreateChip(target, target.value);

      this._handleRemoveActiveClass();
      this.numberClicks = this.allChips.length + 1;
    }

    if (this.allChips.length > 0) {
      Manipulator.addClass(this.chipsInputWrapper, CLASSNAME_CHIPS_PADDING);
      Manipulator.addClass(this.chipsInputWrapper, CLASSNAME_CHIPS_TANSITION);
    } else {
      Manipulator.removeClass(this.chipsInputWrapper, CLASSNAME_CHIPS_PADDING);
    }
  }

  _handleBlurInput(event) {
    const { target } = event;
    if (target.value.length > 0) {
      this._handleCreateChip(target, target.value);
    }

    if (this.allChips.length > 0) {
      Manipulator.addClass(target, CLASSNAME_ACTIVE);
      Manipulator.addClass(this.chipsInputWrapper, CLASSNAME_CHIPS_PADDING);
    } else {
      Manipulator.removeClass(target, CLASSNAME_ACTIVE);
      Manipulator.removeClass(this.chipsInputWrapper, CLASSNAME_CHIPS_PADDING);
    }

    this.allChips.forEach((chip) => Manipulator.removeClass(chip, CLASSNAME_ACTIVE));
  }

  _handleInputText() {
    const placeholder = SelectorEngine.findOne(CLASSNAME_CHIPS_PLACEHOLDER, this._element);

    EventHandler.on(this._element, 'keypress', placeholder, (e) =>
      this._handleKeysInputToElement(e)
    );
    EventHandler.on(this.input, 'blur', (e) => this._handleBlurInput(e));
  }

  _appendInputToElement(selector) {
    if (!Manipulator.hasClass(this._element, selector)) return;

    const inputField = getInputField(this._options);

    this._element.insertAdjacentHTML('beforeend', inputField);
  }

  _handleCreateChip(target, value) {
    const addEvent = EventHandler.trigger(this._element, EVENT_ADD, { value });

    if (addEvent.defaultPrevented) {
      return;
    }

    const divElement = element('div');
    const divWithChips = new Chip(divElement, { text: value });

    let chipsContainer;

    if (this._options.parentSelector !== '') {
      const parent = document.querySelector(this._options.parentSelector);
      parent.insertAdjacentHTML('beforeend', divWithChips.appendChip());
      chipsContainer = parent;
    } else {
      target.insertAdjacentHTML('beforebegin', divWithChips.appendChip());
      chipsContainer = target.parentNode;
    }

    target.value = '';

    SelectorEngine.find(SELECTOR_CHIP, chipsContainer).forEach((chip) => {
      let instance = Chip.getInstance(chip);
      if (!instance) {
        instance = new Chip(chip);
        instance.init();
      }
    });

    this._handleEditable();

    EventHandler.trigger(this._element, EVENT_ADDED, { value });
  }

  _handleChipsOnSelect() {
    this.allChips.forEach((chip) => {
      EventHandler.on(this._element, 'click', (e) => {
        EventHandler.trigger(chip, EVENT_SELECT, { event: e, allChips: this.allChips });
      });
    });
  }

  _handleAddActiveClassWithKeyboard(num) {
    let chip;

    if (this.allChips[num - 1] === undefined) {
      chip = this.allChips[num - 2];
    } else {
      chip = this.allChips[num - 1];
    }

    Manipulator.addClass(chip, CLASSNAME_ACTIVE);
  }

  _getConfig(options) {
    const config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };
    typeCheckConfig(NAME, config, DefaultType);
    return config;
  }

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose|hide/.test(config)) {
        return;
      }

      if (!data) {
        data = new ChipsInput(this, _config);
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

export default ChipsInput;
