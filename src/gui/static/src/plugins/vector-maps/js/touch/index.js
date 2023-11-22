import { getjQuery } from '../mdb/util';
import Data from '../mdb/dom/data';
import EventHandler from '../mdb/dom/event-handler';
import Press from './press';
import Swipe from './swipe';
import Pan from './pan';
import Pinch from './pinch';
import Tap from './tap';
import Rotate from './rotate';

const NAME = 'touch';
const DATA_KEY = 'mdb.touch';

class Touch {
  constructor(element, event = 'swipe', options = {}) {
    this._element = element;
    this._event = event;

    // events

    this.swipe = event === 'swipe' ? new Swipe(element, options) : null;
    this.press = event === 'press' ? new Press(element, options) : null;
    this.pan = event === 'pan' ? new Pan(element, options) : null;
    this.pinch = event === 'pinch' ? new Pinch(element, options) : null;
    this.tap = event === 'tap' ? new Tap(element, options) : null;
    this.rotate = event === 'rotate' ? new Rotate(element, options) : null;

    // handlers

    this._touchStartHandler = (e) => this._handleTouchStart(e);
    this._touchMoveHandler = (e) => this._handleTouchMove(e);
    this._touchEndHandler = (e) => this._handleTouchEnd(e);
  }

  dispose() {
    EventHandler.off(this._element, 'touchstart', this._touchStartHandler);
    EventHandler.off(this._element, 'touchmove', this._touchMoveHandler);
    EventHandler.off(this._element, 'touchend', this._touchEndHandler);

    this.swipe = null;
    this.press = null;
    this.pan = null;
    this.pinch = null;
    this.tap = null;
    this.rotate = null;
  }

  init() {
    // istanbul ignore next
    EventHandler.on(this._element, 'touchstart', this._touchStartHandler);

    // istanbul ignore next
    EventHandler.on(this._element, 'touchmove', this._touchMoveHandler);

    // istanbul ignore next
    EventHandler.on(this._element, 'touchend', this._touchEndHandler);
  }

  _handleTouchStart(e) {
    this[this._event].handleTouchStart(e);
  }

  _handleTouchMove(e) {
    this[this._event].handleTouchMove(e);
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

const $ = getjQuery();

if ($) {
  const JQUERY_NO_CONFLICT = $.fn[NAME];
  $.fn[NAME] = Touch.jQueryInterface;
  $.fn[NAME].Constructor = Touch;
  $.fn[NAME].noConflict = () => {
    $.fn[NAME] = JQUERY_NO_CONFLICT;
    return Touch.jQueryInterface;
  };
}

export default Touch;
