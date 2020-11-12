import deepEqual from 'fast-deep-equal'
import { useMemo } from 'react'

type PromiseCache = {
  promise: Promise<any>
  args: any[]
  error?: any
  response?: any
}

type PromiseFn = (...args: any) => Promise<any>

function handleAsset(fn: PromiseFn, cache: PromiseCache[], args: any[], lifespan = 0, preload = false) {
  for (const entry of cache) {
    // Find a match
    if (deepEqual(args, entry.args)) {
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
  const entry: PromiseCache = {
    args,
    promise:
      // Make the promise request.
      fn(...args)
        // Response can't be undefined or else the loop above wouldn't be able to return it
        // This is for promises that do not return results (delays for instance)
        .then((response) => (entry.response = response ?? true))
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

function clear(cache: PromiseCache[], ...args: any[]) {
  if (args === undefined) cache.splice(0, cache.length)
  else {
    const entry = cache.find((entry) => deepEqual(args, entry.args))
    if (entry) {
      const index = cache.indexOf(entry)
      if (index !== -1) cache.splice(index, 1)
    }
  }
}

function createAsset<T>(fn: PromiseFn, lifespan = 0) {
  const cache: PromiseCache[] = []
  return {
    /**
     * @throws Suspense Promise if asset is not yet ready
     * @throws Error if the promise rejected for some reason
     */
    read: (...args: any[]): T => handleAsset(fn, cache, args, lifespan),
    preload: (...args: any[]): void => void handleAsset(fn, cache, args, lifespan, true),
    clear: (...args: any[]) => clear(cache, ...args),
    peek: (...args: any[]): void | T => cache.find((entry) => deepEqual(args, entry.args))?.response,
  }
}

let globalCache: PromiseCache[] = []

function useAsset(fn: PromiseFn, args: any[]) {
  return useMemo(() => fn && handleAsset(fn, globalCache, args, useAsset.lifespan), args)
}

useAsset.lifespan = 0
useAsset.clear = (...args: any[]) => clear(globalCache, ...args)
useAsset.preload = (fn: PromiseFn, ...args: any[]) => void handleAsset(fn, globalCache, args, useAsset.lifespan, true)
useAsset.peek = (...args: any[]) => globalCache.find((entry) => deepEqual(args, entry.args))?.response

export { createAsset, useAsset }
