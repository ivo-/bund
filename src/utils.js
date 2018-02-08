import assert from 'assert';

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

// Tests
(() => {
  assert.deepEqual(mapValues({ a: 1, b: 2 }, v => v + 1), { a: 2, b: 3 });
  assert.ok(shallowEqArrays([1, 2, 3], [1, 2, 3]));

  const f = memoize(a => f.a += a);

  f.a = 0;
  assert.equal(f.a, 0);

  f(10);
  assert.equal(f.a, 10);

  f(10);
  assert.equal(f.a, 10);

  f(1);
  assert.equal(f.a, 11);

  f(10);
  assert.equal(f.a, 21);
})();
