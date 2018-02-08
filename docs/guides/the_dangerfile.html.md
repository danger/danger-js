---
title: About the Dangerfile
subtitle: The Dangerfile
layout: guide_js
order: 1
blurb: Step two on using Danger in your app, how to work locally and nuances around working with files.
---

## Writing your Dangerfile

The Danger JS DSL is fully typed via TypeScript. These definitions are shipped with the Danger module. If your text editor supports working with type definitions you will get inline-documentation and auto-completion after you import danger in your Dangerfile. Visual Studios Code will do this by default for you.

If you are using Babel in your project, your Dangerfile will use the same transpilation settings. If you're using TypeScript + Jest it will work out of the box too, however, if you don't, you should head over to the [transpilation guide][transpilation_guide]

## Working on your Dangerfile

There are two ways to locally work on your Dangerfile. These both rely on using the GitHub API locally, so you may hit the GitHub API rate-limit or need to have authenticated request for private repos. In which case you can use an access token to do authenticated requests by exposing a token to Danger.

```sh
export DANGER_GITHUB_API_TOKEN='xxxxxxxxxx'
```

Then the danger CLI will use these authenticated API calls.

### Using `danger pr`

The command `danger pr` expects an argument of a PR url, e.g. `yarn danger pr https://github.com/danger/danger-js/pull/100`.

This will use your local Dangerfile against the metadata of the linked PR. Danger will then output the results into your terminal, instead of inside the PR itself.

### Using `danger` and Faking being on a CI

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

As the JavaScript library API is relatively limited, the Danger module includes utility functions for work which is common to most Dangerfiles. These functions can be found in both `utils`, and `github.utils` for GitHub specific functions. We're interested at growing this carefully.

## Finding more info

The [CHANGELOG][changelog] for Danger is kept entirely end-user focused, so if there is an aspect of the Dangerfile that you do not know, or looks confusing and there is nothing in the documentation - [check the CHANGELOG][changelog]. This is where we write-up why a change happened, and how it can affect Danger users.

### Examples

If you'd like to work with some reference material, here are some examples in the wild.

JavaScript:

* **Libraries** - [facebook/react-native][rn], [facebook/react][r], [styled-components/styled-components][sc] and [ReactiveX/rxjs][rxjs].
* **Docs** - [bamlab/dev-standards][bamlab]

Some TypeScript examples:

* **Apps** - [Artsy/Emission][emiss]
* **Libraries** [danger/danger-js][danger-js], [apollographql/apollo-client][apollo]

[emiss]: https://github.com/artsy/emission/blob/master/dangerfile.ts
[danger-js]: https://github.com/danger/danger-js/blob/master/dangerfile.ts
[meta]: https://github.com/artsy/metaphysics/blob/master/dangerfile.js
[rn]: https://github.com/facebook/react-native/blob/master/danger/dangerfile.js
[r]: https://github.com/facebook/react/blob/master/dangerfile.js
[sc]: https://github.com/styled-components/styled-components/blob/master/dangerfile.js
[rxjs]: https://github.com/ReactiveX/rxjs/blob/master/dangerfile.js
[setup]: http://danger.systems/guides/getting_started.html#creating-a-bot-account-for-danger-to-use
[jest]: https://github.com/facebook/jest
[transpilation_guide]: /js/tutorials/transpilation.html
[changelog]: http://danger.systems/js/changelog.html
[apollo]: https://github.com/apollographql/apollo-client/blob/master/dangerfile.ts
[bamlab]: https://github.com/bamlab/dev-standards/blob/master/dangerfile.js
