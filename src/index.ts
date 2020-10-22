import { useRef } from 'react'

type PromiseCache<Arg, Response> = {
  promise: Promise<void>
  arg: Arg
  error?: any
  response?: Response
}

type PromiseFn<Arg, Response> = (arg: Arg) => Promise<Response>

function handleAsset<Arg, Response>(
  fn: PromiseFn<Arg, Response>,
  cache: PromiseCache<Arg, Response>[],
  areEqual: (a: Arg, b: Arg) => boolean,
  arg: Arg,
  lifespan: number,
  preload: true
): void

function handleAsset<Arg, Response>(
  fn: PromiseFn<Arg, Response>,
  cache: PromiseCache<Arg, Response>[],
  areEqual: (a: Arg, b: Arg) => boolean,
  arg: Arg,
  lifespan: number
): Response

function handleAsset<Arg, Response>(
  fn: PromiseFn<Arg, Response>,
  cache: PromiseCache<Arg, Response>[],
  areEqual: (a: Arg, b: Arg) => boolean,
  arg: Arg,
  lifespan: number,
  preload = false
) {
  for (const entry of cache) {
    // Find a match
    if (areEqual(arg, entry.arg)) {
      // If we're pre-loading and the element is present, just return
      if (preload) return
      // If an error occurred, throw
      if (entry.error) throw entry.error
      // If a response was successful, return
      if (entry.response) return entry.response
      // If the promise is still unresolved, throw
      throw entry.promise
    }
  }

  // The request is new or has changed.
  const entry: PromiseCache<Arg, Response> = {
    arg,
    promise:
      // Make the promise request.
      fn(arg)
        .then((response) => (entry.response = response))
        .catch((e) => (entry.error = e))
        .then(() => {
          if (lifespan > 0) {
            setTimeout(() => {
              const index = cache.indexOf(entry)
              if (index !== -1) cache.splice(index, 1)
            }, lifespan)
          }
        }),
  }
  cache.push(entry)
  if (!preload) throw entry.promise
}

function clear<Arg, Response>(cache: PromiseCache<Arg, Response>[], areEqual: (a: Arg, b: Arg) => boolean, arg?: Arg) {
  if (arg === undefined) cache.splice(0, cache.length)
  else {
    const entry = cache.find((entry) => areEqual(arg, entry.arg))
    if (entry) {
      const index = cache.indexOf(entry)
      if (index !== -1) cache.splice(index, 1)
    }
  }
}

function createAsset<Arg, Response>(
  fn: PromiseFn<Arg, Response>,
  areEqual: (a: Arg, b: Arg) => boolean = Object.is,
  lifespan = 0
) {
  const cache: PromiseCache<Arg, Response>[] = []
  return {
    read: (arg: Arg) => handleAsset(fn, cache, areEqual, arg, lifespan),
    preload: (arg: Arg) => handleAsset(fn, cache, areEqual, arg, lifespan, true),
    clear: (arg?: Arg) => clear(cache, areEqual, arg),
    peek: (arg: Arg) => cache.find((entry) => areEqual(arg, entry.arg))?.response,
  }
}

let globalCache: PromiseCache<any, any>[] = []

function useAsset<Arg, Response>(fn: PromiseFn<Arg, Response>, arg: Arg) {
  const ref = useRef<{ arg: Arg; res: Response }>()
  if (!ref.current || !useAsset.areEqual(ref.current.arg, arg)) {
    ref.current = {
      arg,
      res: handleAsset(fn, globalCache, useAsset.areEqual, arg, useAsset.lifespan),
    }
  }
  return ref.current.res
}

useAsset.areEqual = Object.is as <Arg>(a: Arg, b: Arg) => boolean
useAsset.lifespan = 0
useAsset.clear = <Arg>(arg?: Arg) => clear(globalCache, useAsset.areEqual, arg)
useAsset.preload = <Arg, Response>(fn: PromiseFn<Arg, Response>, arg: Arg) =>
  handleAsset(fn, globalCache, useAsset.areEqual, arg, useAsset.lifespan, true)
useAsset.peek = <Arg>(arg: Arg) => globalCache.find((entry) => useAsset.areEqual(arg, entry.arg))?.response

export { createAsset, useAsset }
