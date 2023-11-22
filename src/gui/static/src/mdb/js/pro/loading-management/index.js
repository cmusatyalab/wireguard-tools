import { typeCheckConfig } from '../../mdb/util/index';
import Data from '../../mdb/dom/data';
import Manipulator from '../../mdb/dom/manipulator';
import SelectorEngine from '../../mdb/dom/selector-engine';
import EventHandler from '../../mdb/dom/event-handler';
import { getBackdropTemplate } from './templates';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

const NAME = 'loading';
const CLASS_SPINNER = 'loading-spinner';
const DATA_KEY = 'mdb.loading';

const SELECTOR_LOADING_ICON = '.loading-icon';
const SELECTOR_LOADING_TEXT = '.loading-text';

const SHOW_EVENT = 'show.mdb.loading';

const DefaultType = {
  backdrop: '(null|boolean)',
  backdropColor: 'string',
  backdropOpacity: '(number|string)',
  delay: '(null|number)',
  loader: 'string',
  loadingIcon: 'boolean',
  loadingText: 'boolean',
  scroll: 'boolean',
};

const Default = {
  backdrop: true,
  backdropColor: 'rgba(0, 0, 0)',
  backdropOpacity: 0.4,
  backdropID: '',
  delay: null,
  loader: '',
  parentSelector: null,
  scroll: true,
  loadingText: true,
  loadingIcon: true,
};

class Loading extends BaseComponent {
  constructor(element, options = {}) {
    super(element);

    this._options = this._getConfig(options);

    this._backdropElement = null;
    this._parentElement = SelectorEngine.findOne(this._options.parentSelector);

    this._loadingIcon = SelectorEngine.findOne(SELECTOR_LOADING_ICON, this._element);
    this._loadingText = SelectorEngine.findOne(SELECTOR_LOADING_TEXT, this._element);

    this.init();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }
  // Getters

  static get NAME() {
    return NAME;
  }

  // Public

  init() {
    const spinnerCloned = this._loadingIcon.cloneNode(true);
    const loadingCloned = this._loadingText.cloneNode(true);

    this._removeElementsOnStart();

    setTimeout(() => {
      Manipulator.addClass(this._element, CLASS_SPINNER);

      this._setBackdrop();
      this._setLoadingIcon(spinnerCloned);
      this._setLoadingText(loadingCloned);
      this._setScrollOption();

      EventHandler.trigger(this._element, SHOW_EVENT);
    }, this._options.delay);
  }

  dispose() {
    Manipulator.removeClass(this._element, CLASS_SPINNER);

    const delay = this._options.delay;
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    setTimeout(() => {
      this._removeBackdrop();

      setTimeout(() => {
        super.dispose();
      }, delay);
    }, delay);
  }

  // Private

  _setBackdrop() {
    const { backdrop } = this._options;

    if (!backdrop) return;

    this._backdropElement = getBackdropTemplate(this._options);

    if (this._parentElement !== null) {
      Manipulator.addClass(this._element, 'position-absolute');
      Manipulator.addClass(this._parentElement, 'position-relative');
      Manipulator.addClass(this._backdropElement, 'position-absolute');

      this._parentElement.appendChild(this._backdropElement);
    } else {
      Manipulator.addClass(this._element, 'position-fixed');

      document.body.appendChild(this._backdropElement);
      document.body.appendChild(this._element);
    }
  }

  _removeBackdrop() {
    const { backdrop } = this._options;

    if (!backdrop) return;

    if (this._parentElement !== null) {
      Manipulator.removeClass(this._element, 'position-absolute');
      Manipulator.removeClass(this._parentElement, 'position-relative');

      this._backdropElement.remove();
    } else {
      this._backdropElement.remove();
      this._element.remove();
    }
  }

  _setLoadingIcon(spinner) {
    if (!this._options.loadingIcon) {
      spinner.remove();
      return;
    }
    this._element.appendChild(spinner);
    spinner.id = this._options.loader;
  }

  _setLoadingText(text) {
    if (!this._options.loadingText) {
      text.remove();
      return;
    }

    this._element.appendChild(text);
  }

  _removeElementsOnStart() {
    if (this._element === null) return;

    this._loadingIcon.remove();
    this._loadingText.remove();
  }

  _setScrollOption() {
    if (!this._options.scroll) {
      if (this._parentElement === null) {
        document.body.style.overflow = 'hidden';
        return;
      }

      Manipulator.addStyle(this._parentElement, { overflow: 'hidden' });
    } else {
      if (this._parentElement === null) {
        document.body.style.overflow = '';
        return;
      }

      Manipulator.addStyle(this._parentElement, { overflow: '' });
    }
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

  // Static

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;
      if (!data) {
        data = new Loading(this, _config);
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

export default Loading;
