const {
  bundle,
  combine,
  asyncAction,

  comp,
  partial,
  mapValues,
  shallowEqArrays,
  memoize,
  createPartialMemoize,
} = require('./api');

// TODO: Test onChange and applyAction

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
  const f = memoize(a => (f.a += a));

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

exports.partial = test => {
  const sum = (...args) => args.reduce((a, b) => a + b);

  const plus1 = partial(sum, 1);
  test.equal(plus1(2), 3);

  const plus3 = partial(sum, 3);
  test.equal(plus3(2), 5);

  const const4 = partial(plus1, 3);
  test.equal(const4(), 4);
  test.done();
};

exports.comp = test => {
  test.equal(comp(() => 1, () => 2)(1), 1);
  test.equal(comp(v => v + 1, v => v + 2)(1), 4);
  test.done();
};

exports.createParitalMemoize = test => {
  const partialMemoize = createPartialMemoize(2, 3);
  const f = () => true;
  const cf = partialMemoize(f, 1);


  test.equal(cf, partialMemoize(f, 1));

  test.equal(partialMemoize(f, 1, 2), partialMemoize(f, 1, 2));
  test.notEqual(partialMemoize(f, 1, 2), partialMemoize(f, 2, 1));

  test.equal(cf, partialMemoize(f, 1));

  // Exceed cache limit
  partialMemoize(() => true, 1);
  partialMemoize(() => true, 1);
  test.notEqual(cf, partialMemoize(f, 1));

  test.done();
};


exports.createParitalMemoize_cache = test => {
  const partialMemoize = createPartialMemoize(2, 3);
  const f = () => true;

  const cf = partialMemoize(f, 1);
  test.equal(cf, partialMemoize(f, 1));

  // Exceed item cache.
  partialMemoize(f, 2);
  const cf3 = partialMemoize(f, 3);
  partialMemoize(f, 4);

  // Second item is removed at this point.
  test.notEqual(cf, partialMemoize(f, 1));

  // Third item is still here.
  test.equal(cf3, partialMemoize(f, 3));


  // Exceed global cache.
  partialMemoize(() => true, 1);
  partialMemoize(() => true, 1);
  test.notEqual(cf3, partialMemoize(f, 3));

  test.done();
};

exports.bundle = test => {
  const b = bundle({
    key: 'count',
    initialState: 0,
    exportApi: true,
    actions: {
      inc: state => state + 1,
      dec: state => state - 1,
    },
    selectors: {
      neg: state => state * -1,
      mem: (() => {
        let k = 0;
        return () => (k += 1);
      })(),
    },
  });

  test.equal(b.getState(), 0);

  b.inc();
  test.equal(b.getState(), 1);

  b.setState(2);
  test.equal(b.getState(), 2);

  b.dec();
  test.equal(b.getState(), 1);

  b.inc();
  test.equal(b.neg(), -2, 'Simple selector works as expected');

  test.equal(b.mem(), 1);
  test.equal(b.mem(), 1);
  b.inc();
  test.equal(b.mem(), 2);

  test.equal(b.getInitialState(), 0);
  test.done();
};

exports.bundle = test => {
  const def = {
    key: 'c1',
    initialState: 0,
    exportApi: true,
    actions: {
      inc: state => state + 1,
      dec: state => state - 1,
    },
  };
  const c = bundle(def);
  const b = combine(c, bundle({ ...def, key: 'c2' }));

  test.deepEqual(b.getState(), { c1: 0, c2: 0 });
  test.deepEqual(b.getInitialState(), { c1: 0, c2: 0 });

  b.getBundle('c2').inc();
  test.deepEqual(b.getState(), { c1: 0, c2: 1 });

  c.inc();
  test.deepEqual(b.getState(), { c1: 1, c2: 1 });

  test.done();
};

const createBundle = mechanism =>
  bundle({
    key: 'counter',
    initialState: 0,
    exportApi: true,
    actions: {
      err: state => state + 1,
      suc: state => state + 10,
      bef: state => state + 100,
      aft: state => state + 1000,
      set: state =>
        ({
          1: 'a',
          2: 'b',
          3: 'c',
        }(state)),

      fetchSuc: asyncAction({
        mechanism,
        fetch: () => new Promise(resolve => setTimeout(resolve, 0)),
        afterAction: 'aft',
        beforeAction: 'bef',
        errorAction: 'err',
        successAction: 'suc',
      }),

      fetchErr: asyncAction({
        mechanism,
        fetch: () => new Promise((_, reject) => setTimeout(reject, 0)),
        afterAction: 'aft',
        beforeAction: 'bef',
        errorAction: 'err',
        successAction: 'suc',
      }),
    },
  });

exports.asyncAction = {
  MECHANISM_FIRST(test) {
    const b = createBundle('MECHANISM_FIRST');
    test.deepEqual(b.getState(), 0);
    b.fetchSuc();
    b.fetchSuc();

    setTimeout(() => {
      test.deepEqual(b.getState(), 1110);
      b.fetchSuc();

      setTimeout(() => {
        test.deepEqual(b.getState(), 2220);
        test.done();
      }, 100);
    }, 100);
  },

  MECHANISM_ONCE(test) {
    const b = createBundle('MECHANISM_ONCE');
    test.deepEqual(b.getState(), 0);
    b.fetchSuc();
    b.fetchSuc();

    setTimeout(() => {
      test.deepEqual(b.getState(), 1110);
      b.fetchSuc();

      setTimeout(() => {
        test.deepEqual(b.getState(), 1110);
        test.done();
      }, 100);
    }, 100);
  },

  MECHANISM_EVERY(test) {
    const b = createBundle('MECHANISM_EVERY');
    test.deepEqual(b.getState(), 0);
    b.fetchSuc();
    b.fetchSuc();

    setTimeout(() => {
      test.deepEqual(b.getState(), 2220);
      b.setState(0);
      b.fetchErr();

      setTimeout(() => {
        test.deepEqual(b.getState(), 1101);
        test.done();
      }, 100);
    }, 100);
  },

  MECHANISM_SEQUENTIAL(test) {
    const b = bundle({
      key: 'counter',
      initialState: 0,
      exportApi: true,
      actions: {
        inc: state => state + 1,
        setLetter: state =>
          ({
            1: 'a',
            2: 'b',
            3: 'c',
          }[state] || state),
        fetch: asyncAction({
          mechanism: 'MECHANISM_SEQUENTIAL',
          fetch: () => new Promise(resolve => setTimeout(resolve, 0)),
          beforeAction: 'setLetter',
          successAction: 'inc',
        }),
      },
    });
    test.deepEqual(b.getState(), 0);
    b.fetch();
    b.fetch();

    setTimeout(() => {
      test.deepEqual(b.getState(), 'a1');
      test.done();
    }, 100);
  },
};
