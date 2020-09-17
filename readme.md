A simple loading strategy for react suspense based on [react-promise-suspense](https://github.com/vigzmv/react-promise-suspense).

```bash
npm install use-asset
```

## Using assets

`use-asset` allows you to create single assets, which bring their own cache. This is great for preload and cache busting.

```jsx
import React, { Suspense } from "react"
import { createAsset } from "use-asset"

// First create an asset, it hands you resolve and reject functions.
// The rest of the arguments are user-provided.
// Call resolve whenever you have obtained your result.
const hackerNewsPost = createAsset(async (res, rej, id) => {
  const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
  const json = await res.json()
  res(json)
})

// You can preload assets, these will be cached
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

You can opt into use our hook, `useAsset`, this opens up a global cache, anything you request at any time is written into it.

```jsx
import { useAsset } from "use-asset"

const hackerNewsPost = async (res, rej, id) => {
  const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
  const json = await res.json()
  res(json)
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

It has the same api

```jsx
// Clear all cached entries
useAsset.clear()
// Clear a specific entry
useAsset.clear(9000)
// This will either return the value (without suspense!) or undefined
useAsset.peek(9000)
```
