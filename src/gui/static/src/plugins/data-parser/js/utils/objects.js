const invert = (object = {}) => {
  const keys = Object.keys(object);

  const output = {};

  keys.forEach((key) => {
    output[object[key]] = key;
  });

  return output;
};

const invertBy = (object = {}, func = (key) => key) => {
  const keys = Object.keys(object);

  const output = {};

  keys.map((key) => {
    const newKey = func(object[key]);

    if (!Array.isArray(output[newKey])) {
      output[newKey] = [];
    }

    return output[newKey].push(key);
  });

  return output;
};

const omit = (object = {}, keys = []) => {
  const objectKeys = Object.keys(object);
  const output = {};

  objectKeys
    .filter((key) => {
      return !keys.includes(key);
    })
    .forEach((key) => {
      output[key] = object[key];
    });

  return output;
};

const omitBy = (object = {}, func = () => false) => {
  const objectKeys = Object.keys(object);
  const output = {};

  objectKeys
    .filter((key) => {
      return !func(object[key]);
    })
    .forEach((key) => {
      output[key] = object[key];
    });

  return output;
};

const pick = (object = {}, keys = []) => {
  const objectKeys = Object.keys(object);
  const output = {};

  objectKeys
    .filter((key) => {
      return keys.includes(key);
    })
    .forEach((key) => {
      output[key] = object[key];
    });

  return output;
};

const pickBy = (object = {}, func = () => false) => {
  const objectKeys = Object.keys(object);
  const output = {};

  objectKeys
    .filter((key) => {
      return func(object[key]);
    })
    .forEach((key) => {
      output[key] = object[key];
    });

  return output;
};

const transform = (object = {}, func, accumulator = {}) => {
  return Object.keys(object).reduce((a, b) => {
    const result = func(a, object[b], b);

    if (result !== undefined) {
      return result;
    }

    return accumulator;
  }, accumulator);
};

export { invert, invertBy, omit, omitBy, pick, pickBy, transform };
