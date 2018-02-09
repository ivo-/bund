import { mapValues, shallowEqArrays, memoize } from './utils';

exports.deepEqual = test => {
  test.deepEqual(mapValues({ a: 1 }, v => v), { a: 1 });
  test.deepEqual(mapValues({ a: 1, b: 2 }, v => v + 1), { a: 2, b: 3 });

  test.done();
};

exports.shallowEqArrays = test => {
  test.ok(shallowEqArrays([], []));
  test.ok(shallowEqArrays([1, 2], [1, 2]));
  test.ok(!shallowEqArrays([1, 2], [1, 2, 3]));

  test.done();
};

exports.memoize = test => {
  const f = memoize(a => f.a += a);

  f.a = 0;
  test.equal(f.a, 0);

  f(10);
  test.equal(f.a, 10);

  f(10);
  test.equal(f.a, 10);

  f(1);
  test.equal(f.a, 11);

  f(10);
  test.equal(f.a, 21);

  test.done();
};
