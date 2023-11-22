/* eslint-disable no-multi-assign */
import TouchUtil from './touchUtil';
import EventHandler from '../mdb/dom/event-handler';

const DEFAULT_OPTIONS = {
  angle: 0,
  pointers: 2,
};
const NAME = 'rotate';
const EVENT_END = `${NAME}end`;
const EVENT_START = `${NAME}start`;

class Rotate extends TouchUtil {
  constructor(element, options) {
    super();
    this._element = element;
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this._origin = {};
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  handleTouchStart(e) {
    e.preventDefault();

    if (e.touches.length < 2) return;
    this._startTouch = e;
    this._origin = {};
    EventHandler.trigger(this._element, EVENT_START, { touch: e });
    return;
  }

  handleTouchMove(e) {
    e.preventDefault();

    let origin;
    let input;
    const touches = e.touches;

    if (touches.length === 1 && this._options.pointers === 1) {
      const { left, top, width, height } = this._element.getBoundingClientRect();
      origin = {
        x: left + width / 2,
        y: top + height / 2,
      };

      input = touches[0];
    } else if (e.touches.length === 2 && this._options.pointers === 2) {
      const [t2, t1] = e.touches;
      const _position = {
        x1: t1.clientX,
        x2: t2.clientX,
        y1: t1.clientY,
        y2: t2.clientY,
      };

      origin = this._getMidPoint(_position);
      input = this._getRightMostTouch(e.touches);
    } else {
      return;
    }

    this.currentAngle = this._getAngle(origin.x, origin.y, input.clientX, input.clientY);

    if (!this._origin.initialAngle) {
      this._origin.initialAngle = this._origin.previousAngle = this.currentAngle;
      this._origin.distance = this._origin.change = 0;
    } else {
      this._origin.change = this._getAngularDistance(this._origin.previousAngle, this.currentAngle);
      this._origin.distance += this._origin.change;
    }

    this._origin.previousAngle = this.currentAngle;

    this.rotate = {
      currentAngle: this.currentAngle,
      distance: this._origin.distance,
      change: this._origin.change,
    };

    EventHandler.trigger(this._element, NAME, this.rotate);
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this._origin = {};

    EventHandler.trigger(this._element, EVENT_END, { touch: e });
  }
}

export default Rotate;
