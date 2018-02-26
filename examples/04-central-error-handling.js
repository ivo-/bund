// Example: 04-central-error-handling.js
//
// In this example we will show how `onChange` and actions functionality can be
// used to implement central error handling for the application state.
//

const assert = require('assert');
const { bundle, combine } = require('../src/index');

// -----------------------------------------------------------------------------
// Shared Handlers

const publishError = state => state;

// -----------------------------------------------------------------------------
// Numbers

const pushNumber = (state, number) => ([...state, number]);
const popNumber = state => state.slice(0, -1);

const numbersBundle = bundle({
  key: 'numbers',
  exportApi: true,
  initialState: [],
  actions: { pushNumber, popNumber, publishError },
});

// -----------------------------------------------------------------------------
// Counter

const inc = state => state + 1;
const dec = state => state - 1;

const counterBundle = bundle({
  key: 'counter',
  initialState: 0,
  actions: { inc, dec, publishError },
});

// -----------------------------------------------------------------------------
// Errors

const pushError = (state, error) => ([...state, error]);
const popError = state => state.slice(0, -1);

const errorsBundle = bundle({
  key: 'errors',
  exportApi: true,
  initialState: [],
  actions: { pushError, popError },
});

// -----------------------------------------------------------------------------
// Bundle

const appBundle = combine(numbersBundle, counterBundle, errorsBundle);

appBundle.onChange(action => {
  const [actionName, error] = action.slice(1);
  if (actionName === publishError.name) {
    errorsBundle.actions.pushError(error);
  }
});

// -----------------------------------------------------------------------------
// Tests

const usersError = new Error('User error');
numbersBundle.publishError(usersError);
const countersError = new Error('Counter error');
counterBundle.publishError(countersError);

assert.equal(errorsBundle.getState()[0], usersError);
assert.equal(errorsBundle.getState()[1], countersError);
