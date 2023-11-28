import { typeCheckConfig } from '../mdb/util/index';
import { getCSVDataArray, getSelectedEntries, normalize, getColumnsFromRows } from './util';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'datatableStrategy';

const DEFAULT_OPTIONS = {
  rows: {
    start: 0,
    end: undefined,
    indexes: undefined,
  },
  columns: {
    start: 0,
    end: undefined,
    indexes: undefined,
  },
  headerIndex: -1,
  keys: null,
  delimiter: ',',
};

const OPTIONS_TYPE = {
  columns: 'object',
  rows: 'object',
  headerIndex: 'number',
  keys: '(null|array)',
  delimiter: 'string',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class DatatableStrategy {
  constructor(format, options = {}) {
    this._format = format;
    this._options = this._getConfig(options);
  }

  // Getters

  // Public

  parse(data) {
    if (this._format === 'csv') {
      return this._parseCSV(data);
    }

    return this._parseJSON(data);
  }

  getValueExtrema(data, field) {
    const values = this._getFieldValues(data, field);

    const min = Math.min(...values);

    const max = Math.max(...values);

    return {
      min,
      max,
    };
  }

  // Private
  _getConfig(options) {
    const config = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  _parseCSV(data) {
    const { delimiter, columns, rows, headerIndex } = this._options;

    const dataArr = getCSVDataArray(data, delimiter);

    const header = dataArr[headerIndex];

    let computedRows = getSelectedEntries(dataArr, rows.indexes || rows.start, rows.end);

    if (!header) return { rows: computedRows };

    const computedColumns = getSelectedEntries(
      header,
      columns.indexes || columns.start,
      columns.end
    );

    computedRows = computedRows.map((row) => {
      return getSelectedEntries(row, columns.indexes || columns.start, columns.end);
    });

    return {
      rows: computedRows,
      columns: computedColumns,
    };
  }

  _parseJSON(data) {
    const { rows, keys } = this._options;

    let computedRows = getSelectedEntries(data, rows.indexes || rows.start, rows.end).map(
      (entry) => {
        const output = {};

        Object.keys(entry).forEach((key) => {
          output[key] = normalize(entry[key]);
        });

        return output;
      }
    );

    const columns = getColumnsFromRows(computedRows);

    if (!keys) {
      return {
        columns,
        rows: computedRows,
      };
    }

    computedRows = computedRows.map((row) => {
      columns.forEach((column) => {
        if (keys.indexOf(column) === -1) {
          delete row[column];
        }
      });

      return row;
    });

    return {
      columns: keys,
      rows: computedRows,
    };
  }

  _getFieldValues(data, field) {
    return data.map((entry) => entry[field]);
  }
}

export default DatatableStrategy;
