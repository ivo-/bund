// Example: 03-time-travel.js
//
// In this example we will show how to implement simple and naive undo
// functionality using `bund`.

const assert = require('assert');
const { bundle, combine } = require('../src/index');

// -----------------------------------------------------------------------------
// History tracker

const createHistoryTracker = thisBundle => {
  const log = [];
  const undo = () => {
    log.pop(); // remove current state
    thisBundle.setState(log.pop() || thisBundle.getInitialState());
  };

  thisBundle.onChange(() => log.push(thisBundle.getState()));

  return { undo };
};

// -----------------------------------------------------------------------------
// Bundle

const usersBundle = bundle({
  key: 'users',
  exportApi: true,
  initialState: {
    uid: 0,
    users: [],
  },
  actions: {
    addUser: (state, user) => ({
      ...state,
      uid: state.uid + 1,
      users: [...state.users, { id: state.uid + 1, ...user }],
    }),
    removeUser: (state, userId) => ({
      ...state,
      users: state.users.filter(u => u.id !== userId),
    }),
    updateUser: (state, userId, data) => ({
      ...state,
      users: state.users.map(u => (u.id === userId ? { ...u, data } : u)),
    }),
  },
});

const history = createHistoryTracker(usersBundle);

// -----------------------------------------------------------------------------
// Tests

usersBundle.addUser({ name: 'Ivo', karma: 0 });
assert.deepEqual(usersBundle.getState(), {
  uid: 1,
  users: [{ id: 1, name: 'Ivo', karma: 0 }],
});

usersBundle.addUser({ name: 'Gosho', karma: 0 });
assert.deepEqual(usersBundle.getState(), {
  uid: 2,
  users: [
    { id: 1, name: 'Ivo', karma: 0 },
    { id: 2, name: 'Gosho', karma: 0 },
  ],
});

history.undo();
assert.deepEqual(usersBundle.getState(), {
  uid: 1,
  users: [{ id: 1, name: 'Ivo', karma: 0 }],
});

history.undo();
assert.deepEqual(
  usersBundle.getState(), usersBundle.getInitialState()
);
