import { element, typeCheckConfig } from '../../mdb/util/index';
import Manipulator from '../../mdb/dom/manipulator';
import SelectorEngine from '../../mdb/dom/selector-engine';
import Data from '../../mdb/dom/data';
import EventHandler from '../../mdb/dom/event-handler';
import { getChip } from './templates';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

/**
 *
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'chip';
const DATA_KEY = `mdb.${NAME}`;
const SELECTOR_CLOSE = '.close';
const EVENT_DELETE = 'delete.mdb.chips';
const EVENT_SELECT = 'select.mdb.chip';

const DefaultType = { text: 'string', closeIcon: 'boolean', img: 'object' };

const Default = { text: '', closeIcon: false, img: { path: '', alt: '' } };

class Chip extends BaseComponent {
  constructor(element, data = {}) {
    super(element, data);
    this._options = this._getConfig(data);

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }

    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  // Public

  init() {
    this._appendCloseIcon();
    this._handleDelete();
    this._handleTextChip();
    this._handleClickOnChip();
  }

  dispose() {
    EventHandler.off(this._element, 'click');
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  appendChip() {
    const { text, closeIcon } = this._options;
    const chip = getChip({ text, closeIcon });

    return chip;
  }

  // Private

  _appendCloseIcon(el = this._element) {
    if (SelectorEngine.find(SELECTOR_CLOSE, this._element).length > 0) return;

    if (this._options.closeIcon) {
      const createIcon = element('i');
      createIcon.classList = 'close fas fa-times';

      el.insertAdjacentElement('beforeend', createIcon);
    }
  }

  _handleClickOnChip() {
    EventHandler.on(this._element, 'click', (event) => {
      const { textContent } = event.target;
      const obj = {};

      obj.tag = textContent.trim();

      EventHandler.trigger(EVENT_SELECT, { event, obj });
    });
  }

  _handleDelete() {
    const deleteElement = SelectorEngine.find(SELECTOR_CLOSE, this._element);
    if (deleteElement.length === 0) return;

    EventHandler.on(this._element, 'click', SELECTOR_CLOSE, () => {
      EventHandler.trigger(this._element, EVENT_DELETE);
      this._element.remove();
    });
  }

  _handleTextChip() {
    if (this._element.innerText !== '') return;

    this._element.innerText = this._options.text;
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
        data = new Chip(this, _config);
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

export default Chip;
