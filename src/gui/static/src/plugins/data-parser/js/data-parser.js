import DatatableStrategy from './strategy/datatable';
import ChartStrategy from './strategy/chart';
import VectorMapStrategy from './strategy/vector-map';
import TreeviewStrategy from './strategy/treeview';
import {
  flattenDeep,
  pullAll,
  take,
  takeRight,
  union,
  unionBy,
  uniq,
  uniqBy,
  zip,
  zipObject,
} from './utils/arrays';

import { countBy, groupBy, sortBy, orderBy } from './utils/collections';
import { invert, invertBy, omit, omitBy, pick, pickBy, transform } from './utils/objects';
import { colorGenerator, getCSVDataArray } from './strategy/util';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'dataParser';

const STRATEGY_VECTOR_MAP = 'vectorMap';
const STRATEGY_DATATABLE = 'datatable';
const STRATEGY_CHART = 'chart';
const STRATEGY_TREEVIEW = 'treeview';

const PARSER_STRATEGY = {
  [STRATEGY_DATATABLE]: DatatableStrategy,
  [STRATEGY_CHART]: ChartStrategy,
  [STRATEGY_VECTOR_MAP]: VectorMapStrategy,
  [STRATEGY_TREEVIEW]: TreeviewStrategy,
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class DataParser {
  constructor(strategy = STRATEGY_DATATABLE, format = 'json', options) {
    this._strategy = strategy;
    this._format = format;
    this._options = options;

    this._parser = this._setupStrategy();
  }

  // Public
  parse(data) {
    return this._parser.parse(data);
  }

  getValueExtrema(data, field) {
    return this._parser.getValueExtrema(data, field);
  }

  // Vector Map

  getRegionIdentifiers(data) {
    if (this._strategy !== STRATEGY_VECTOR_MAP) {
      throw new Error(`This method is not available for ${this._strategy} strategy`);
    }

    return this._parser.getIdentifiers(data);
  }

  getMapCoordinates(latitude, longitude) {
    return this._parser.getMapCoordinates(latitude, longitude);
  }

  // Private

  _setupStrategy() {
    if (!PARSER_STRATEGY[this._strategy]) {
      throw new Error(`Parser strategy ${this._strategy} not found`);
    }

    return new PARSER_STRATEGY[this._strategy](this._format, this._options);
  }

  // Static
  static get NAME() {
    return NAME;
  }

  // Array utils

  static flattenDeep(...args) {
    return flattenDeep(args);
  }

  static pullAll(...args) {
    return pullAll(...args);
  }

  static take(...args) {
    return take(...args);
  }

  static takeRight(...args) {
    return takeRight(...args);
  }

  static union(...args) {
    return union(...args);
  }

  static unionBy(...args) {
    return unionBy(...args);
  }

  static uniq(...args) {
    return uniq(...args);
  }

  static uniqBy(...args) {
    return uniqBy(...args);
  }

  static zip(...args) {
    return zip(...args);
  }

  static zipObject(...args) {
    return zipObject(...args);
  }

  // Collection utils

  static countBy(...args) {
    return countBy(...args);
  }

  static groupBy(...args) {
    return groupBy(...args);
  }

  static sortBy(...args) {
    return sortBy(...args);
  }

  static orderBy(...args) {
    return orderBy(...args);
  }

  // Object utils

  static invert(...args) {
    return invert(...args);
  }

  static invertBy(...args) {
    return invertBy(...args);
  }

  static omit(...args) {
    return omit(...args);
  }

  static omitBy(...args) {
    return omitBy(...args);
  }

  static pick(...args) {
    return pick(...args);
  }

  static pickBy(...args) {
    return pickBy(...args);
  }

  static transform(...args) {
    return transform(...args);
  }

  // More

  static colorGenerator(...args) {
    return colorGenerator(...args);
  }

  static getCSVDataArray(...args) {
    return getCSVDataArray(...args);
  }
}

export default DataParser;
