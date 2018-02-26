// Example: 01-persistence.js
//
// In this example we will show easy is to persist and restore your
// application state.
//

const assert = require('assert');
const { bundle, combine } = require('../src/index');

// -----------------------------------------------------------------------------
// Bundle

const counter = {
  initialState: 0,
  exportApi: true,
  actions: {
    inc: state => state + 1,
    dec: state => state - 1,
  },
};

// Lets create a simple combined bundle of two counters.
const appBundle = combine(
  bundle({ ...counter, key: 'apples' }),
  bundle({ ...counter, key: 'peaches' })
);

// -----------------------------------------------------------------------------
// Tests

appBundle.getBundle('apples').inc();
assert.deepEqual(
  appBundle.getState(),
  { apples: 1, peaches: 0 }
);

// Lets save and restore application state.
const localStorage = {
  store: {},
  getItem: key => localStorage.store[key],
  setItem: (key, data) => localStorage.store[key] = data,
};

localStorage.setItem(
  'app-state',
  JSON.stringify(appBundle.getState())
);
appBundle.setState(
  JSON.parse(localStorage.getItem('app-state'))
);

assert.deepEqual(
  appBundle.getState(),
  { apples: 1, peaches: 0 }
);
