## Bund

  Natural, no-boilerplate immutable state management for JavaScript apps

### Installation

Install from npm:

```
$ npm install --save bund
```

### Rationale

We strongly believe that immutability is the way to go for building a reliable
software. There are several wonderful libraries for managing state in this
fashion, but despite the benefits most of them intorduce a lot of abstraction or
unnatural feel about imitable programming. `bund` is designed to offer simple
predictable state management that feels natural and relies on the essential
programing tool - pure functions and data.

#### Design Principles

- The whole application state is described with pure functions that operate on
  data structures without mutating them. This should be most of the code in you
  application.
- Pure functions and their corresponding initial data are bundled together in
  state bundles that manage state identity - pointer to the last computed
  state. Those bundles are the single abstraction provided by the library and
  should be as simple to use and compose as functions.
- The only way to change the state is to call some of your pure functions
  that computes the new state and store it in the bundle.
- Bundles are combined together in bigger bundles that manage bigger parts of
  the application state and eventually the whole app state.
- State should acts and feels like it is stored in a single place, but different
  parts of the system should be able to easily work with just the state they are
  concerned with.
- Every state transition emits action event that is a description of the
  transition. Actions are considered notifications for update, not a trigger for
  one.
- Minimal boilerplate

#### Lessons learned from Redux

This section compares `bund` and `redux` and tries to illustrate how we can
learn and improve on the `redux` foundations.

Centralized state management and using actions to describe state transitions
makes it trivial to implement functionality like the following [[source]](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367):

- Persist state to a local storage and then boot up from it, out of the box.
- Pre-fill state on the server, send it to the client in HTML, and boot up from
  it, out of the box.
- Serialize user actions and attach them, together with a state snapshot, to
  automated bug reports, so that the product developers can replay them to
  reproduce the errors.
- Pass action objects over the network to implement collaborative
  environments without dramatic changes to how the code is written.
- Maintain an undo history or implement optimistic mutations without dramatic
  changes to how the code is written.
- Travel between the state history in development, and re-evaluate the
  current state from the action history when the code changes, a la TDD.
- Provide full inspection and control capabilities to the development tooling
  so that product developers can build custom tools for their apps.
- Provide alternative UIs while reusing most of the business logic.

But all of this comes with some trade offs, that `bund` tires to address:

- *No encapsulation*
- *Learning curve*
- *Flow complexity*
- *A lot of boilerplate*

And the primary reason for this the indirect state transition approach trough
actions. While useful in many ways, it leads to problems related to a lot of
boilerplate or complexity in following the data flow. `bund` adopts direct state
transitions , but emits actions for the cases where they can be beneficial.

### Usage

#### Import the library

```js
import { bundle, combine } from './src';
```

#### State management

- Describe your state management as pure function.
- This is as generic and framework agnostic as you can get, this code always
  stays relevant even after your favorite framework is long gone and replaced
  with something new and shiny.
- This is always the core of your app, your domain logic, most of your
  code. The rest will be "gluing" by `bund`.
- Save this in a single file containing all the state for a particular part of
  your application. We call those files `state bundles`.

```js
// Initial state of the bundle.
const initialState = [];

// Actions - transformation for your data
//
// Functions that accept the state and transform it to the new state
// version. They should be pure and not mutate the state.
//
const addUser = (state, user) => ({ usersList: [...state.usersList, user] });
const removeUser = (state, userId) => ({ usersList: state.usersList.filter(u => u.id !== userId);})
const updateUser = (state, userId, data) => ({
  usersList: state.usersList.map(u => (
    u.id === userId ? { ...u, data } : u
  ))
})

// Selectors - select data from the state
//
// Pure functions that accept the state and return some parts of it. To optimize
// here you can use memoization library like reselect.
//
const selectTopUser = state => state.find(user => user.top);

// Remote calls
//
// Functions that perform some async tasks like data fetching. We believe that
// using promises is the way to go here.
//
const fetchUsers = () => fetch('api/users');

// And now at this point your state is perfectly usable. And if this is enough
// for your application, you don't need to include any external frameworks, just
// use it this way.
let appState;
appState = initialState;
appState = addUser(appState, { id: 1, name: 'Tom' });
appState = updateUser(appState, 1, { name: 'John' });
appState = removeUser(appState, 1);

fetchUsers().then(users => {
  users.forEach(user => appState = addUser(appState, user));
  const topUser = selectTopUser(appState);
});
```
#### Bundling

Now is the time to create a bundle out of your users state. A bundle is a
wrapper for all the state management logic that maintains the state identity ->
a pointer to the last state. This is what the `bund` library is - a tool to
bundle and compose bundle of your immutable application state logic.

