A simple loading strategy for React Suspense based on [react-promise-suspense](https://github.com/vigzmv/react-promise-suspense).

Try a simple demo [here](https://codesandbox.io/s/jotai-demo-forked-ji8ky).

```bash
npm install use-asset
```

## Using assets

Each asset you create comes with its own cache. When you request something from it, the arguments that you pass will act as cache-keys. If you request later on using the same keys, it won't have to re-fetch but serves the result that it already knows.

```jsx
import React, { Suspense } from "react"
import { createAsset } from "use-asset"

// First create an asset, it returns resolve and reject callbacks.
// The rest of the arguments are user-provided.
// Call resolve whenever you have obtained your result.
const hackerNewsPost = createAsset(async (resolve, reject, id) => {
  const resp = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
  const json = await resp.json()
  resolve(json)
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
    <Post id={9000}>
  </Suspense>
}
```

#### Cache busting strategies

```jsx
// This asset will be removed from the cache in 15 seconds
const hackerNewsPost = createAsset(..., 15000)

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

const hackerNewsPost = async (resolve, reject, id) => {
  const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
  const json = await res.json()
  resolve(json)
}

function Post({ id }) {
  const { by, title } = useAsset(hackerNewsPost, [id])
  return <div>{title} by {by}</div>
}

function App() {
  <Suspense fallback={null}>
    <Post id={9000}>
  </Suspense>
}
```

#### Cache busting and peeking

The hook has the same API as any asset:

```jsx
// Clear all cached entries
useAsset.clear()
// Clear a specific entry
useAsset.clear(9000)
// This will either return the value (without suspense!) or undefined
useAsset.peek(9000)
```
