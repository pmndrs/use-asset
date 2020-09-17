<p align="left">
  <a id="cover" href="#cover"><img src="img/cover.svg" alt="This library allows you to create cached assets, which can be promises, async functions or even dynamic imports. These assets then have the ability to suspend the component in which they are read. This makes it easier to orchestrate async tasks and gives you the ability to set up fallbacks and error-handling declaratively." /></a>
</p>

![Bundle Size](https://badgen.net/bundlephobia/minzip/use-asset) [![Build Status](https://travis-ci.org/pmndrs/use-asset.svg?branch=master)](https://travis-ci.org/pmndrs/use-asset) [![npm version](https://badge.fury.io/js/use-asset.svg)](https://badge.fury.io/js/use-asset) ![npm](https://img.shields.io/npm/dt/use-asset.svg)

Try a simple demo [here](https://codesandbox.io/s/jotai-demo-forked-ji8ky).

## Using assets

Each asset you create comes with its own cache. When you request something from it, the arguments that you pass will act as cache-keys. If you request later on using the same keys, it won't have to re-fetch but serves the result that it already knows.

```jsx
import React, { Suspense } from "react"
import { createAsset } from "use-asset"

// First create an asset, the arguments are user-provided.
const hackerNewsPost = createAsset(async (id) => {
  const resp = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
  return await resp.json()
})

// You can preload assets, these will be executed and cached immediately
hackerNewsPost.preload(9000)

function Post({ id }) {
  // Request asset, this component will now suspend
  const { by, title } = hackerNewsPost.read(id)
  return <div>{title} by {by}</div>
}

function App() {
  <Suspense fallback={null}>
    <Post id={9000} />
  </Suspense>
}
```

#### Cache busting strategies

```jsx
// This asset will be removed from the cache in 15 seconds
const hackerNewsPost = createAsset(fn, 15000)

// Clear all cached entries
hackerNewsPost.clear()

// Clear a specific entry
hackerNewsPost.clear(9000)
```

#### Reading entries outside of suspense

```jsx
// This will either return the value (without suspense!) or undefined
hackerNewsPost.peek(9000)
```

## Using hooks and global cache

You can also use the `useAsset` hook, this uses a global cache, anything you request at any time is written into it.

```jsx
import { useAsset } from "use-asset"

const hackerNewsPost = async (id) => { /*...*/ }

function Post({ id }) {
  const { by, title } = useAsset(hackerNewsPost, [id])
  return <div>{title} by {by}</div>
}

function App() {
  <Suspense fallback={null}>
    <Post id={9000} />
```

#### Cache busting, preview, multiple arguments, preload and peeking

The hook has the same API as any asset:

```jsx
// Bust cache in 15 seconds
useAsset(fn, [9000], 15000)
// Clear all cached entries
useAsset.clear()
// Clear a specific entry
useAsset.clear(9000)
// This will either return the value (without suspense!) or undefined
useAsset.peek(9000)
// Preload entries
useAsset.preload(fn, [9000])
// Multiple arguments
useAsset(fn, [1, 2, 3, 4])
```
