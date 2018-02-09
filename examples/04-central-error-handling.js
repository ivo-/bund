// Example: 04-central-error-handling.js
//
// In this example we will show how `onChange` and actions functionality can be
// used to implement central error handling for the application state.
//

import assert from 'assert';
import { bundle, combine } from '../src/index';

// -----------------------------------------------------------------------------
// Shared Handlers

export const publishError = state => state;

// -----------------------------------------------------------------------------
// Numbers

export const pushNumber = (state, number) => ([...state, number]);
export const popNumber = state => state.slice(0, -1);

export const numbersBundle = bundle({
  key: 'numbers',
  exportApi: true,
  initialState: [],
  actions: { pushNumber, popNumber, publishError },
});

// -----------------------------------------------------------------------------
// Counter

export const inc = state => state + 1;
export const dec = state => state - 1;

export const counterBundle = bundle({
  key: 'counter',
  initialState: 0,
  actions: { inc, dec, publishError },
});

// -----------------------------------------------------------------------------
// Errors

export const pushError = (state, error) => ([...state, error]);
export const popError = state => state.slice(0, -1);

export const errorsBundle = bundle({
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

export default true;
