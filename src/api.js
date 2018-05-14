function mapValues(obj, fn) {
  return Object.keys(obj).reduce((result, key) => {
    result[key] = fn(obj[key], key);
    return result;
  }, {});
}

function shallowEqArrays(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Simple memoize function with cache only last argument.
 * @param {Function} fn
 * @returns {Function}
 */
function memoize(f) {
  let lastArgs = null;
  let lastResult = null;
  return (...args) => {
    if (!lastArgs || !shallowEqArrays(args, lastArgs)) {
      lastArgs = args;
      lastResult = f(...args);
    }

    return lastResult;
  };
}

/**
 * Autocurry provided function. Works only for function with fixed
 * number of parameters and no default parameters.
 *
 * @example
 *
 *   const sum = autocurry(function(a, b, c) { return a + b + c; });
 *   sum(1)(2)(3); // => 6
 *
 * @returns {Function}
 */
function autocurry(fn) {
  const { length } = fn;

  return function next(...args) {
    if (args.length < length) {
      return next.bind(this, ...args);
    }

    return fn(...args);
  };
}

/**
 * Takes a function `fn` and fewer than the normal `args` to `fn`,
 * and returns a function that takes a variable number of additional
 * arguments. When called, the returned function calls `fn` with `args`
 * + additional arguments.
 *
 * @example
 *
 *   const sum = function(...args) { return args.reduce((a, b) => a + b); };
 *
 *   const plus1 = partial(sum, 1);
 *   plus1(2); // => 3
 *
 *   const plus3= partial(plus1, 2);
 *   plus3(2); // => 5
 *
 * @returns {Function}
 */
function partial(fn, ...args) {
  return (...moreArgs) => fn(...args, ...moreArgs);
}

/**
 * Takes an array of functions and returns a function that is the composition
 * of those functions. The returned function takes a variable number of
 * arguments, applies the rightmost of functions to these arguments, the next
 * function(right-to-left) to the result, etc.
 *
 * @example
 *
 *   // The following two lines are equivalent:
 *   comp(f1, f2, f3)(1, 2, 3);
 *   f1(f2(f3(1, 2, 3)));
 *
 */
function comp(...fns) {
  const fnsInOrder = fns.slice().reverse();
  const firstFn = fnsInOrder[0];
  return (...args) =>
    fnsInOrder.slice(1).reduce((prev, f) => f(prev), firstFn(...args));
}

/**
 * Create application state bundle.
 */
// TODO: enable hot reloading
function bundle({
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
function combine(...bundles) {
  if (bundles.find(b => b.bundles)) {
    return combine(
      ...bundles
        .map(b => (b.bundles ? b.bundles : [b]))
        .reduce((a, b) => a.concat(b), [])
    );
  }

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

    setState: newState => bundles.forEach(b => b.setState(newState[b.key])),

    onChange: callback => {
      const unsubscribe = bundles.map(b => b.onChange(callback));
      return () => unsubscribe.forEach(u => u());
    },

    applyAction: action =>
      bundle.forEach(b => b.key === action[0] && b.applyAction(action)),
  };
}

/*
 * Creates memoized version of `partial`. Cache works on 2 levels: number of
 * functions to be cached, and number of different arguments to be cached per
 * function. Cache follows Last In First Out (LIFO) policy.
 * @param {Number} cacheSize = 1000
 * @param {Number} cacheItemSize = 40
 * @returns {Function}
 */
function createPartialMemoize(cacheSize = 1000, cacheItemSize = 40) {
  function partialMemoize(fn, ...args) {
    const { cache } = partialMemoize;

    const newF = (...moreArgs) => fn(...args, ...moreArgs);
    const cachedValue = cache.get(fn);

    if (cachedValue) {
      const cacheHit = cachedValue.find(
        v => shallowEqArrays(v.args, args) && v.newF
      );
      if (cacheHit) return cacheHit.newF;

      cache.set(
        fn,
        [{ args, newF }, ...cachedValue].slice(0, partialMemoize.cacheItemSize)
      );
    } else {n
      cache.set(fn, [{ args, newF }]);
      if (cache.size > partialMemoize.cacheSize) {
        // The cryptic way to delete the first Map item.
        cache.delete(cache.keys().next().value);
      }
    }

    return newF;
  }

  partialMemoize.cache = new Map();
  partialMemoize.cacheSize = cacheSize;
  partialMemoize.cacheItemSize = cacheItemSize;

  return partialMemoize;
}

module.exports = {
  bundle,
  combine,

  comp,
  memoize,
  partial,
  autocurry,
  mapValues,
  shallowEqArrays,
  createPartialMemoize,
};
