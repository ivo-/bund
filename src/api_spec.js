import { bundle, combine, asyncAction } from './index';

// TODO: Test onChange and applyAction

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

const createBundle = mechanism => bundle({
  key: 'counter',
  initialState: 0,
  exportApi: true,
  actions: {
    err: state => state + 1,
    suc: state => state + 10,
    bef: state => state + 100,
    aft: state => state + 1000,
    set: state => (({
      1: 'a',
      2: 'b',
      3: 'c',
    })(state)),

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
        setLetter: state => (({
          1: 'a',
          2: 'b',
          3: 'c',
        })[state] || state),
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
