/* eslint-disable consistent-return */
const countBy = (collection = [], value) => {
  const valueType = typeof value;
  const collectionType = Array.isArray(collection);
  const output = {};

  if (collectionType) {
    const keys =
      valueType === 'function'
        ? collection.map((item) => value(item))
        : collection.map((item) => item[value]);

    [...new Set(keys)].forEach((key) => {
      output[key] = 0;

      keys.forEach((item) => {
        if (key === item) {
          output[key]++;
        }

        return;
      });
    });
  } else {
    const objKeys = Object.keys(collection);
    const keys =
      valueType === 'function'
        ? objKeys.map((item) => value(collection[item]))
        : objKeys.map((item) => collection[item][value]);

    [...new Set(keys)].forEach((key) => {
      output[key] = 0;

      keys.forEach((item) => {
        if (key === item) {
          output[key]++;
        }

        return;
      });
    });
  }

  return output;
};

const groupBy = (collection = [], value) => {
  const valueType = typeof value;
  const collectionType = Array.isArray(collection);
  const output = {};

  if (collectionType) {
    const keys =
      valueType === 'function'
        ? collection.map((item) => value(item))
        : collection.map((item) => item[value]);

    [...new Set(keys)].forEach((key) => {
      output[key] = [];

      keys.forEach((item, index) => {
        if (key === item) {
          output[key].push(collection[index]);
        }

        return;
      });
    });
  } else {
    const objKeys = Object.keys(collection);
    const keys =
      valueType === 'function'
        ? objKeys.map((item) => value(collection[item]))
        : objKeys.map((item) => collection[item][value]);

    [...new Set(keys)].forEach((key) => {
      output[key] = [];

      keys.forEach((item, index) => {
        if (key === item) {
          output[key].push(collection[objKeys[index]]);
        }

        return;
      });
    });
  }

  return output;
};

const orderBy = (collection = [], values = [], order = []) => {
  let output = [];

  if (order.length < values.length) {
    for (let i = order.length; i < values.length; i++) {
      order[i] = 'asc';
    }
  }

  const valuesType = Array.isArray(values);

  const length = valuesType ? values.length : 1;

  const collectionType = Array.isArray(collection);

  if (collectionType) {
    if (typeof collection[0] === 'object') {
      // eslint-disable-next-line array-callback-return
      output = collection.sort((a, b) => {
        for (let i = 0; i < length; i++) {
          const aValue = valuesType ? a[values[i]] : values(a);
          const bValue = valuesType ? b[values[i]] : values(b);

          if (order[i] === 'desc') {
            if (aValue < bValue) {
              return 1;
            }

            if (aValue > bValue) {
              return -1;
            }

            continue;
          }

          if (aValue > bValue) {
            return 1;
          }

          if (aValue < bValue) {
            return -1;
          }

          continue;
        }
      });
    } else {
      output = collection.sort();

      if (values === 'desc' || values[0] === 'desc') {
        output.reverse();
      }
    }
  } else {
    const keys = Object.keys(collection);

    const valuesToSort = keys.map((key) => collection[key]);

    output = valuesToSort.sort();

    if (values === 'desc' || values[0] === 'desc') {
      output.reverse();
    }
  }

  return output;
};

const sortBy = (collection = [], values = []) => {
  let output = [];

  const valuesType = Array.isArray(values);

  const length = valuesType ? values.length : 1;

  const collectionType = Array.isArray(collection);

  if (collectionType) {
    if (typeof collection[0] === 'object') {
      // eslint-disable-next-line array-callback-return
      output = collection.sort((a, b) => {
        for (let i = 0; i < length; i++) {
          const aValue = valuesType ? a[values[i]] : values(a);
          const bValue = valuesType ? b[values[i]] : values(b);

          if (aValue > bValue) {
            return 1;
          }

          if (aValue < bValue) {
            return -1;
          }

          continue;
        }
      });
    } else {
      output = collection.sort();
    }
  } else {
    const keys = Object.keys(collection);

    const valuesToSort = keys.map((key) => collection[key]);

    output = valuesToSort.sort();
  }

  return output;
};

export { countBy, groupBy, orderBy, sortBy };
