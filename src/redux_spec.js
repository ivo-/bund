const { createStore, combineReducers } = require('redux');
const { bundle } = require('./api');
const { createReducer, connectToStore } = require('./redux');

const countSpec = ({
  key: 'count',
  initialState: 0,
  exportApi: true,
  actions: {
    inc: state => state + 1,
    dec: state => state - 1,
  },
});
exports.createReducer = test => {
  const count = bundle(countSpec);
  const reducer = createReducer(count);

  test.equal(reducer(0, { type: 'test' }), 0);
  test.equal(reducer(0, { type: 'bund/count/', payload: 10 }), 10);
  test.equal(reducer(0, { type: 'bund/count/test', payload: 10 }), 10);

  test.done();
};

exports.connectToStore = test => {
  const count = bundle(countSpec);
  const store = createStore(combineReducers({
    count: createReducer(count),
  }));
  connectToStore(count, store);

  test.deepEqual(store.getState(), { count: 0 });

  count.inc();
  test.deepEqual(store.getState(), { count: 1 });

  count.dec();
  test.deepEqual(store.getState(), { count: 0 });

  test.done();
};
