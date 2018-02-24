import { memoize, mapValues, shallowEqArrays } from './utils';

/**
 * Create application state bundle.
 */
// TODO: enable hot reloading
export function bundle({
  key,
  initialState,
  exportApi = true,
  actions = {},
  selectors = {},
  listeners = [],
}) {
  let state = initialState;
  let callbacks = [...listeners];

  const thisBundle = {
    key,

    getState: () => state,
    setState: newState => (state = newState),
    getInitialState: () => initialState,

    selectors: mapValues(mapValues(selectors, memoize), fn => () => fn(state)),
    actions: mapValues(actions, (fn, name) => (...args) => {
      const actionSignal = [key, name, ...args];

      thisBundle.setState(fn.call(thisBundle, state, ...args));
      callbacks.forEach(cb => cb(actionSignal, thisBundle));
    }),

    onChange: callback => {
      callbacks.push(callback);
      return () => (callbacks = callbacks.filter(c => c !== callback));
    },

    applyAction: ([bundleKey, actionName, ...args]) => {
      if (bundleKey !== key) {
        throw new Error(
          `Trying apply action with different with key ${bundleKey} for bundle with key ${key}`
        );
      }

      thisBundle.actions[actionName](...args);
    },
  };

  if (exportApi) {
    // TODO: signal on collisions
    Object.entries({
      ...thisBundle.actions,
      ...thisBundle.selectors,
    }).forEach(([name, fn]) => {
      thisBundle[name] = fn;
    });
  }

  return thisBundle;
}

/**
 * Combine provided bundles.
 */
export function combine(...bundles) {
  if (bundles.find(b => b.bundles)) {
    return combine(
      ...bundles
        .map(b => (b.bundles ? b.bundles : [b]))
        .reduce((a, b) => a.concat(b), [])
    );
  }

  // TODO: signal for collision
  return {
    bundles,

    getBundle: key => bundles.find(b => b.key === key),

    // TODO: memoize
    getState: () =>
      bundles.reduce((result, b) => {
        result[b.key] = b.getState();
        return result;
      }, {}),

    // TODO: memoize
    getInitialState: () =>
      bundles.reduce((result, b) => {
        result[b.key] = b.getInitialState();
        return result;
      }, {}),

    setState: newState =>
      bundles.forEach(b => b.setState(newState[b.key])),

    onChange: callback => {
      const unsubscribe = bundles.map(b => b.onChange(callback));
      return () => unsubscribe.forEach(u => u());
    },

    applyAction: action =>
      bundle.forEach(b => b.key === action[0] && b.applyAction(action)),
  };
}

export const MECHANISM_ONCE = 'MECHANISM_ONCE';
export const MECHANISM_EVERY = 'MECHANISM_EVERY';
export const MECHANISM_FIRST = 'MECHANISM_FIRST';
export const MECHANISM_SEQUENTIAL = 'MECHANISM_SEQUENTIAL';

export function asyncAction({
  mechanism = MECHANISM_EVERY,
  fetch = Function,
  errorAction = null,
  successAction = null,
  afterAction = null,
  beforeAction = null,
}) {
  let current = null;
  const doAction = function doAction(thisBundle, ...args) {
    switch (mechanism) {
      case MECHANISM_ONCE:
      case MECHANISM_FIRST: {
        if (current) return;
        break;
      }

      case MECHANISM_SEQUENTIAL: {
        if (current) {
          current.then(() =>
            setTimeout(() => doAction(thisBundle, ...args), 0)
          );
          return;
        }
        break;
      }

      case MECHANISM_EVERY: {
        break;
      }
      default:
    }

    if (thisBundle.actions[beforeAction]) thisBundle.actions[beforeAction]();

    current = fetch(...args)
      .then(
        res =>
          thisBundle.actions[successAction] &&
          thisBundle.actions[successAction](res)
      )
      .catch(
        err =>
          thisBundle.actions[errorAction] &&
          thisBundle.actions[errorAction](err)
      )
      .then(() => {
        if (thisBundle.actions[afterAction]) thisBundle.actions[afterAction]();
        if (mechanism !== MECHANISM_ONCE) current = null;
      });
  };

  return function(state, ...args) {
    setTimeout(() => doAction(this, ...args), 0);
    return state;
  };
}

export function partial(f, ...args) {
  return (...moreArgs) => f(...args, ...moreArgs);
}

export function comp(fn, ...fns) {
  return (...args) => fns.reduce((prev, f) => f(prev), fn(...args));
}

/*
 * TODO: extract in separate package
 * TODO: testing
 */
export function paritalMemoize(f, ...args) {
  const { cache, cacheSize, cacheItemSize } = paritalMemoize;

  const newF = (...moreArgs) => f(...args, ...moreArgs);
  const cachedValue = cache.get(f);

  if (cachedValue) {
    const cacheHit = cachedValue.find(v => (
      shallowEqArrays(v.args, args) && v.newF
    ));

    if (cacheHit) return cacheHit.newF;

    cache.set(f, [
      {
        args,
        newF,
      },
      ...cachedValue,
    ].slice(0, cacheItemSize));
  } else {
    cache.set(f, [{
      args,
      newF,
    }]);

    if (cache.size > cacheSize) {
      cache.delete(cache.keys().next().value);
    }
  }

  return newF;
}

paritalMemoize.cache = new Map();
paritalMemoize.cacheSize = 1000;
paritalMemoize.cacheItemSize = 40;
