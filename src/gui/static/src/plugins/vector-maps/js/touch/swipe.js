import TouchUtil from './touchUtil';
import EventHandler from '../mdb/dom/event-handler';

const DEFAULT_OPTIONS = {
  threshold: 10,
  direction: 'all',
};

const EVENT = 'swipe';
const LEFT = 'left';
const RIGHT = 'right';

class Swipe extends TouchUtil {
  constructor(element, options) {
    super();
    this._element = element;
    this._startPosition = null;
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  handleTouchStart(e) {
    this._startPosition = this._getCoordinates(e);
  }

  handleTouchMove(e) {
    e.preventDefault();

    if (!this._startPosition) return;

    const { direction, threshold } = this._options;

    const position = this._getCoordinates(e);
    const displacement = {
      x: position.x - this._startPosition.x,
      y: position.y - this._startPosition.y,
    };
    const swipe = this._getDirection(displacement);
    const { x, y } = swipe;

    if (direction === 'all') {
      if (y.value < threshold && x.value < threshold) {
        return;
      }

      const direction = y.value > x.value ? y.direction : x.direction;

      EventHandler.trigger(this._element, `${EVENT}${direction}`);
      EventHandler.trigger(this._element, EVENT, { direction });
      this._startPosition = null;
      return;
    }

    const axis = direction === LEFT || direction === RIGHT ? 'x' : 'y';

    if (swipe[axis].direction === direction && swipe[axis].value > threshold) {
      EventHandler.trigger(this._element, `${EVENT}${swipe[axis].direction}`);
      this._startPosition = null;
    }
  }

  handleTouchEnd() {
    this._startPosition = null;
  }
}

export default Swipe;
