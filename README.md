# danger-js

Danger on Node, wonder what's going on? see [VISION.md](VISION.md)

### Get started?

This is like, kinda early. If you can take a bit of heat, it's usable in production as of 0.0.4.

Bah, there's something wrong with the deploy. So for now, it's not working as an imported module. [See this PR](https://github.com/artsy/emission/pull/385).

### Early Adopters

*Welcome!*

So, what's the deal? Well, right now Danger JS does the MVP of the Ruby version. You can look at Git metadata, or GitHub metadata on Travis CI. 

Danger can fail your build, write a comment on GitHub, edit it as your build changes and then delete it once you've passed review.

To install:

```sh
npm install danger --save-dev
```
Then add a run command to your `Package.json`

```js
"danger": "danger"
```

Then create a `dangerfile.js` in the project root with some rules:

```js
import { danger, fail } from "danger"

// Make sure there are changelog entries
const hasChangelog = danger.git.modified_files.includes("changelog.md")
if (!hasChangelog) {
  fail("No Changelog changes!")
}
```

Then you add `npm run danger` to the end of your CI run, and Danger will run. 👍

Notes: 

* the `Dangerfile.js` needs to be able to run on node without transpiling right now.
* The shape of the API is [`git`](https://github.com/danger/danger-js/blob/master/source/dsl/git.js) and [`pr`](https://raw.githubusercontent.com/danger/danger/master/spec/fixtures/github_api/pr_response.json)


#### This thing is broken, I should help improve it

Awesommmmee.

``` sh
git clone https://github.com/danger/danger-js.git
cd danger-js

# if you don't have have yarn installed
npm install -g yarn
 
yarn install
```

You can then verify your install by running the tests, and the linters:

``` sh
npm test
npm run lint
npm run flow
``` 

---

### Dev Life

We use quite a few semi-bleeding edge features of JS in Danger. Please see the [glossary for an overview](docs/js_glossary.md). Notably Flow, Interfaces, Async/Await and Typealiases. 

You'll have a nicer experience as a developer if you use VS Code with Flow enabled, and if you install flow-typed.

``` sh
npm install -g flow-typed
flow-typed install
```

( and maybe `flow-typed install jest@14`)

Tips:

* You can run the `danger` command globally from your dev build by running `npm run link`.
* If you're using VS Code, press Run to start an example run, should go through most of the process with a debugger attatched. Either use breakpoints, or add `debugger` to get a repl and context.

### What is the TODO?

Check the issues, I try and keep my short term perspective there. Long term is in the [VISION.md](VISION.md).
