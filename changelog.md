### master

//  Add your own contribution below

### 0.11.3

* Internal changes for usage with Peril - orta
* Add `danger pr --repl`, which drops into a Node.js REPL after evaluating the dangerfile - macklinu

### 0.11.0 - 0.11.2

* Add support for [Docker Cloud](https://cloud.docker.com) - camacho 

### 0.10.1

* Builds which only use markdown now only show the markdown, and no violations table is shown - mxstbr

### 0.10.0

* Adds support for running Danger against a PR locally - orta

The workflow is that you find a PR that exhibits the behavior you'd like Danger to run against,
then edit the local `Dangerfile.js` and run `yarn run danger pr https://github.com/facebook/jest/pull/2629`.

This will post the results to your console, instead of on the PR itself.

* Danger changes to your Dangerfile are not persisted after the run - orta
* Add summary comment for danger message - kwonoj
* Add `jest-environment-node` to the Package.json - orta

### 0.9.0

* Adds support for `git.commits` and `github.commits` - orta

  Why two? Well github.commits contains a bunch of github specific metadata ( e.g. GitHub user creds,
  commit comment counts. ) Chances are, you're always going to use `git.commits` however if you
  want more rich data, the GitHub one is available too. Here's an example:

```js
const merges = git.commits.filter(commit => commit.message.include("Merge Master"))
if (merges.length) { fail("Please rebase your PR")}
```

* Support custom dangerfile via `-d` commandline arg - kwonoj
* Allow debug dump output via `DEBUG=danger:*` environment variable - kwonoj
* Adds surf-build ci provider - kwonoj
* Forward environment variables to external module constructor - kwonoj

### 0.8.0

* Support `danger run -ci` to specify external CI provider - kwonoj
* Adds `--verbose` to `danger`, which for now will echo out all the URLs Danger has requested - orta
* Migrate codebase into TypeScript from flow - kwonoj
* Handle removing all sorts  of import types for Danger in the Dangerfile - orta

### 0.7.3-4-5

* A failing network request will raise an error - orta
* Fix Dangerfile parsing which broke due to Peril related changes - orta
* Tweak the npmignore, ship less random stuff to others - orta

### 0.7.2

* Fixes to the shipped Flow/TS definitions - orta
* Adds more functions the the internal Danger GitHub client - orta
* Infrastructure work to allow Peril to run a Dangerfile - orta
* Upgrade outdated ESLint packages - macklinu
* Enhance Windows OS compatibility - kwonoj

### 0.7.1

* Set exit code to 1 when running `danger` throws an error - macklinu
* Add Jenkins CI source - macklinu
* Add .editorconfig - macklinu
* Adds jest-runtime to the dependencies - orta

### 0.7.0

* You can build and run in vscode using your own custom `env/development.env` file. This is useful because you can use the debugger against a real PR. See `env/development.env.example` for syntax.  - orta

* Uses `jest-transform` and `jest-runtime` to eval and apply babel transforms.

  This does two things, makes it feasible to do [hosted-danger](https://github.com/danger/peril) and
  makes it possible to write your Dangerfile in a way that's consistent with the rest of your JavaScript. - orta

* Add tests directory to .npmignore - macklinu
* Update to Jest 18 - macklinu


### 0.6.10

* Brings back the ability to emulate a fake CI run locally via `danger` - orta

### 0.6.9

* Makes `babel-polyfill` a direct dependency, this is because it is actually an implicit dependency in the app. I'm not sure how I feel about this, I guess if we use a part of it in the babel translation of a user's Dangerfile them I'm OK with it. - orta

### 0.6.6 - 0.6.7 - 0.6.8

* Ship flow annotations with the npm module - orta

### 0.6.5

* Adds more node instances to travis - romanki + orta
* Adds support for Semaphore CI - orta

### 0.6.4

* The env vars `DANGER_TEST_REPO` and `DANGER_TEST_PR` will allow you initialize the FakeCI with a repo of your choice. See README.md for more info
* Improved error messaging around not including a `DANGER_GITHUB_API_TOKEN` in the ENV - nsfmc / orta
* Adds support for getting the diff for a specific file from git: e.g.

```js
// Politely ask for their name on the entry too
const changelogDiff = danger.git.diffForFile("changelog.md")
const contributorName = danger.github.pr.user.login
if (changelogDiff && changelogDiff.indexOf(contributorName) === -1) {
  warn("Please add your GitHub name to the changelog entry, so we can attribute you.")
}
```

### 0.6.3

* Does not break commonmark on GitHub - orta
* upgrades to flow 0.35.0 and fixes associated type errors in covariant/invariant interfaces - nsfmc
* omits flow requirement for new test files - nsfmc
* adds support for circleci - nsfmc
* defines CISource properties in flow as read-only - nsfmc

### 0.5.0

* `danger.pr` -> `danger.github.pr`, I've also created interfaces for them - orta
* `warn`, `message`, `markdown` are all ported over to DangerJS - orta
* Shows a HTML table for Danger message - orta
* Now offers a Flow-typed definition file, it's not shipped to their repo yet, you can make it by `npm run export-flowtype` - orta
* Started turning this into a real project by adding tests - orta

### 0.0.5-0.0.10

* Changes some files casing, added some logs, a bit of error reporting, and verifying everything works through npm - orta

### 0.0.4

* Danger edit an existing post, and delete it when it's not relevant - orta

### 0.0.3

* Danger will post a comment on a GitHub PR with any Fails - orta

### 0.0.2

OK, first usable for others version. Only supports GitHub and Travis CI.

You can run by doing:

```sh
danger
```

Make sure you set a `DANGER_GITHUB_API_TOKEN` on your CI - [see the Ruby guide](http://danger.systems/guides/getting_started.html#setting-up-danger-to-run-on-your-ci) for that.

Then you can make a `dangerfile.js` (has to be lowercase, deal with it.) It has access to a whopping 2 DSL attributes.

```sh
pr
git
fail(message: string)
```

`pr` _probably_ won't be sticking around for the long run, but if you're using a `0.0.2` release, you should be OK with that. It's the full metadata of the PR, so [this JSON file](https://raw.githubusercontent.com/danger/danger/master/spec/fixtures/github_api/pr_response.json).
`git` currently has:

```sh
git.modified_file
git.created_files
git.deleted_files
```

which are string arrays of files.

`fail(message: string)` will let you raise an error, and will make the process return 1 after the parsing has finished.

Overall: your Dangerfile should look something like:

```js
import { danger } from "danger"

const hasChangelog = danger.git.modified_files.includes("changelog.md")
if (!hasChangelog) {
  fail("No Changelog changes!")
}
```

That should do ya. I think. This doens't support babel, and I haven't explored using other modules etc, so

./

### 0.0.1

Not usable for others, only stubs of classes etc.
