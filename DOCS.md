  - [memoize()](#memoizefnfunction)
  - [autocurry()](#autocurry)
  - [partial()](#partial)
  - [comp()](#comp)
  - [combine()](#combine)
  - [createPartialMemoize()](#createpartialmemoizecachesize1000numbercacheitemsize40number)
  - [createReducer](#createreducer)
  - [connectToStore](#connecttostore)

## memoize(fn:Function)

  Simple memoize function with cache only last argument.

## autocurry()

  Autocurry provided function. Works only for function with fixed
  number of parameters and no default parameters.

## partial()

  Takes a function `fn` and fewer than the normal arguments to `fn`,
  and returns a fn that takes a variable number of additional args.
  When called, the returned function calls `fn` with args + additional
  args.

## comp()

  Takes an array of functions and returns a function that is the composition
  of those functions. The returned function takes a variable number of
  arguments, applies the rightmost of functions to these arguments, the next
  function(right-to-left) to the result, etc.

## combine()

  Combine provided bundles.

## createPartialMemoize(cacheSize=1000:Number, cacheItemSize=40:Number)

  Creates memoized version of `partial`. Cache works on 2 levels: number of
  functions to be cached, and number of different arguments to be cached per
  function. Cache follows Last In First Out (LIFO) policy.

## createReducer

  Creates redux reducer from bund bundle.

## connectToStore

  Connects bund bundle to redux store. Every bund action will be dispatched
  to the redux store and handled by reducer for this bundle.
