const flattenDeep = (array = []) => {
  return array.reduce(
    (acc, val) => (Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val)),
    []
  );
};

const pullAll = (array = [], items = []) => {
  items.forEach((item) => {
    for (let i = 0; i < array.length; i++) {
      if (array[i] === item) {
        array.splice(i, 1);
      } else {
        continue;
      }
    }
  });

  return array;
};

const take = (array = [], items = 1) => {
  if (array.length < items) {
    return array;
  }

  const output = array.slice(0, items);

  return output;
};

const takeRight = (array = [], items = 1) => {
  if (array.length < items) {
    return array;
  }

  const output = array.slice(array.length - items, array.length);

  return output;
};

const union = (...args) => {
  const output = [];

  args.forEach((arg) => {
    const value = Array.isArray(arg) ? arg : new Array(arg);

    output.push(value);
  });

  return uniq(flattenDeep(output));
};

const unionBy = (value, ...args) => {
  const array = flattenDeep(new Array(...args));

  return uniqBy(value, array);
};

const uniq = (array = []) => {
  return [...new Set(array)];
};

const uniqBy = (value, array = []) => {
  const flattenArray = flattenDeep(array);
  const values = [];
  const output = [];

  const type = typeof value;

  switch (type) {
    case 'function':
      for (let i = 0; i < flattenArray.length; i++) {
        if (values.includes(value(flattenArray[i]))) {
          continue;
        }

        values.push(value(flattenArray[i]));
        output.push(flattenArray[i]);
      }
      break;
    case 'string':
      for (let i = 0; i < flattenArray.length; i++) {
        if (values.includes(flattenArray[i][value])) {
          continue;
        }

        values.push(flattenArray[i][value]);
        output.push(flattenArray[i]);
      }
      break;
    default:
      throw new Error('Invalid iteratee parameter type');
  }

  return output;
};

const zip = (...args) => {
  const output = [];

  const lengths = args.map((item) => item.length);

  const maxLength = lengths.reduce((a, b) => Math.max(a, b));

  for (let i = 0; i < maxLength; i++) {
    output[i] = [];
    args.forEach((array) => {
      output[i].push(array[i]);
    });
  }

  return output;
};

const zipObject = (keys = [], values = []) => {
  const output = {};

  keys.forEach((key, index) => {
    output[key] = values[index];
  });

  return output;
};

export { flattenDeep, pullAll, take, takeRight, union, unionBy, uniq, uniqBy, zip, zipObject };
