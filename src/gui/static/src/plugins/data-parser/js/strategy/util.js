import chartColors from '../data/colorGenerator';
import colorMap from '../data/colorMap';

const getCSVDataArray = (data, delimiter = ',') => {
  return data.split('\n').map((row) => row.split(delimiter).map((value) => normalize(value)));
};

const getSelectedEntries = (array, a, b) => {
  if (typeof a === 'number') {
    return array.slice(a, b);
  }

  return array.filter((_, i) => a.indexOf(i) !== -1);
};

const normalize = (value) => {
  // Booleans
  if (value === 'true' || value === true) {
    return true;
  }
  if (value === 'false' || value === false) {
    return false;
  }

  // eslint-disable-next-line
  if (!isNaN(Number(value))) {
    return parseFloat(value);
  }

  return value;
};

const getColumnsFromRows = (rows) => {
  const [row] = rows;

  if (!row) {
    return [];
  }

  return Object.keys(row);
};

function* colorGenerator(colors, i) {
  const colorLibrary = {
    ...colorMap,
    ...chartColors,
  };

  const colorPalette = Array.isArray(colors) ? colors : colorLibrary[colors];

  while (true) {
    yield colorPalette[i];

    i++;

    if (i > colorPalette.length - 1) {
      i = 0;
    }
  }
}

export { colorGenerator, getCSVDataArray, getSelectedEntries, getColumnsFromRows, normalize };
