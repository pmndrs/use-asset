<p align="left">
  <a id="cover" href="#cover"><img src="img/cover.svg" alt="This library allows you to create cached assets, which can be promises, async functions or even dynamic imports. These assets then have the ability to suspend the component in which they are read. This makes it easier to orchestrate async tasks and gives you the ability to set up fallbacks and error-handling declaratively." /></a>
</p>

[![Build Size](https://img.shields.io/bundlephobia/min/use-asset?label=bunlde%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=use-asset)
[![Build Status](https://img.shields.io/travis/pmndrs/use-asset/master?style=flat&colorA=000000&colorB=000000)](https://travis-ci.org/pmndrs/use-asset)
[![Version](https://img.shields.io/npm/v/use-asset?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/use-asset)
[![Downloads](https://img.shields.io/npm/dt/use-asset.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/use-asset)

Try some demos:

Fetching from HackerNews: [ji8ky](https://codesandbox.io/s/use-asset-demo-forked-ji8ky)

Component A waits for the result of component B: [70908](https://codesandbox.io/s/use-asset-dependency-70908)

## Using assets

```typescript
function createAsset(fn: PromiseFn, lifespan = 0): {
  read: (...args: any[]) => any;
  preload: (...args: any[]) => void;
  clear: (...args: any[]) => void;
  peek: (...args: any[]) => any;
}
```

Each asset you create comes with its own cache. When you request something from it, the arguments that you pass will act as cache-keys. If you request later on using the same keys, it won't have to re-fetch but serves the result that it already knows.

```jsx
import React, { Suspense } from "react"
import { createAsset } from "use-asset"

// First create an asset, the arguments are user-provided.
const asset = createAsset(async (id, version) => {
  const res = await fetch(`https://hacker-news.firebaseio.com/${version}/item/${id}.json`)
  return await res.json()
})

// You can preload assets, these will be executed and cached immediately
asset.preload(10000, "v0")

function Post({ id }) {
  // Request asset, this component will now suspend
  const { by, title } = asset.read(id, "v0")
  return <div>{title} by {by}</div>
}

function App() {
  <Suspense fallback={null}>
    <Post id={10000} />
  </Suspense>
}
```

#### Cache busting strategies

```jsx
// This asset will be removed from the cache in 15 seconds
const asset = createAsset(fn, 15000)
// Clear all cached entries
asset.clear()
// Clear a specific entry
asset.clear("/image.png")
```

#### Reading entries outside of suspense

```jsx
// This will either return the value (without suspense!) or undefined
asset.peek("/image.png")
```

## Using hooks and global cache

```typescript
function useAsset(fn: PromiseFn, args: any[]): any
useAsset.lifespan = 0
useAsset.read = (...args: any[]) => any
useAsset.preload = (fn: PromiseFn, ...args: any[]) => void
useAsset.clear = (...args: any[]) => void
useAsset.peek = (...args: any[]) => any
```

You can also use the `useAsset` hook, this makes it possible to define assets on the spot instead of having to define them externally. They use a global cache, anything you request at any time is written into it.

```jsx
import { useAsset } from "use-asset"

function Post({ id }) {
  const { by, title } = useAsset(fn, [id])
  return <div>{title} by {by}</div>
}

function App() {
  <Suspense fallback={null}>
    <Post id={1000} />
```

#### Cache busting, preview, preload and peeking

The hook has the same API as any asset:

```jsx
// Bust cache in 15 seconds
useAsset.lifespan = 15000
useAsset(fn, ["/image.png"])
// Clear all cached entries
useAsset.clear()
// Clear a specific entry
useAsset.clear("/image.png")
// Preload entries
useAsset.preload(fn, "/image.png")
// This will either return the value (without suspense!) or undefined
useAsset.peek("/image.png")
```
