// Example: 06-react-stete-replacement.js
//
// In this example we will show how to use `bund.js` as local state management
// tool for `React.js`. This will allow us to use only stateless functional
// components in the system that benefit from all `bund.js` internal
// optimizations.

import assert from 'assert';
import { bundle, connect } from '../src/index';

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
// State
const usersState = {
  key: 'users',
  exportApi: true,
  initialState: {
    uid: 1,
    users: [{ id: 1 }],
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
};

// -----------------------------------------------------------------------------
// Components

const UsersPure = ({ users, removeUser, updateUser }) =>
  <div className="Users">
    <h1>Users</h1>
    <ul>
      {users.map(u =>
        <li key={u.id}>
          {u.name} ({u.karma})
          <button onClick={() => updateUser(u.id, { karma: u.karma + 1 })}>
            +
          </button>
          <button onClick={() => updateUser(u.id, { karma: u.karma - 1 })}>
            -
          </button>
          <button className="remove" onClick={() => removeUser(u.id)}>X</button>
        </li>
      )}
    </ul>
  </div>;

export const Users1 = connect(
  UsersPure,
  bundle(usersState),
  { selectAll: true }
);
export const Users2 = connect(
  UsersPure,
  bundle(usersState),
  { selectAll: true }
);

// -----------------------------------------------------------------------------
// Tests

const u1 = mount(<Users1 />);
const u2 = mount(<Users2 />);

assert.equal(u1.find('li').length, 1);
assert.equal(u2.find('li').length, 1);

u1.find('.remove').simulate('click');

assert.equal(u1.find('li').length, 0);
assert.equal(u2.find('li').length, 1);

export default true;
