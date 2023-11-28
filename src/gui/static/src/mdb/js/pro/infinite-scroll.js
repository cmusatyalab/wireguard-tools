import { typeCheckConfig } from '../mdb/util/index';
import Data from '../mdb/dom/data';
import Manipulator from '../mdb/dom/manipulator';
import EventHandler from '../mdb/dom/event-handler';
import BaseComponent from '../free/base-component';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'infiniteScroll';
const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;

const EVENT_COMPLETED = `completed${EVENT_KEY}`;

const Default = {
  infiniteDirection: 'y',
};

const DefaultType = {
  infiniteDirection: 'string',
};

class InfiniteScroll extends BaseComponent {
  constructor(element, data) {
    super(element);
    this._element = element;

    this._options = this._getConfig(data);

    this.scrollHandler = this._scrollHandler.bind(this);

    this._init();

    if (this._element !== window) {
      Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
      bindCallbackEventsIfNeeded(this.constructor);
    }
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get rect() {
    return this._element.getBoundingClientRect();
  }

  get condition() {
    if (this._element === window) {
      return (
        Math.abs(window.scrollY + window.innerHeight - document.documentElement.scrollHeight) < 1
      );
    }
    if (this._options.infiniteDirection === 'x') {
      return this.rect.width + this._element.scrollLeft + 10 >= this._element.scrollWidth;
    }
    return Math.ceil(this.rect.height + this._element.scrollTop) >= this._element.scrollHeight;
  }

  // Public

  dispose() {
    EventHandler.off(this._element, 'scroll');
    if (this._element !== window) {
      Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);
    }

    super.dispose();
  }

  // Private

  _init() {
    EventHandler.on(this._element, 'scroll', () => this._scrollHandler());
  }

  _scrollHandler() {
    if (this.condition) {
      EventHandler.trigger(this._element, EVENT_COMPLETED);
    }
    EventHandler.off(this._element, 'scroll', this.scrollHandler);
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
        data = new InfiniteScroll(this, _config);
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

export default InfiniteScroll;
