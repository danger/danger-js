---
title: About the Dangerfile
subtitle: Plugin creation
layout: guide_js
order: 1
---

## Writing your Dangerfile

The Danger JS DSL is fully typed via TypeScript (and eventually Flow again.)  These definitions are shipped with the Danger module. If your text editor supports working with type definitions you will get inline-documentation and auto-completion. Visual Studios Code will do this by default for you.

## Working on your Dangerfile

There are two ways to work and test out your Dangerfile, outside of runnig it on your CI. These both rely on 

#### Using `danger pr`

The command `danger pr` expects an argument of a PR url, e.g. `yarn danger pr https://github.com/danger/danger-js/pull/100`.

This will use your local Dangerfile against the metadata of the linked PR. Danger will then output the results into your terminal, instead of on the PR itself.

#### Using `danger` and Faking being on a CI

If you create an [appropriately scoped temporary api token](http://danger.systems/guides/getting_started.html#setting-up-an-access-token) for your github account, this can be a good way to see if danger is suitable for you before integrating it into your CI system.

You can manually trigger danger against a pull request on the command line by setting the following environmental variables:

```bash
export DANGER_FAKE_CI="YEP"
export DANGER_GITHUB_API_TOKEN='xxxxxxxxxx'  # a github api token
export DANGER_TEST_REPO='username/reponame'
```

Then you can run against a local branch that is attached to a pull-request, by running the following:

```bash
git checkout branch-for-pr-1234
DANGER_TEST_PR='1234' npm run danger
```

Assuming that your local file-system matches up to that branch on GitHub, this will be a good approximation of how danger will work when you integrate it into your CI system. Note: this will leave a comment on the PR.

## Async

We've not found the perfect pattern for handling different patterns of asynchronous behavior inside a Dangerfile. Here are some patterns for handling them.

* **Ignore Async.** - A Dangerfile is a script, the non-blocking aspect of the node API can be ignored. E.g. use `fs.readFileSync` instead of `fs.readFile`. Danger works really well with [ShellJS][]

* **Scheduling** - The Dangerfile DSL includes a function called `schedule`, this can handle either a promise or a function with a callback arg. For example using `async/await`:

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

In this case, the closure is queued up and Danger waits until all `schedule` functions/promises are finished before continuing, so make sure to not cause it to lock. There is no timeout yet.

## Working with files

Over time, we've found it easier to create up-front arrays of files you are be interested in - then you can work with these potential arrays of files. For example:

```js
import { danger } from "danger"
import { includes, concat } from "lodash"

// The Danger DSL can be a bit verbose, so let's rename
const modified = danger.git.modified_files
const newFiles = danger.git.created_files

// Have there actually been changes to our app code vs just README changes
const modifiedAppFiles = modified.filter(p => includes(p, "lib/"))
const modifiedTestFiles = modified.filter(p => includes(p, "__tests__"))

// Pull out specific files, we want to do against them regardless
// of whether they are just created or modified.
const touchedFiles = modified.concat(danger.git.created_files)
const touchedAppOnlyFiles = touchedFiles.filter(p => includes(p, "src/lib/") && !includes(p, "__tests__"))
const touchedComponents = touchedFiles.filter(p => includes(p, "src/lib/components") && !includes(p, "__tests__"))

// Now do work against our lists of files
// ...
```

## Utils

As the JavaScript library API is relatively limited, the Danger module includes utility functions for work which is common to most Dangerfiles. There can be found in both `utils`, and `github.utils` for GitHub specific functions. We're interested at growing this slowly.

## Nuance

The CHANGELOG for Danger is kept entirely end-user focused, so if there is an aspect of the Dangerfule that you do not know, or looks confusing and there is nothing in the document - check the CHANGELOG. This is where we write-up why a change happened, and how it can affect Danger users.

###Examples

If you'd like to work with some reference material, here are some examples in the wild. 

JavaScript:

* **Apps** - [Artsy/metaphysics][meta].
* **Libraries** - [Facebook/Jest][fbj], [styled-components/styled-components][sc] and [ReactiveX/rxjs][rxjs].

Some TypeScript examples:

* **Apps** - [Artsy/Emission][emiss]
* **Libraries** [danger/danger-js][danger-js]

[emiss]: https://github.com/artsy/emission/blob/master/dangerfile.ts
[danger-js]: https://github.com/danger/danger-js/blob/master/dangerfile.ts
[meta]: https://github.com/artsy/metaphysics/blob/master/dangerfile.js
[fbj]: https://github.com/facebook/jest/blob/master/dangerfile.js
[sc]: https://github.com/styled-components/styled-components/blob/master/dangerfile.js
[rxjs]: https://github.com/ReactiveX/rxjs/blob/master/dangerfile.js
[setup]: http://danger.systems/guides/getting_started.html#creating-a-bot-account-for-danger-to-use
[jest]: https://github.com/facebook/jest
[ShellJS]: http://github.com/shelljs/shelljs
