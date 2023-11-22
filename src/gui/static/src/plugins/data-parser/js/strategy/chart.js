import { typeCheckConfig } from '../mdb/util/index';
import {
  getCSVDataArray,
  getSelectedEntries,
  normalize,
  getColumnsFromRows,
  colorGenerator,
} from './util';
import colors from '../data/colorGenerator';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'chartStrategy';

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
  datasetLabel: null,
  labelsIndex: -1,
  delimiter: ',',
  keys: null,
  ignoreKeys: [],
  formatLabel: (label) => {
    return label;
  },
  getCoordinates: null,
  color: 'mdb',
};

const OPTIONS_TYPE = {
  datasetLabel: '(number|string|null)',
  rows: 'object',
  columns: 'object',
  labelsIndex: 'number',
  delimiter: 'string',
  keys: '(null|array)',
  ignoreKeys: 'array',
  formatLabel: 'function',
  getCoordinates: '(null|function)',
  color: '(string|number)',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class ChartStrategy {
  constructor(format, options = {}) {
    this._options = this._getConfig(options);

    this._format = format;

    this._structure = {
      labels: [],
      datasets: [
        {
          label: '',
          data: [],
        },
      ],
    };
  }

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

  _parseCSV(data) {
    const {
      delimiter,
      columns,
      rows,
      labelsIndex,
      datasetLabel,
      formatLabel,
      color,
      getCoordinates,
    } = this._options;

    const dataArr = getCSVDataArray(data, delimiter);

    const header = dataArr[labelsIndex];

    const computedRows = getSelectedEntries(dataArr, rows.indexes || rows.start, rows.end);

    if (!header) return { rows: computedRows };

    const labels = getSelectedEntries(header, columns.indexes || columns.start, columns.end);

    const colorIterator = colorGenerator(colors[color], 0);

    const datasets = computedRows.map((row) => {
      const getData = () => {
        const computedEntry = getSelectedEntries(
          row,
          columns.indexes || columns.start,
          columns.end
        );

        if (getCoordinates) {
          return [getCoordinates(computedEntry)];
        }

        return computedEntry;
      };

      const label = row[datasetLabel] || '';
      const color = colorIterator.next().value;
      const data = getData();

      return {
        label,
        data,
        color,
      };
    });

    return {
      datasets,
      labels: labels.map((label) => formatLabel(label)),
    };
  }

  _parseJSON(data) {
    const {
      rows,
      keys,
      ignoreKeys,
      datasetLabel,
      formatLabel,
      color,
      getCoordinates,
    } = this._options;

    const computedEntries = getSelectedEntries(data, rows.indexes || rows.start, rows.end).map(
      (entry) => {
        const output = {};

        Object.keys(entry).forEach((key) => {
          output[key] = normalize(entry[key]);
        });

        return output;
      }
    );

    const labels =
      keys ||
      getColumnsFromRows(computedEntries).filter((label) => ignoreKeys.indexOf(label) === -1);

    const colorIterator = colorGenerator(colors[color], 0);

    const datasets = computedEntries.map((entry) => {
      const getData = () => {
        if (getCoordinates) {
          return [getCoordinates(entry)];
        }

        return labels.map((label) => {
          return entry[label] || 0;
        });
      };

      const data = getData();
      const label = entry[datasetLabel] || '';
      const color = colorIterator.next().value;

      return {
        data,
        label,
        color,
      };
    });

    return {
      labels: labels.map((label) => formatLabel(label)),
      datasets,
    };
  }

  _getFieldValues(data, field) {
    return data.map((entry) => entry[field]);
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

export default ChartStrategy;
