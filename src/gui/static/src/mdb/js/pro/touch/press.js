import TouchUtil from './touchUtil';
import EventHandler from '../../mdb/dom/event-handler';

const DEFAULT_OPTIONS = {
  time: 250,
  pointers: 1,
};

const NAME = 'press';
const EVENT_UP = 'pressup';

class Press extends TouchUtil {
  constructor(element, options = {}) {
    super();
    this._element = element;
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this._timer = null;
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  handleTouchStart(e) {
    const { time, pointers } = this._options;

    if (e.touches.length === pointers) {
      this._timer = setTimeout(() => {
        EventHandler.trigger(this._element, NAME, { touch: e, time });
        EventHandler.trigger(this._element, EVENT_UP, { touch: e });
      }, time);
    }
  }

  handleTouchEnd() {
    clearTimeout(this._timer);
  }
}

export default Press;
