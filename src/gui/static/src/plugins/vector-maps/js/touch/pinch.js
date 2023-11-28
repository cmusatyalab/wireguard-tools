import TouchUtil from './touchUtil';
import EventHandler from '../mdb/dom/event-handler';

const DEFAULT_OPTIONS = {
  pointers: 2,
  threshold: 10,
};

const NAME = 'pinch';
const EVENT_END = `${NAME}end`;
const EVENT_START = `${NAME}start`;
const EVENT_MOVE = `${NAME}move`;
class Pinch extends TouchUtil {
  constructor(element, options = {}) {
    super();
    this._element = element;
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this._startTouch = null;
    this._origin = null;
    this._touch = null;
    this._math = null;
    this._ratio = null;
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  handleTouchStart(e) {
    if (e.touches.length !== this._options.pointers) return;
    e.preventDefault();

    const [touch, origin] = this._getPinchTouchOrigin(e.touches);

    this._touch = touch;
    this._origin = origin;
    this._startTouch = this._touch;

    EventHandler.trigger(this._element, EVENT_START, {
      ratio: this._ratio,
      origin: this._origin,
    });
  }

  handleTouchMove(e) {
    const { threshold, pointers } = this._options;

    if (e.touches.length !== pointers) return;

    e.preventDefault();

    this._touch = this._getPinchTouchOrigin(e.touches)[0];
    this._ratio = this._touch / this._startTouch;

    const typeofing = typeof this._startTouch === 'number' && typeof this._touch === 'number';
    // eslint-disable-next-line no-restricted-globals
    const isNumber = !isNaN(this._startTouch) && !isNaN(this._touch);

    if (typeofing && isNumber) {
      if (this._origin.x > threshold || this._origin.y > threshold) {
        this._startTouch = this._touch;

        EventHandler.trigger(this._element, NAME, { ratio: this._ratio, origin: this._origin });
        EventHandler.trigger(this._element, EVENT_MOVE, {
          ratio: this._ratio,
          origin: this._origin,
        });
      }
    }
  }

  handleTouchEnd() {
    const typeofing = typeof this._startTouch === 'number' && typeof this._touch === 'number';
    // eslint-disable-next-line no-restricted-globals
    const isNumber = !isNaN(this._startTouch) && !isNaN(this._touch);

    if (typeofing && isNumber) {
      this._startTouch = null;

      EventHandler.trigger(this._element, EVENT_END, {
        ratio: this._ratio,
        origin: this._origin,
      });
    }
  }
}

export default Pinch;
