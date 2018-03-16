/**
 * Creates redux reducer from bund bundle.
 */
export const createReducer = stateBundle => (
  state = stateBundle.initialState,
  action
) =>
  action.type.startsWith(`bund/${stateBundle.key}/`) ? action.payload : state;


/**
 * Connects bund bundle to redux store. Every bund action will be dispatched
 * to the redux store and handled by reducer for this bundle.
 */
export const connectToStore = (stateBundle, store) => {
  stateBundle.onChange(([, actionName]) => {
    store.dispatch({
      type: `bund/${stateBundle.key}/${actionName}`,
      payload: stateBundle.getState(),
    });
  });
};