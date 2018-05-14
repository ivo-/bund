/**
 * Helper functions to connect bundle to redux store in order to use `bund`
 * as optimization in Redux app. Usually you want to create and add reducers
 * for all the individual bundles and `connectToStore` a combination (combined
 * bundle) of the bundles.
 */

/**
 * Creates redux reducer from bund bundle.
 */
const createReducer = stateBundle => (
  state = stateBundle.getInitialState(),
  action
) =>
  (action.type.startsWith(`bund/${stateBundle.key}/`) ? action.payload : state);

/**
 * Connects bund bundle to redux store. Every bund action will be dispatched
 * to the redux store and handled by reducer for this bundle.
 */
const connectToStore = (stateBundle, store) => {
  stateBundle.onChange(([, actionName]) => {
    store.dispatch({
      type: `bund/${stateBundle.key}/${actionName}`,
      payload: stateBundle.getState(),
    });
  });
};

module.exports = {
  createReducer,
  connectToStore,
};
