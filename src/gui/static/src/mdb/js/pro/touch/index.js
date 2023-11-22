import Data from '../../mdb/dom/data';
import EventHandler from '../../mdb/dom/event-handler';
import Press from './press';
import Swipe from './swipe';
import Pan from './pan';
import Pinch from './pinch';
import Tap from './tap';
import Rotate from './rotate';
import BaseComponent from '../../free/base-component';
import Manipulator from '../../mdb/dom/manipulator';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

const NAME = 'touch';
const DATA_KEY = 'mdb.touch';

class Touch extends BaseComponent {
  constructor(element, event = 'swipe', options = {}) {
    super(element);

    this._options = this._getConfig(options);
    this._event = this._options.event || event;

    // events

    this.swipe = this._event === 'swipe' ? new Swipe(element, this._options) : null;
    this.press = this._event === 'press' ? new Press(element, this._options) : null;
    this.pan = this._event === 'pan' ? new Pan(element, this._options) : null;
    this.pinch = this._event === 'pinch' ? new Pinch(element, this._options) : null;
    this.tap = this._event === 'tap' ? new Tap(element, this._options) : null;
    this.rotate = this._event === 'rotate' ? new Rotate(element, this._options) : null;

    // handlers

    this._touchStartHandler = this._handleTouchStart.bind(this);
    this._touchMoveHandler = this._handleTouchMove.bind(this);
    this._touchEndHandler = this._handleTouchEnd.bind(this);

    this.init();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters
  static get NAME() {
    return NAME;
  }

  // Public

  dispose() {
    EventHandler.off(this._element, 'touchstart', this._touchStartHandler);
    EventHandler.off(this._element, 'touchmove', this._touchMoveHandler);
    EventHandler.off(this._element, 'touchend', this._touchEndHandler);

    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  init() {
    // istanbul ignore next
    EventHandler.on(this._element, 'touchstart', this._touchStartHandler);

    // istanbul ignore next
    EventHandler.on(this._element, 'touchmove', this._touchMoveHandler);

    // istanbul ignore next
    EventHandler.on(this._element, 'touchend', this._touchEndHandler);
  }

  // Private

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...dataAttributes,
      ...config,
    };

    return config;
  }

  _handleTouchStart(e) {
    this[this._event].handleTouchStart(e);
  }

  _handleTouchMove(e) {
    if (this[this._event].handleTouchMove) {
      this[this._event].handleTouchMove(e);
    }
  }

  _handleTouchEnd(e) {
    this[this._event].handleTouchEnd(e);
  }

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Touch(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        // eslint-disable-next-line consistent-return
        return data[config];
      }
    });
  }
}

export default Touch;
