import { typeCheckConfig } from '../mdb/util/index';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'treeviewStrategy';

const DEFAULT_OPTIONS = {
  name: 'name',
  children: 'children',
  icon: null,
  show: false,
  disabled: false,
  id: null,
};
const OPTIONS_TYPE = {
  name: '(string|function)',
  children: 'string',
  icon: '(null|function|string)',
  show: '(function|boolean)',
  disabled: '(function|boolean)',
  id: '(null|number|string)',
};

const TREEVIEW_KEYS = ['name', 'children', 'show', 'disabled', 'id', 'icon'];

const FUNCTION_KEYS = ['icon', 'disabled', 'show', 'name'];

const REFERENCE_KEYS = ['children', 'name'];

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class TreeviewStrategy {
  constructor(format, options = {}) {
    this._options = this._getConfig(options);

    this._format = format;

    this._data = [];

    this._structure = [];

    this._functionKeys = FUNCTION_KEYS.filter((key) => typeof this._options[key] === 'function');

    this._referenceKeys = REFERENCE_KEYS.filter((key) => typeof key === 'string');
  }

  // Public

  parse(data) {
    this._data = data;

    return this._parseStructure(data);
  }

  // Private

  _parseStructure(structure) {
    return structure.map((el) => {
      return this._parseNode(el);
    });
  }

  _parseNode(el) {
    const output = {};

    TREEVIEW_KEYS.forEach((key) => {
      if (this._functionKeys.includes(key)) {
        output[key] = this._options[key](el);
      } else if (this._referenceKeys.includes(key)) {
        if (!el[this._options[key]]) {
          return;
        }

        if (key === 'children') {
          output.children = this._parseStructure(el[this._options[key]]);
        } else {
          output[key] = el[this._options[key]];
        }
      } else {
        output[key] = this._options[key];
      }
    });

    return output;
  }

  _getConfig(options) {
    const config = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }
}

export default TreeviewStrategy;
