import TouchUtil from './touchUtil';
import EventHandler from '../mdb/dom/event-handler';

const DEFAULT_OPTIONS = {
  threshold: 20,
  direction: 'all',
  pointers: 1,
};

const NAME = 'pan';
const EVENT_START = `${NAME}start`;
const EVENT_END = `${NAME}end`;
const EVENT_MOVE = `${NAME}move`;
const LEFT = 'left';
const RIGHT = 'right';

class Pan extends TouchUtil {
  constructor(element, options = {}) {
    super();
    this._element = element;
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this._startTouch = null;
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  handleTouchStart(e) {
    e.preventDefault();

    this._startTouch = this._getCoordinates(e);
    this._movedTouch = e;

    EventHandler.trigger(this._element, EVENT_START, { touch: e });
  }

  handleTouchMove(e) {
    e.preventDefault();
    const { threshold, direction } = this._options;
    const postion = this._getCoordinates(e);
    const movedPosition = this._getCoordinates(this._movedTouch);

    const displacement = this._getOrigin(postion, this._startTouch);
    const displacementMoved = this._getOrigin(postion, movedPosition);

    const pan = this._getDirection(displacement);
    const movedDirection = this._getDirection(displacementMoved);

    const { x, y } = pan;

    if (direction === 'all' && (y.value > threshold || x.value > threshold)) {
      const direction = y.value > x.value ? y.direction : x.direction;

      EventHandler.trigger(this._element, `${NAME}${direction}`);
      EventHandler.trigger(this._element, NAME, displacementMoved);
    }

    const axis = direction === LEFT || direction === RIGHT ? 'x' : 'y';

    if (movedDirection[axis].direction === direction && pan[axis].value > threshold) {
      EventHandler.trigger(this._element, `${NAME}${direction}`, {
        [axis]: postion[axis] - movedPosition[axis],
      });
    }

    this._movedTouch = e;

    EventHandler.trigger(this._element, EVENT_MOVE, { touch: e });
  }

  handleTouchEnd(e) {
    e.preventDefault();

    this._movedTouch = null;
    this._startTouch = null;

    EventHandler.trigger(this._element, EVENT_END, { touch: e });
  }
}

export default Pan;