```js
const usersBundle = bundle({
  // Gives a bundle unique name, this name will be used when combining
  // in bigger bundles (soon we will get to this), for debugging and other
  // purposes.
  key: 'users',

  initialState: initialState,

  // Adds shortcuts for all actions and selectiors to bundle. Allows
  // to use following
  //
  //   usersBundle.addUser()
  //
  // instead of following
  //
  //   usersBundle.actions.addUser()
  //
  exportApi: true,

  // Last state is automatically attached as first argument of bundled
  // actions. Also those actions automatically set the state identity.
  actions: {
    addUser,
    removeUser,
    updateUser,

    // Helper for creating async actions. SEE: examples/06-async.js for more
    // detailed explanation of this functionality.
    // fetchUsers: asyncAction({
    //   mechanism: 'MECHANISM_FIRST',
    //   fetch: fetchUsers,
    //   successAction: 'addUser',
    //   // errorAction: 'addError',
    //   // beforeAction: 'setLoading',
    //   // beforeAction: 'setLoaded',
    // }),
  },

  // Memoizes them with simple 1 level cache memoization. For move advanced
  // performance optimizations use something like reselect. State is auto
  // attached as first here as well.
  selectors: {
    selectTopUser,
  },

  // Adds functions to be executed on state change. Alternatively you
  // can use
  //
  //    usersBundle.onChange(action => console.log(action));
  //
  // to add listener to already created bundle.
  //
  listeners: [action => action],
});

// Public API
//
//   - usersBundle.actions;
//   - usersBundle.selectors;
//
//   - usersBundle.getState();
//   - usersBundle.getInitialState();
//   - usersBundle.setState(state);
//   - usersBundle.onChange(listener);
//   - usersBundle.applyAction(action);
//

// Calling actions
usersBundle.addUser({ id: 2 });
usersBundle.actions.addUser({ id: 3 });
usersBundle.getState(); // => { usersList: [{ id: 2 }, { id: 3 }] }

// Calling selectors
usersBundle.selectTopUser();
usersBundle.selectors.selectTopUser();

// You can set state directly using `setState()` method, but is discouraged
// since it won't trigger change event and generate action.
usersBundle.getState();
usersBundle.setState(addUser(
  usersBundle.getState(),
  {}
));
```

#### Using action signals API

```js
// Internally action signals are created for every state transition. Action
// signal is an array array with the following elements:
//
//   [
//     bundle-key, // => key of the bundle that triggered the action
//     action-name, // => name of the action function
//     arg-1, // => first argument (if there is any)
//     arg-2,
//     ...
//   ];
//
// You can store those actions and apply them:
//
//   usersBundle.applyAction(action);
//
const history = [];
const unsubscribe = usersBundle.onChange((action, thisBundle) => {
  history.push([action, thisBundle.getState()]);
});
unsubscribe();
```

#### Combine bundles into big bundles

```js
// Combine
//
// You can combine your bundles into big bundles. Combined bundle contains
// pointers to all of its bundles and shares data with them. Update to some
// of the combined bundles will trigger an update to the whole bundle. This
// is especially convenient if you want to share part of the application
// state with some subsystem that is only concerned with that state and all the
// updates on that part will be reflected to the combined bundle.
//
const appBundle = combine([
  usersBundle,

  bundle({
    key: 'count',
    initialState: 0,
    exportApi: true,
    actions: {
      inc: state => state + 1,
      dec: state => state - 1,
    },
  }),
]);

// Public API (but combined)
//
//   - appBundle.getState();
//     Get all the state grouped by bundle key.
//
//   - appBundle.getIntialState();
//     Get all the initial state grouped by bundle key.
//
//   - appBundle.setState(state);
//     Set all the state grouped by bundle key.
//
//   - appBundle.onChange(listener);
//   - appBundle.applyAction(action);
//

appBundle.getState(); // => { count: 0, users: { usersList: []} }
appBundle.getInitialState(); // => { count: 0, users: { usersList: []} }

appBundle.getBundle('count').getState(); // => 0
appBundle.getBundle('count').inc();

appBundle.getBundle('count').getState(); // => 1
appBundle.getState(); // => { count: 1, users: { usersList: []} }

// Even if we transition only the `usersBundle`, the change is reflected in the
// application state. Some parts of the application can work with `usersBundle`,
// some with `appBundle` depending on their data needs.
usersBundle.addUser({ id: 2 });
appBundle.getState(); // => { count: 1, users: { usersList: [{ id: 2 }] } }
```

#### Usage with React

And here we are to the essence, how to use `bund` for practical front-end
applications. Integration with React can be as simple as:

```js
import { combine } from 'react-bund';

const Users = connect(usersBundle, { slectAll: true }, ({ usersList, addUser, removeUser, updateUser}) => (
  <div className="Users">
    <h1>Users</h1>
    <ul>
      {usersList.map(u => (
        <li>
          {u.name} ({u.karma})
          <button onClick={updateUser(u.id, { karma: u.karma + 1})}>+</button>
          <button onClick={updateUser(u.id, { karma: u.karma - 1})}>-</button>
          <button onClick={removeUser(u.id)}>X</button>
        </li>
        ))}
    </ul>
  </div>
));
```

And here is the long version with some explanations:

```js
const UsersPure = ({ usersList, addUser, removeUser, updateUser}) => (
  <div className="Users">
    <h1>Users</h1>
    <ul>
      {usersList.map(u => (
        <li>
          {u.name} ({u.karma})
          <button onClick={updateUser(u.id, { karma: u.karma + 1})}>+</button>
          <button onClick={updateUser(u.id, { karma: u.karma - 1})}>-</button>
          <button onClick={removeUser(u.id)}>X</button>
        </li>
        ))}
    </ul>
  </div>
);

const Users = connect(usersBundle, {
  // `select` is executed after every state change and selects data from the
  // new state. Result is merged with component properties.
  select: state => state,

  // Executed once. Returned result is merged with component
  // properties. Provided argument is the connected bundle (`usersBundle` in
  // this case).
  //
  // If we connect to combined bundle, the argument will be an object with
  // schema: `bundle key` => `bundle`.
  selectOnce: (state, { actions, selectors }) => ({
    ...actions,
    ...selectors,
  }),
}, UsersPure);
```

#### More examples

Check the `/examples` directory.
