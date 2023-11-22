import Manipulator from '../mdb/dom/manipulator';
import SelectorEngine from '../mdb/dom/selector-engine';
import { typeCheckConfig } from '../mdb/util/index';

const sort = ({ rows, field, order }) => {
  const sorted = rows.sort((a, b) => {
    let fieldA = a[field];
    let fieldB = b[field];

    if (typeof fieldA === 'string') {
      fieldA = fieldA.toLowerCase();
    }
    if (typeof fieldB === 'string') {
      fieldB = fieldB.toLowerCase();
    }

    if (fieldA < fieldB) {
      return order === 'desc' ? 1 : -1;
    }
    if (fieldA > fieldB) {
      return order === 'desc' ? -1 : 1;
    }
    return 0;
  });

  return sorted;
};

const search = (rows, search, column) => {
  if (!search) return rows;

  const match = (entry) => {
    return entry.toString().toLowerCase().match(search.toLowerCase());
  };

  return rows.filter((row) => {
    if (column && typeof column === 'string') {
      return match(row[column]);
    }

    let values = Object.values(row);

    if (column && Array.isArray(column)) {
      values = Object.keys(row)
        .filter((key) => column.includes(key))
        .map((key) => row[key]);
    }

    return (
      values.filter((value) => {
        return match(value);
      }).length > 0
    );
  });
};

const paginate = ({ rows, entries, activePage }) => {
  const firstVisibleEntry = activePage * entries;
  return rows.slice(firstVisibleEntry, firstVisibleEntry + entries);
};

const getColumn = (column, template) => {
  if (typeof column === 'string') {
    return {
      ...template,
      label: column,
    };
  }
  return {
    ...template,
    ...column,
  };
};

const formatColumns = (columns, defaultColumn, configType) => {
  return columns.map((column, i) => {
    const template = {
      ...defaultColumn,
      field: `field_${i}`,
      columnIndex: i,
    };

    const output = getColumn(column, template);

    // parse select options from string
    if (output.options && typeof output.options === 'string') {
      output.options = JSON.parse(output.options.replace(/'/g, '"'));
    }

    // ensure default value is a string
    if (output.defaultValue !== null) {
      output.defaultValue = output.defaultValue.toString();
    }

    if (configType) {
      typeCheckConfig('column', output, configType);
    }

    return output;
  });
};

const formatRows = (rows, columns) => {
  return rows.map((row) => {
    if (Array.isArray(row)) {
      const result = {};

      columns.forEach((column, i) => {
        let value = row[i];
        if (column.inputType === 'number' || column.inputType === 'checkbox') {
          value = JSON.parse(value);
        }

        result[column.field] = value;
      });

      return result;
    }

    return row;
  });
};

const getCSSValue = (size) => {
  if (typeof size === 'string') {
    return size;
  }

  return `${size}px`;
};

const getRowIndex = (el) => {
  const row = SelectorEngine.closest(el, 'tr');
  return Manipulator.getDataAttribute(row, 'index');
};

export { sort, search, paginate, getCSSValue, formatColumns, formatRows, getRowIndex };
