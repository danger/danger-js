[![npm](https://img.shields.io/npm/v/danger.svg)](https://www.npmjs.com/package/danger)
[![Build Status](https://travis-ci.org/danger/danger-js.svg?branch=master)](https://travis-ci.org/danger/danger-js)
[![Build Status](https://ci.appveyor.com/api/projects/status/ep5hgeox3lbc5c7f?svg=true)](https://ci.appveyor.com/project/orta/danger-js/branch/master)

Danger on Node, wonder what's going on? see [VISION.md](VISION.md)

*Welcome!*

So, what's the deal? Well, right now Danger JS does a lot of the simpler parts of [the Ruby version](http://danger.systems).
You can look at [Git](https://github.com/danger/danger-js/blob/master/source/dsl/GitDSL.ts) metadata, or [GitHub](https://github.com/danger/danger-js/blob/master/source/dsl/GitHubDSL.ts) metadata on Travis, Circle, Semaphore, Jenkins, or Docker Cloud.

Danger can fail your build, write a comment on GitHub, edit it as your PR changes and then delete it once you've passed review. Perfect.

## Getting set up in your Project

```sh
# with yarn
yarn add danger --dev

# or with npm
npm install --save-dev danger
```
If using NPM, add a run command to your `package.json`

```js
"danger": "danger"
```

Then create a `dangerfile.js` in the project root with some rules:

```js
import { danger, fail, warn } from "danger"
import fs from "fs"

// Make sure there are changelog entries
const hasChangelog = danger.git.modified_files.includes("changelog.md")
if (!hasChangelog) { fail("No Changelog changes!") }

const jsFiles = danger.git.created_files.filter(path => path.endsWith("js"))

// new js files should have `@flow` at the top
const unFlowedFiles = jsFiles.filter(filepath => {
  const content = fs.readFileSync(filepath)
  return !content.includes("@flow")
})

if (unFlowedFiles.length > 0) {
  warn(`These new JS files do not have Flow enabled: ${unFlowedFiles.join(", ")}`)
}
```

Then you add `yarn run danger` to the end of your CI run, and Danger will run. Here's [an example](https://github.com/artsy/emission/pull/385). 👍

Want to see some existing examples? Check out:

* **Apps** - [Artsy/Emission][emiss] and [Artsy/metaphysics][meta].
* **Libraries** - [Facebook/Jest][fbj] and [styled-components/styled-components][sc].

I'd love PRs adding more.

## Getting set up on CI

For now, to get set up I'd recommend looking at [the setup guide for the Ruby version][setup]. All the environment vars are the exact same between versions.

You will need to create a bot account, and set up CI to run danger.

If you are using Docker Cloud, make sure to set the following blank ENV vars in your `docker-compose.test.yml` file so they are carried forward from the build environment:

```yml
sut:
  build: .
  environment:
    - DANGER_GITHUB_API_TOKEN
    - DOCKER_REPO
    - PULL_REQUEST_URL
    - SOURCE_REPOSITORY_URL
```

## Running/Testing manually against a repo

There are two ways to do this:

#### Using `danger pr`

The command `danger pr` expects an argument of a PR url, e.g. `danger pr https://github.com/danger/danger-js/pull/100`.

This will use your local `dangerfile.js` against the metadata of that PR. Danger will then output the results as JSON, instead of on the PR itself.

#### Using `danger`

If you create an [appropriately scoped temporary api token](http://danger.systems/guides/getting_started.html#setting-up-an-access-token) for your github account, this can be a good way to see if danger is suitable for you before integrating it into your CI system.

You can manually trigger danger against a pull request on the command line by setting the following environmental variables:

```bash
export DANGER_FAKE_CI="YEP"
export DANGER_GITHUB_API_TOKEN='xxxxxxxxxx'  # a github api token
export DANGER_TEST_REPO='username/reponame'
```

Then you can run against a local branch that is attached to a pull-request, by running the following

```bash
git checkout branch-for-pr-1234
DANGER_TEST_PR='1234' npm run danger
```

assuming that your local file-system matches up to that branch on github, this will be a good approximation of how danger will work when you integrate it into your CI system.

Note: this will leave a comment on the PR.

## This thing is broken, I should help improve it!

Awesommmmee.

``` sh
git clone https://github.com/danger/danger-js.git
cd danger-js

# if you don't have yarn installed
npm install -g yarn

yarn install
```

You can then verify your install by running the tests, and the linters:

``` sh
yarn test
yarn lint
```

---

### Dev Life

Tips:

* You can run the `danger` command globally from your dev build by running `yarn run link`.
* If you're using VS Code, press Run to start an example run, should go through most of the process with a debugger attached. Either use breakpoints, or add `debugger` to get a repl and context.

### What is the TODO?

Check the issues, I try and keep my short term perspective there. Long term is in the [VISION.md](VISION.md).

[emiss]: https://github.com/artsy/emission/blob/master/dangerfile.js
[meta]: https://github.com/artsy/metaphysics/blob/master/dangerfile.js
[fbj]: https://github.com/facebook/jest/blob/master/dangerfile.js
[sc]: https://github.com/styled-components/styled-components/blob/master/dangerfile.js
[setup]: http://danger.systems/guides/getting_started.html#creating-a-bot-account-for-danger-to-use
