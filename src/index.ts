import deepEqual from 'fast-deep-equal'
import { useMemo } from 'react'

type PromiseCache = {
  promise?: Promise<void>
  args: any[]
  error?: any
  response?: any
}

type PromiseFn = (res: (value?: unknown) => void, rej: (reason?: unknown) => void, ...args: any) => any

function handleAsset(fn: PromiseFn, cache: PromiseCache[], args: any[], lifespan = 0, preload = false) {
  for (const entry of cache) {
    // Find a match
    if (deepEqual(args, entry.args)) {
      // If an error occurred, throw
      if (entry.error) throw entry.error
      // If a response was successful, return
      if (entry.response) return entry.response
      // If the promise is still unresolved, throw
      throw entry.promise
    }
  }

  // The request is new or has changed.
  let res, rej
  const promise = new Promise((resolve, reject) => {
    res = resolve
    rej = reject
  })
  fn((res as unknown) as (value?: unknown) => void, (rej as unknown) as (reason?: unknown) => void, ...args)

  const entry: PromiseCache = {
    promise:
      // Make the promise request.
      promise
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
    args,
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

function createAsset(fn: PromiseFn, lifespan = 0) {
  const cache: PromiseCache[] = []
  return {
    read: (...args: any[]) => handleAsset(fn, cache, args, lifespan),
    preload: (...args: any[]) => handleAsset(fn, cache, args, lifespan, true),
    clear: (...args: any[]) => clear(cache, ...args),
    peek: (...args: any[]) => cache.find((entry) => deepEqual(args, entry.args)),
  }
}

let globalCache: PromiseCache[] = []

function useAsset(fn: PromiseFn, args: any[], lifespan = 0) {
  return useMemo(() => handleAsset(fn, globalCache, args, lifespan), args)
}

useAsset.clear = (...args: any[]) => clear(globalCache, ...args)
useAsset.preload = (fn: PromiseFn, args: any[], lifespan = 0) => handleAsset(fn, globalCache, args, lifespan, true)
useAsset.peek = (...args: any[]) => globalCache.find((entry) => deepEqual(args, entry.args))

export { createAsset, useAsset }
