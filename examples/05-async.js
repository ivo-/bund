// Example: 05-async.js
//
// In this example we will show how to use `bund.js` in combination with
// async functions.
//

const assert = require('assert');
const { bundle, asyncAction } = require('../src/index');

// -----------------------------------------------------------------------------
// Bundle

const setLoading = state => ({ ...state, loading: true });
const usersBundle = bundle({
  key: 'users',
  exportApi: true,
  initialState: {
    uid: 0,
    users: [],
    loading: false,
    error: null,
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
    setUsers: (state, users) => ({ ...state, users }),
    setError: (state, error) => ({ ...state, error }),
    setLoaded: state => ({ ...state, loading: false }),
    setLoading,

    // `asyncAction` util helps you dealing with async actions. If basically
    // forms a data flow for handling a remote call. Your can provide actions to
    // be called before/after the call or on error/success results.
    //
    //   - Before/After actions will be called without arguments
    //   - Error action will be called with one argument - the error
    //   - Success action will be called with one argument - response
    //
    fetchUsers(state) {
      new Promise(resolve => (
        setTimeout(resolve.bind(this, [{ id: 1 }]), 100)
      ))
        .then(users => this.setUsers(users))
        .catch(error => this.setError(error))
        .finally(() => this.setLoaded());

      return setLoading(state);
    },
  },
});

// -----------------------------------------------------------------------------
// Tests

const actionsInOrder = [
  'fetchUsers',
  'setLoading',
  'setUsers',
  'setLoaded',
];
usersBundle.onChange(([_, actionName]) => {
  // Check that actions are triggered in order
  assert.equal(actionName, actionsInOrder.shift());

  // Check that state is updated.
  if (actionName === 'setLoaded') {
    assert.deepEqual(usersBundle.getState(), {
      uid: 0,
      users: [{ id: 1 }],
      loading: false,
      error: null,
    });
  }
});

usersBundle.fetchUsers();
setTimeout(() => {
  // Check that before is called
  assert.deepEqual(usersBundle.getState(), {
    uid: 0,
    users: [],
    loading: true,
    error: null,
  });
}, 2);

// You can also do the async calls yourself:
//
// usersBundle.beforeAction();
// fetch('api/users')
//   .then(res => usersBundle.setUsers(res))
//   .catch(err => usersBundle.setError(err))
//   .then(() => usersBundle.afterAction());
