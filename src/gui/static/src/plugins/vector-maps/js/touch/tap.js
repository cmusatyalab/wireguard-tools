import TouchUtil from './touchUtil';
import EventHandler from '../mdb/dom/event-handler';

const DEFAULT_OPTIONS = {
  interval: 500,
  time: 250,
  taps: 1,
  pointers: 1,
};
const NAME = 'tap';

class Tap extends TouchUtil {
  constructor(element, options) {
    super();
    this._element = element;
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this._timer = null;
    this._tapCount = 0;
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  handleTouchStart(e) {
    const { x, y } = this._getCoordinates(e);
    const { interval, taps, pointers } = this._options;

    if (e.touches.length === pointers) {
      this._tapCount += 1;

      if (this._tapCount === 1) {
        this._timer = setTimeout(() => {
          this._tapCount = 0;
        }, interval);
      }

      if (this._tapCount === taps) {
        clearTimeout(this._timer);
        this._tapCount = 0;
        EventHandler.trigger(this._element, NAME, {
          origin: {
            x,
            y,
          },
        });
      }
    }

    return e;
  }

  handleTouchEnd() {
    return;
  }

  handleTouchMove() {
    return;
  }
}

export default Tap;
