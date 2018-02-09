// Example: 02-react.js
//
// In this example we will show how to use `bund.js` with `React.js`. We will
// illustrate how you can split state management into multiple bundles and
// connect different component do different bundle depending on the data they
// need.

import assert from 'assert';
import { bundle, connect, combine } from '../src/index';

/* eslint-disable */
import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import jsdom from 'jsdom';

const doc = new jsdom.JSDOM('<!doctype html><html><body></body></html>');
global.window = doc.window;
global.document = doc.window.document;
global.navigator = { userAgent: 'node.js' };
Object.keys(window).forEach(k => global[k] || (global[k] = window[k]));

Enzyme.configure({ adapter: new Adapter() });
/* eslint-enable */

// -----------------------------------------------------------------------------
// Users

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

// -----------------------------------------------------------------------------
// Counter

const counterBundle = bundle({
  key: 'counter',
  initialState: 0,
  actions: {
    inc: state => state + 1,
    dec: state => state - 1,
  },
});

// -----------------------------------------------------------------------------
// App Bundle

const appBundle = combine(usersBundle, counterBundle);

// -----------------------------------------------------------------------------
// Components

// Connect components to desired bundle depending on their data needs.
export const Users = connect(
  ({
    users, addUser, removeUser, updateUser,
  }) =>
    <div className="Users">
      <h1>Users</h1>
      <ul>
        {users.map((u, i) =>
          <li key={i}>
            {u.name} ({u.karma})
            <button onClick={() => updateUser(u.id, { karma: u.karma + 1 })}>
              +
            </button>
            <button onClick={() => updateUser(u.id, { karma: u.karma - 1 })}>
              -
            </button>
            <button className="remove" onClick={() => removeUser(u.id)}>
              X
            </button>
          </li>
        )}
      </ul>
      <button className="add" onClick={() => addUser({ id: 2 })}>
        Add
      </button>
    </div>,
  usersBundle
);

export const Counter = connect(
  ({ counter, inc, dec }) =>
    <div className="Counter">
      <h1>Counter</h1>
      <div>
        {counter}
        <button onClick={inc}>+</button>
        <button onClick={dec}>-</button>
      </div>
    </div>,
  counterBundle,
  // This is because counter state is just a number, but select
  // should return an object.
  state => ({ counter: state })
);

// Connect to app bundle here Stats component needs both `counter` and `users`
// data. You can create and connect to multiple combined bundles depending on
// data need of your components.
export const Stats = connect(
  ({ counter, users }) =>
    <div className="Stats">
      <h1>Stats</h1>
      <div>
        counter value -> {counter}
      </div>
      <div>
        users count -> {users.users.length}
      </div>
    </div>,
  appBundle,
  { selectOnce: () => ({}) }
);

export const App = () =>
  <div className="App">
    <Users />
    <Counter />
    <Stats />
  </div>;

// -----------------------------------------------------------------------------
// Tests

usersBundle.addUser({ name: 'Ivo', karma: 0 });
const app = mount(<App />);

assert.equal(app.find(Stats).length, 1);
assert.equal(app.find(Users).length, 1);
assert.equal(app.find(Counter).length, 1);

assert.equal(app.find('li').length, 1);
app.find('.remove').simulate('click');
assert.equal(app.find('li').length, 0);
usersBundle.addUser({ id: 2 });
app.find('.add').simulate('click');
assert.equal(app.find('li').length, 2);

export default true;
