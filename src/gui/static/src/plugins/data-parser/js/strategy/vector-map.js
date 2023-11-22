import { typeCheckConfig } from '../mdb/util/index';
import COUNTRY_DATA from '../data/countryCodes';
import COLOR_MAP from '../data/colorMap';

import { getCSVDataArray, getSelectedEntries } from './util';

import MARKERS from '../data/markers';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'vectorMapStrategy';
const DEFAULT_OPTIONS = {
  field: null,
  color: 'blue',
  countries: undefined,
  countryIdentifier: null,
  rows: {
    start: 0,
    end: undefined,
    indexes: undefined,
  },
  headerIndex: -1,
  delimiter: ',',
  tooltips: () => null,
};
const OPTIONS_TYPE = {
  field: '(number|string|null)',
  color: '(string|array)',
  countryIdentifier: '(number|string|null)',
  rows: 'object',
  headerIndex: 'number',
  delimiter: 'string',
  tooltips: 'function',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class VectorMapStrategy {
  constructor(format, options = {}) {
    this._options = this._getConfig(options);
    this._format = format;

    this._colorMap = this._setColorMap();
  }

  // Getters

  // Public

  parse(data) {
    return this._parseArrayData(this._getDataArray(data));
  }

  getIdentifiers(data) {
    const entries = this._getEntries(this._getDataArray(data));

    return entries.map((entry) => this._getAlpha2Code(entry));
  }

  getValueExtrema(data, field) {
    const values = this._getFieldValues(this._getEntries(this._getDataArray(data)), field);

    return this._getBoundryValues(values);
  }

  getMapCoordinates(latitude, longitude) {
    const closestYPoints = this._getClosestPoints(latitude, 'latitude');
    const closestXPoints = this._getClosestPoints(longitude, 'longitude');

    return {
      x: this._getCoordinate(closestXPoints, latitude, 'x'),
      y: this._getCoordinate(closestYPoints, longitude, 'y'),
    };
  }

  // Private
  _getClosestPoints(value, coordinate) {
    const points = MARKERS.sort((a, b) => {
      const value = a[coordinate] - b[coordinate];
      if (value < 0) return -1;
      if (value > 0) return 1;
      return 0;
    });

    const result1 = points.reduce((a, b, i, markers) => {
      return i && Math.abs(markers[a][coordinate] - value) < Math.abs(b[coordinate] - value)
        ? a
        : i;
    }, -1);

    const points2 = points.filter((marker) => marker !== points[result1]);

    const result2 = points2.reduce((a, b, i, markers) => {
      return i && Math.abs(markers[a][coordinate] - value) < Math.abs(b[coordinate] - value)
        ? a
        : i;
    }, -1);

    const point1 = points[result1];
    const point2 = points2[result2];

    return {
      point1,
      point2,
    };
  }

  _getCoordinate({ point1, point2 }, value, axis) {
    const coordinate = axis === 'x' ? 'latitude' : 'longitude';

    const coordinateDiff1 = point1[coordinate] - value;

    const coordinateDiff2 = point2[coordinate] - value;

    const searchedValue =
      (coordinateDiff2 * point1[axis] - coordinateDiff1 * point2[axis]) /
      (coordinateDiff2 - coordinateDiff1);

    return searchedValue;
  }

  _parseArrayData(data) {
    return this._generateColorCodes(this._getEntries(data));
  }

  _getDataArray(data) {
    if (this._format === 'csv') {
      const { delimiter } = this._options;

      return getCSVDataArray(data, delimiter);
    }

    return data;
  }

  _getEntries(data) {
    const { rows, countries } = this._options;

    return countries
      ? this._getSelectedCountries(data)
      : getSelectedEntries(data, rows.indexes || rows.start, rows.end);
  }

  _getConfig(options) {
    const config = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  _getBoundryValues(array) {
    return {
      max: Math.max(...array),
      min: Math.min(...array),
    };
  }

  _getSelectedCountries(array) {
    const { countryIdentifier: identifier, countries } = this._options;

    return array.filter((entry) => {
      return countries.indexOf(entry[identifier]) !== -1;
    });
  }

  _generateColorCodes(data) {
    const { field, step: fixedStep } = this._options;
    const intervals = this._colorMap.length;

    const values = data.map((entry) => entry[field]);

    const { min, max } = this._getBoundryValues(values);

    const step = fixedStep || Math.floor((max - min) / intervals);

    const legend = this._colorMap.map((color, i) => {
      const minValue = min + i * step;
      let maxValue = minValue + step;

      if (i === intervals - 1) {
        maxValue = max;
      }

      return {
        color,
        min: minValue,
        max: maxValue,
      };
    });

    const colorMap = this._colorMap.map((color) => ({
      fill: color,
      regions: [],
    }));

    values.forEach((value, i) => {
      const interval = Math.floor((value - min) / step);

      const index = interval < intervals ? interval : intervals - 1;

      const alpha2Code = this._getAlpha2Code(data[i]);

      if (!alpha2Code) return;

      colorMap[index].regions.push({
        id: alpha2Code,
        tooltip: this._options.tooltips(value),
      });
    });

    return { colorMap, legend };
  }

  _getAlpha2Code(entry) {
    const { countryIdentifier: identifier } = this._options;

    const findCountry = (value, key) => {
      return COUNTRY_DATA.find((country) => country[key].toLowerCase().match(value.toLowerCase()));
    };

    let key;

    switch (entry[identifier].length) {
      case 2:
        key = 'alpha2';
        break;
      case 3:
        key = 'alpha3';
        break;
      default:
        key = 'country';
    }

    const country = findCountry(entry[identifier], key);

    if (!country) {
      return null;
    }

    return country.alpha2;
  }

  _getFieldValues(data, field) {
    return data.map((entry) => entry[field]);
  }

  _setColorMap() {
    const { color } = this._options;

    if (Array.isArray(color)) return color;

    const colorMap = COLOR_MAP[color];

    if (!colorMap) {
      throw new Error(`Color ${color} not found.`);
    }

    return colorMap;
  }
}

export default VectorMapStrategy;
