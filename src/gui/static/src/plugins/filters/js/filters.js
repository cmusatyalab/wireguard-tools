import { getjQuery, typeCheckConfig, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';
import EventHandler from './mdb/dom/event-handler';
/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */
const NAME = 'filters';
const DATA_KEY = 'mdb.filters';
const SELECTOR_INPUT = 'input';
const EVENT_UPDATE = 'update.mdb.filters';

const SELECTOR_DATA_INIT = '[data-mdb-filters-init]';

const Default = {
  items: null,
  autoFilter: false,
};

const DefaultType = {
  items: 'string || array',
  autoFilter: 'boolean',
};

class Filters {
  constructor(element, data) {
    this._element = element;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }

    this._options = this._getConfig(data);

    this.DOMElements = Array.isArray(this._options.items)
      ? null
      : SelectorEngine.find(this._options.items);

    this.setupInputs = this._setupInputs.bind(this);

    this.sortProperty = null;

    this.sortOrder = 'asc';

    this.customSort = null;

    this._filters = null;

    if (this.DOMElements) {
      [this._parent] = SelectorEngine.parents(this.DOMElements[0], '*');
    }

    this._init();
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get computedItems() {
    const items = this.DOMElements || this._options.items;

    return this._sort(this._filter(items));
  }

  get filterKeys() {
    return Object.keys(this._filters);
  }

  // Public

  filter(filters) {
    this._filters = { ...this._filters, ...filters };
    this._updateItems();
  }

  sort(category, order = 'asc', customSort) {
    this.sortProperty = category;
    this.sortOrder = order;
    this.customSort = customSort;

    this._updateItems();
  }

  getFilters() {
    return this._availableFilters;
  }

  getActiveFilters() {
    return this._filters;
  }

  clear() {
    this._filters = {};

    this.filter(this._filters);

    this._inputs.forEach((input) => {
      input.checked = false;
    });

    this._updateItems();
  }

  dispose() {
    this._inputs.forEach((input) => {
      EventHandler.off(input, 'change', this.setupInputs);
    });
    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  // Private

  _init() {
    this._inputs = SelectorEngine.find(SELECTOR_INPUT, this._element);

    this._filters = {};

    this._availableFilters = this._setAvailableFilters();

    if (this._options.autoFilter) {
      this._setupInputs();
    }

    this._inputs.forEach((input) => {
      EventHandler.off(input, 'change', this.setupInputs);
    });
  }

  _updateItems() {
    if (this.DOMElements) {
      this.DOMElements.forEach((el) => {
        if (el.parentNode === this._parent) {
          this._parent.removeChild(el);
        }
      });
      this.computedItems.forEach((el) => {
        this._parent.appendChild(el);
      });
    }
    const items = this.computedItems;
    EventHandler.trigger(this._element, EVENT_UPDATE, {
      items,
    });
    return items;
  }

  _filter(items) {
    if (!this._filters) {
      return items;
    }

    const getItem = (item) => (this.DOMElements ? this._getDataObject(item) : item);

    return items.filter((item) => this._filterHandler(getItem(item)));
  }

  _getDataObject(item) {
    const attrs = Manipulator.getDataAttributes(item);

    const attrKeys = Object.keys(attrs);

    const output = {};

    for (let i = 0; i < attrKeys.length; i++) {
      const attr = attrKeys[i];

      const value = attrs[attr];

      let parsedValue = value;

      if (typeof value === 'string' && value.match(/\[.*?\]/)) {
        // eslint-disable-next-line prettier/prettier
        parsedValue = JSON.parse(value.replaceAll("'", '"')).map((el) => el.toString());

        // eslint-disable-next-line no-restricted-globals
      } else if (!isNaN(parseInt(value, 10))) {
        parsedValue = parseInt(value, 10);
      }

      output[attr] = parsedValue;
    }

    return output;
  }

  _filterHandler(item) {
    for (let i = 0; i < this.filterKeys.length; i++) {
      const key = this.filterKeys[i];
      const filterValue = this._filters[key];
      const itemValue = item[key];

      if (typeof filterValue === 'function') {
        if (filterValue(itemValue) === false) {
          return false;
        }
        continue;
      } else if (Array.isArray(itemValue)) {
        const check = (filter, item) => {
          return filter.filter((value) => item.includes(value)).length > 0;
        };

        if (!check(filterValue, itemValue)) {
          return false;
        }
      } else if (!filterValue.includes(itemValue)) {
        return false;
      }
    }
    return true;
  }

  _sort(items) {
    if (!this.sortProperty) {
      return items;
    }

    const compare = (a, b) => {
      if (this.customSort) {
        return this.customSort(a, b);
      }

      if (this.sortOrder === 'asc' ? a > b : a < b) {
        return 1;
      }

      if (this.sortOrder === 'asc' ? a < b : a > b) {
        return -1;
      }

      return 0;
    };

    if (this.DOMElements) {
      return items.sort((a, b) => {
        const aValue = Manipulator.getDataAttribute(a, this.sortProperty);
        const bValue = Manipulator.getDataAttribute(b, this.sortProperty);

        return compare(aValue, bValue);
      });
    }

    return items.sort((a, b) => {
      const aValue = a[this.sortProperty];
      const bValue = b[this.sortProperty];

      return compare(aValue, bValue);
    });
  }

  _setupInputs() {
    this._inputs.forEach((input) => {
      const [parent] = SelectorEngine.parents(input, '[data-mdb-filter]');
      if (!parent) return;
      const key = Manipulator.getDataAttribute(parent, 'filter');
      EventHandler.on(input, 'change', (e) => this._inputHandler(e, key));
    });
  }

  _inputHandler(e, key) {
    let value;
    const { type, value: staticValue, checked } = e.target;

    if (type === 'checkbox') {
      value = checked ? staticValue : null;
    } else {
      value = staticValue;
    }

    if (!Array.isArray(this._filters[key])) {
      this._filters[key] = [];
    }

    if (value === null) {
      this._filters[key] = this._filters[key].filter((filter) => {
        return filter !== staticValue;
      });

      if (this._filters[key].length === 0) {
        delete this._filters[key];
      }
    } else if (type === 'radio') {
      this._filters[key] = [value];
    } else {
      this._filters[key].push(value);
    }

    return this.filter(this._filters);
  }

  _setAvailableFilters() {
    const output = [];
    if (this.DOMElements) {
      this.DOMElements.forEach((el) => {
        Object.keys(Manipulator.getDataAttributes(el)).forEach((attr) => {
          output.push(attr);
        });
      });
    } else {
      this._options.items.forEach((el) => {
        Object.keys(el).forEach((attr) => {
          output.push(attr);
        });
      });
    }
    return [...new Set(output)];
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

  // Static
  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config, param1, param2) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;
      if (!data) {
        data = new Filters(this, _config);
      }
      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](param1, param2);
      }
    });
  }
}

// Auto-init

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((el) => {
  let instance = Filters.getInstance(el);
  if (!instance) {
    instance = new Filters(el);
  }
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Filters.jQueryInterface;
    $.fn[NAME].Constructor = Filters;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Filters.jQueryInterface;
    };
  }
});

export default Filters;
