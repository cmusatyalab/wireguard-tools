import { typeCheckConfig, isVisible } from '../mdb/util/index';
import EventHandler from '../mdb/dom/event-handler';
import Manipulator from '../mdb/dom/manipulator';
import SelectorEngine from '../mdb/dom/selector-engine';
import BSAlert from '../bootstrap/mdb-prefix/alert';
import Stack from '../mdb/util/stack';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'alert';
const SELECTOR_ALERT = '.alert';

const DefaultType = {
  position: '(string || null)',
  delay: 'number',
  autohide: 'boolean',
  width: '(string || null)',
  offset: 'number',
  stacking: 'boolean',
  hidden: 'boolean',
  appendToBody: 'boolean',
  color: '(string || null)',
  container: '(string|null)',
};

const Default = {
  position: null,
  delay: 1000,
  autohide: false,
  width: null,
  offset: 10,
  stacking: false,
  hidden: false,
  appendToBody: false,
  color: null,
  container: null,
};

const EVENT_CLOSE_BS = 'close.bs.alert';
const EVENT_CLOSED_BS = 'closed.bs.alert';

const EXTENDED_EVENTS = [{ name: 'close' }, { name: 'closed' }];

class Alert extends BSAlert {
  constructor(element, data = {}) {
    super(element, data);
    this._options = this._getConfig(data);

    this._init();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  dispose() {
    EventHandler.off(this._element, EVENT_CLOSE_BS);
    EventHandler.off(this._element, EVENT_CLOSED_BS);
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  // Getters

  get verticalOffset() {
    if (!this._options.stacking) return 0;

    return this.stackUtil.calculateOffset();
  }

  get parent() {
    const [parent] = SelectorEngine.parents(this._element, this._options.container);
    return parent;
  }

  get position() {
    const [y, x] = this._options.position.split('-');
    return { y, x };
  }

  // Public

  update(updatedData = {}) {
    if (this._timeout !== null) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    this._options = this._getConfig(updatedData);
    this._setup();
  }

  hide() {
    if (!this._element) {
      return;
    }

    if (this._element.classList.contains('show')) {
      Manipulator.toggleClass(this._element, 'show');
      const handler = (e) => {
        Manipulator.style(e.target, {
          display: 'none',
        });
        if (this._timeout !== null) {
          clearTimeout(this._timeout);
          this._timeout = null;
        }

        if (this._options.stacking) {
          this._updateAlertStack();
        }

        EventHandler.off(e.target, 'transitionend', handler);
      };

      EventHandler.on(this._element, 'transitionend', handler);
    }
  }

  show() {
    if (this._options.autohide) {
      this._setupAutohide();
    }
    if (!this._element.classList.contains('show')) {
      Manipulator.style(this._element, {
        display: 'block',
      });
      if (isVisible(this._element)) {
        const handler = (e) => {
          Manipulator.style(e.target, {
            display: 'block',
          });
          EventHandler.off(e.target, 'transitionend', handler);
        };
        Manipulator.toggleClass(this._element, 'show');
        if (this._options.position) {
          this._setupAlignment();
        }
        EventHandler.on(this._element, 'transitionend', handler);
      }
    }
  }

  // Private

  _init() {
    if (this._options.hidden) {
      Manipulator.style(this._element, {
        display: 'none',
      });
    }

    this._bindMdbEvents();

    this._setup();
  }

  _setup() {
    if (this._options.color) {
      this._setColor();
    }

    if (this._options.stacking) {
      this._setupStacking();
    }

    if (this._options.autohide) {
      this._setupAutohide();
    }
    if (this._options.width) {
      this._setupWidth();
    }
    if (this._options.appendToBody) {
      this._appendToBody();
    }
    if (!this._options.position) {
      return;
    }
    this._setupAlignment();
    this._setupPosition();
  }

  _setupStacking() {
    this.stackUtil = new Stack(this._element, SELECTOR_ALERT, {
      position: this.position.y,
      offset: this._options.offset,
      container: this._options.container,
      filter: (el) => {
        const instance = Alert.getInstance(el);

        if (!instance) return false;

        return (
          instance._options.container === this._options.container &&
          instance._options.position === this._options.position
        );
      },
    });

    EventHandler.on(this._element, 'closed.bs.alert', () => {
      this._updateAlertStack();
    });
  }

  _setColor() {
    const colors = [
      'primary',
      'secondary',
      'success',
      'info',
      'warning',
      'danger',
      'light',
      'dark',
    ];
    const color = colors.includes(this._options.color) ? this._options.color : 'primary';
    colors.forEach((color) => {
      this._element.classList.remove(`alert-${color}`);
    });
    Manipulator.addClass(this._element, `alert-${color}`);
  }

  _setupWidth() {
    Manipulator.style(this._element, {
      width: this._options.width,
    });
  }

  _setupAutohide() {
    this._timeout = setTimeout(() => {
      this.hide();
    }, this._options.delay);
  }

  _setupAlignment() {
    const oppositeY = this.position.y === 'top' ? 'bottom' : 'top';
    const oppositeX = this.position.x === 'left' ? 'right' : 'left';

    if (this.position.x === 'center') {
      Manipulator.style(this._element, {
        [this.position.y]: `${this.verticalOffset + this._options.offset}px`,
        [oppositeY]: 'unset',
        left: '50%',
        transform: 'translate(-50%)',
      });
    } else {
      Manipulator.style(this._element, {
        [this.position.y]: `${this.verticalOffset + this._options.offset}px`,
        [this.position.x]: `${this._options.offset}px`,
        [oppositeY]: 'unset',
        [oppositeX]: 'unset',
        transform: 'unset',
      });
    }
  }

  _setupPosition() {
    if (this._options.container) {
      Manipulator.addClass(this.parent, 'parent-alert-relative');
      Manipulator.addClass(this._element, 'alert-absolute');
    } else {
      Manipulator.addClass(this._element, 'alert-fixed');
    }
  }

  _appendToBody() {
    this._element.parentNode.removeChild(this._element);
    document.body.appendChild(this._element);
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

  _bindMdbEvents() {
    EventHandler.extend(this._element, EXTENDED_EVENTS, NAME);
  }

  _updatePosition() {
    Manipulator.style(this._element, {
      [this.position.y]: `${this.verticalOffset + this._options.offset}px`,
    });
  }

  _updateAlertStack() {
    this.stackUtil.nextElements.forEach((el) => {
      const instance = Alert.getInstance(el);

      if (!instance) {
        return;
      }

      instance._updatePosition();
    });
  }
}

export default Alert;
