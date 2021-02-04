---
title: Peril
subtitle: When there's not enough Danger in your life
layout: guide_js
order: 4
blurb: When there's not enough Danger in your life
---

## TLDR: Peril

Peril is a hosted instance of Danger. So instead of running on CI, it will run on a server somewhere and can respond
instantly to webhooks. This gives Danger the ability to respond instantly to PR changes, and to run on more than just
PRs.

A lot of the information on Peril can be found on the
[Artsy blog: here](http://artsy.github.io/blog/2017/09/04/Introducing-Peril/)

Today Peril is self-hosted via heroku. There is a walkthrough on the
[Peril repo: here](https://github.com/danger/peril/blob/main/docs/setup_for_org.md). It's still a pretty fast moving
project ever 6 months into deployment so expect to maybe fix your own problem occasionally.

## Dangerfile implications

Two tricky problems in Peril today:

- Async is weird.
- Can't do relative `import`s.

Today Peril runs by inline execution of a JavaScript script. This has a serious draw-back in that async behavior doesn't
work how you think it does. Here are some patterns for handling that.

- **Ignore Async.** - A Dangerfile is a script, the non-blocking aspect of the node API can be ignored. E.g. use
  `path.xSync` instead of `path.x`

- **Scheduling** - The Dangerfile DSL includes a function called `schedule`, this can handle either a promise or a
  function with a callback arg. For example using `async/await`:

```js
import { schedule, danger } from "danger"

/// [... a bunch of functions]

schedule(async () => {
  const packageDiff = await danger.git.JSONDiffForFile("package.json")
  checkForRelease(packageDiff)
  checkForNewDependencies(packageDiff)
  checkForLockfileDiff(packageDiff)
  checkForTypesInDeps(packageDiff)
})
```

In this case, the closure is queued up and Danger waits until all `schedule` functions/promises are finished before
continuing, so make sure to not cause it to lock.

## Plugin implications

A plugin that runs on Peril will also have to handle the above if it uses async code. For some examples of this, see
[danger-plugin-spellcheck](https://github.com/orta/danger-plugin-spellcheck#danger-plugin-spellcheck).
