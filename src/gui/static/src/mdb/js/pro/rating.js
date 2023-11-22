import { typeCheckConfig } from '../mdb/util/index';
import Data from '../mdb/dom/data';
import EventHandler from '../mdb/dom/event-handler';
import SelectorEngine from '../mdb/dom/selector-engine';
import Tooltip from '../free/tooltip';
import Manipulator from '../mdb/dom/manipulator';
import BaseComponent from '../free/base-component';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'rating';
const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;

const ARROW_LEFT_KEY = 'ArrowLeft';
const ARROW_RIGHT_KEY = 'ArrowRight';

const DefaultType = {
  tooltip: 'string',
  value: '(string|number)',
  readonly: 'boolean',
  after: 'string',
  before: 'string',
  dynamic: 'boolean',
};

const Default = {
  tooltip: 'top',
  value: '',
  readonly: false,
  after: '',
  before: '',
  dynamic: false,
};

const EVENT_SELECT = `scoreSelect${EVENT_KEY}`;
const EVENT_HOVER = `scoreHover${EVENT_KEY}`;
const EVENT_KEYUP = `keyup${EVENT_KEY}`;
const EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
const EVENT_KEYDOWN = `keydown${EVENT_KEY}`;
const EVENT_MOUSEDOWN = `mousedown${EVENT_KEY}`;

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Rating extends BaseComponent {
  constructor(element, options) {
    super(element);

    this._icons = SelectorEngine.find('i', this._element);
    this._options = this._getConfig(options);
    this._index = -1;
    this._savedIndex = null;
    this._originalClassList = [];
    this._fn = {};
    this._tooltips = [];

    if (this._element) {
      this._init();
      Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
      bindCallbackEventsIfNeeded(this.constructor);
    }
  }

  // Getters
  static get NAME() {
    return NAME;
  }

  dispose() {
    if (!this._options.readonly) {
      EventHandler.off(this._element, EVENT_KEYUP);
      EventHandler.off(this._element, EVENT_FOCUSOUT);
      EventHandler.off(this._element, EVENT_KEYDOWN);
      this._element.removeEventListener('mouseleave', this._fn.mouseleave);

      this._icons.forEach((el, i) => {
        EventHandler.off(el, EVENT_MOUSEDOWN);
        el.removeEventListener('mouseenter', this._fn.mouseenter[i]);
      });

      this._tooltips.forEach((el) => {
        el._element.removeAttribute('data-mdb-toggle');
        el.dispose();
      });

      this._element.removeAttribute('tabIndex');
    }
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  // Private
  _init() {
    if (!this._options.readonly) {
      this._bindMouseEnter();
      this._bindMouseLeave();
      this._bindMouseDown();
      this._bindKeyDown();
      this._bindKeyUp();
      this._bindFocusLost();
    }

    if (this._options.dynamic) {
      this._saveOriginalClassList();
    }

    this._setCustomText();
    this._setCustomColor();
    this._setToolTips();

    if (this._options.value) {
      this._index = this._options.value - 1;
      this._updateRating(this._index);
    }
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _bindMouseEnter() {
    this._fn.mouseenter = [];
    this._icons.forEach((el, i) => {
      // EventHandler.on changes mouseenter to mouseover - use addEventListener
      el.addEventListener(
        'mouseenter',
        // this._fn.mouseenter[i] is needed to create reference and unpin events after call dispose
        // prettier-ignore
        this._fn.mouseenter[i] = (e) => {
          this._index = this._icons.indexOf(e.target);
          this._updateRating(this._index);
          this._triggerEvents(el, EVENT_HOVER);
          // prettier-ignore
        }
      );
    });
  }

  _bindMouseLeave() {
    // EventHandler.on changes mouseleave to mouseout - use addEventListener
    this._element.addEventListener(
      'mouseleave',
      // this._fn.mouseleave is needed to create reference and unpin events after call dispose
      // prettier-ignore
      this._fn.mouseleave = () => {
        if (this._savedIndex !== null) {
          this._updateRating(this._savedIndex);
          this._index = this._savedIndex;
        } else if (this._options.value) {
          this._updateRating(this._options.value - 1);
          this._index = this._options.value - 1
        } else {
          this._index = -1;
          this._clearRating();
        }
        // prettier-ignore
      }
    );
  }

  _bindMouseDown() {
    this._icons.forEach((el) => {
      EventHandler.on(el, EVENT_MOUSEDOWN, () => {
        this._setElementOutline('none');
        this._savedIndex = this._index;
        this._triggerEvents(el, EVENT_SELECT);
      });
    });
  }

  _bindKeyDown() {
    this._element.tabIndex = 0;
    EventHandler.on(this._element, EVENT_KEYDOWN, (e) => this._updateAfterKeyDown(e));
  }

  _bindKeyUp() {
    EventHandler.on(this._element, EVENT_KEYUP, () => this._setElementOutline('auto'));
  }

  _bindFocusLost() {
    EventHandler.on(this._element, EVENT_FOCUSOUT, () => this._setElementOutline('none'));
  }

  _setElementOutline(value) {
    this._element.style.outline = value;
  }

  _triggerEvents(el, event) {
    EventHandler.trigger(el, event, {
      value: this._index + 1,
    });
  }

  _updateAfterKeyDown(e) {
    const maxIndex = this._icons.length - 1;
    const indexBeforeChange = this._index;

    if (e.key === ARROW_RIGHT_KEY && this._index < maxIndex) {
      this._index += 1;
    }

    if (e.key === ARROW_LEFT_KEY && this._index > -1) {
      this._index -= 1;
    }

    if (indexBeforeChange !== this._index) {
      this._savedIndex = this._index;
      this._updateRating(this._savedIndex);
      this._triggerEvents(this._icons[this._savedIndex], EVENT_SELECT);
    }
  }

  _updateRating(index) {
    this._clearRating();

    if (this._options.dynamic) {
      this._restoreOriginalIcon(index);
    }

    this._icons.forEach((el, i) => {
      if (i <= index) {
        el.classList.add('fas', 'active');
        el.classList.remove('far');
      }
    });
  }

  _clearRating() {
    this._icons.forEach((el, i) => {
      if (this._options.dynamic) {
        el.classList = this._originalClassList[i];
      } else {
        el.classList.remove('fas', 'active');
        el.classList.add('far');
      }
    });
  }

  _setToolTips() {
    this._icons.forEach((el, i) => {
      const hasOwnTooltips = Manipulator.getDataAttribute(el, 'toggle');

      if (el.title && !hasOwnTooltips) {
        Manipulator.setDataAttribute(el, 'toggle', 'tooltip');
        this._tooltips[i] = new Tooltip(el, { placement: this._options.tooltip });
      }
    });
  }

  _setCustomText() {
    this._icons.forEach((el) => {
      const after = Manipulator.getDataAttribute(el, 'after');
      const before = Manipulator.getDataAttribute(el, 'before');

      if (after) {
        el.insertAdjacentHTML('afterEnd', after);
      }

      if (before) {
        el.insertAdjacentHTML('beforeBegin', before);
      }
    });
  }

  _setCustomColor() {
    this._icons.forEach((el) => {
      const color = Manipulator.getDataAttribute(el, 'color');

      if (color) {
        el.style.color = color;
      }
    });
  }

  _saveOriginalClassList() {
    this._icons.forEach((el) => {
      const classList = el.classList.value;
      this._originalClassList.push(classList);
    });
  }

  _restoreOriginalIcon(index) {
    const classList = this._originalClassList[index];
    const color = Manipulator.getDataAttribute(this._icons[index], 'color');

    this._icons.forEach((el, i) => {
      if (i <= index) {
        el.classList = classList;
        el.style.color = color;
      }
    });
  }

  // Static

  static autoInit(el) {
    return new Rating(el);
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose|hide/.test(config)) {
        return;
      }

      if (!data) {
        data = new Rating(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](options);
      }
    });
  }
}

export default Rating;
