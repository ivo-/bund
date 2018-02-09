export function mapValues(obj, fn) {
  return Object.keys(obj).reduce((result, key) => {
    result[key] = fn(obj[key], key);
    return result;
  }, {});
}

export function shallowEqArrays(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function memoize(f) {
  let lastArgs = null;
  let lastResult = null;
  return (...args) => {
    if (!lastArgs || !shallowEqArrays(args, lastArgs)) {
      lastArgs = args;
      lastResult = f(...args);
    }

    return lastResult;
  };
}
