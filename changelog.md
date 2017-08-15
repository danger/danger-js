//  Please add your own contribution below inside the Master section, ideally with a consumer's perspective in mind.

### Master

// TODO

* Handle exceptions in Dangerfile and report them as failures in Danger results - macklinu

### 2.0.0-alpha.6-7

* Expose a Promise object to the external GitHub API - orta

### 2.0.0-alpha.4-5

* Allow running a dangerfile entirely from memory using the `Executor` API - orta

### 2.0.0-alpha.2-3

* Removes the `jest-*` dependencies - orta

### 2.0.0-alpha.1

- Support [a vm2](https://github.com/patriksimek/vm2) based Dangerfile runner as an alternative to the 
  jest infrastructure. There are a few main reasons for this:

  * I haven't been able to completely understand how Jest's internals work around all of the code-eval and 
    pre-requisite setup, which has made it hard to work on some more complex Peril features.

  * Jest releases are every few months, personally I love this as a user of Jest, as an API consumer
    it can be difficult to get changes shipped.

  * The fact that both Danger/Jest make runtime changes means that you need to update them together

  * I have commit access to vm2, so getting changes done is easy

  I like to think of it as having gone from Jest's runner which is a massive toolbox, to vm2 which is a tiny 
  toolbox where I'll have to add a bunch of new tools to get everything working.

  The *massive downside* to this is that Danger now has to have support for transpiling via Babel, or 
  from TypeScript unlike before, where it was a freebie inside Jest. Jest handled this so well. This means that a 
  Dangerfile which used to "just work" with no config may not. Thus, IMO, this is a breaking major semver.

  Is it likely that you need to make any changes? So far, it seems probably not. At least all of the tests with
  Dangerfiles original from the older Jest runner pass with the new version.

  This is an alpha release, because it's knowingly shipped with some breakages around babel support, specifically:

  * Babel parsing of relative imports in a Dangerfile aren't working
  * Some of the features which require the `regeneratorRuntime` to be set up aren't working yet

  Those are blockers on a 2.0.0 release.

### 1.2.0

- Exposes an internal API for reading a file from a GitHub repo as `danger.github.utils.fileContents` - orta

  Ideally this is what you should be using in plugins to read files, it's what Danger uses throughout the
  codebase internally. This means that your plugin/dangerfile doesn't need to rely on running on the CI
  when instead it could run via the GitHub API.

- Update prettier - orta
- Removes dtslint as a dependency - sapegin/orta

### 1.1.0

-   Support retrive paginated pull request commit list - kwonoj
-  Add support for VSTS CI - mlabrum
-  Remove the DSL duplication on the `danger` export, it wasn't needed or used. - orta
-  Update to TypeScript 2.4.x - orta
-  Rename github test static_file to remove `:` from the filename to fix a checkout issue on windows - mlabrum

### 1.0.0

Hello readers! This represents a general stability for Danger. It is mainly a documentation release, as
it corresponds to <http://danger.systems/js/> being generally available. I made the initial commit back in 20 Aug 2016
and now it's 30th June 2017. It's awesome to look back through the CHANGELOG and see how things have changed.

You can find out a lot more about the 1.0, and Danger's history on my [Artsy blog post on the Danger 1.0](https://artsy.github.io/blog/2017/06/30/danger-one-oh-again/).

-   Adds inline docs for all CI providers - orta

### 0.21.1

-   Use HTTP for the GitHub status check target URL - macklinu
-   Correct some examples in node-app - clintam
-   Add support for buddybuild CI - benkraus/clintam
-   Add support for GithHub Apps API (no GET /user) - clintam

### 0.21.0

-   Posts status reports for passing/failing builds, if the account for danger has access - orta
-   Adds prettier to the codebase - orta
-   Converts a bunch of Danger's dangerfile into a plugin - [danger-plugin-yarn](https://github.com/orta/danger-plugin-yarn) - orta

This is my first non-trivial plugin, based on infrastructure from @macklinu.
Plugins are looking great, you can get some info at <https://github.com/macklinu/generator-danger-plugin>.

-   Docs updates for the website - orta

### 0.20.0

-   Fix `danger pr` commands are not running on windows - kwonoj
-   Fix broken link in getting started docs - frozegnome
-   Do not delete comment written from user have same userid for danger - kwonoj
-   Fix link to `jest` in getting started docs - palleas
-   Fix yarn install instruction in getting started docs - palleas

### 0.19.0

-   Update to Jest 20 - macklinu
-   Change the danger.d.ts to use module exports instead of globals - orta
-   Render markdown inside `message()`, `warn()`, and `fail()` messages. - macklinu

An example:

```js
fail(`Missing Test Files:

- \`src/lib/components/artist/artworks/__tests__/index-tests.tsx\`
- \`src/lib/components/artwork_grids/__tests__/infinite_scroll_grid-tests.tsx\`
- \`src/lib/containers/__tests__/works_for_you-tests.tsx\`

If these files are supposed to not exist, please update your PR body to include "Skip New Tests".`)
```

Will result in:

<table>
  <thead>
    <tr>
      <th width="50"></th>
      <th width="100%" data-danger-table="true">Fails</th>
    </tr>
  </thead>
  <tbody>
<tr>
      <td>:no_entry_sign:</td>
      <td>Missing Test Files:

-   `src/lib/components/artist/artworks/__tests__/index-tests.tsx`
-   `src/lib/components/artwork_grids/__tests__/infinite_scroll_grid-tests.tsx`
-   `src/lib/containers/__tests__/works_for_you-tests.tsx`

If these files are supposed to not exist, please update your PR body to include "Skip New Tests".

</td>
    </tr>
  </tbody>
</table>

### 0.18.0

-   Adds `github.api`. This is a fully authenticated client from the [github](https://www.npmjs.com/package/github)
    npm module. - @orta

    An easy example of it's usage would be using Danger to add a label to your PR. Note that Danger will have the
    permissions for your account, so for OSS repos - this won't work.

    ```js
    danger.github.api.issues.addLabels({ owner: "danger", repo: "danger-js", number: danger.github.pr.number, labels: ["Danger Passed"] })
    ```

    Yeah, that's a bit verbose, I agree. So, there's also `github.thisPR` which should simplify that. It aims to provide a
    lot of the values for the current PR to use with the API.

    ```js
    const github = danger.github
    github.api.issues.addLabels({ ...github.thisPR, labels: ["Danger Passed"] })
    ```

    You could use this API for a bunch of things, here's some quick ideas:

    -   Request specific reviewers when specific files change (`api.pullRequests.createReviewRequest`)
    -   Add a label for when something passes or fails (`api.issues.addLabels`)
    -   Verifying if someone is in your org? (`api.orgs.checkMembership`)
    -   Updating Project tickets to show they have a PR (`api.projects.updateProject`)

### 0.17.0

-   [Enhancements to `danger.git.diffForFile()`](https://github.com/danger/danger-js/pull/223) - @namuol

    -   Removed `diffTypes` second argument in favor of `result.added` and `result.removed`
    -   Added `result.before` and `result.after` for easy access to full contents of the original & updated file
    -   `danger.git.diffForFile` is now an `async` function

    #### TL;DR:

    ```js
    // In danger 0.16.0:
    const fullDiff = danger.git.diffForFile('foo.js')
    const addedLines = danger.git.diffForFile('foo.js', ['add'])
    const removedLines = danger.git.diffForFile('foo.js', ['del'])

    // In the latest version:
    const diff = await danger.git.diffForFile('foo.js')
    const fullDiff = diff.diff
    const addedLines = diff.added
    const removedLines = diff.removed
    const beforeFileContents = diff.before
    const afterFileContents = diff.after
    ```

-   Update internal test fixture generation docs - namuol

### 0.16.0

-   Adds a `diffTypes` option to `diffForFile` - alex3165
-   Add Buildkite CI source - jacobwgillespie

### 0.15.0

-   When a Dangerfile fails to eval, send a message to the PR - orta

### 0.14.2

-   Updated jest-\* dependencies to 19.x - orta

    Updating the jest-\* dependencies seems to be exhibiting strange behavior in tests for windows if you update, and
    use windows, can you please confirm that everything is 👍

-   Added type shapings to `JSONPatchForFile` - orta
-   Replaced deprecated `lodash.isarray` package with `Array.isArray` - damassi

### 0.14.1

-   Moved `@types/chalk` from dependencies to devDependencies - orta
-   Killed some stray console logs - orta
-   Updated the danger.d.ts - orta

### 0.14.0

-   TypeScript Dangerfiles are now support in Danger - orta

    We use TypeScript in Danger, and a lot of my work in Artsy now uses TypeScript (see: [JS2017 at Artsy](http://artsy.github.io/blog/2017/02/05/Front-end-JavaScript-at-Artsy-2017/#TypeScrip1t)), so I wanted to
    explore using TypeScript in Dangerfiles.

    This is built on top of Jest's custom transformers, so if you are already using Jest with TypeScript, then
    you can change the `dangerfile.js` to `dangerfile.ts` and nothing should need changing ( except that you might have
    new warnings/errors ) (_note:_ in changing this for Danger, I had to also add the `dangerfile.ts` to the `"exclude"`
    section of the `tsconfig.json` so that it didn't change the project's root folder.)

    This repo is now using both a babel Dangerfile (running on Circle CI) and a TypeScript one (running on Travis) to
    ensure that we don't accidentally break either.

-   Created a new `danger.d.ts` for VS Code users to get auto-completion etc - orta
-   Added a two new `git` DSL functions: `git.JSONDiffForFile(filename)` and `git.JSONPatchForFile(filename)`.

    -   `git.JSONPatchForFile`

        This will generate a rfc6902 JSON patch between two files inside your repo. These patch files are useful as a standard, but are pretty tricky to work with in something like a Dangerfile, where rule terseness takes priority.

    -   `git.JSONDiffForFile`

        This uses `JSONPatchForFile` to generate an object that represents all changes inside a Dangerfile as a single object, with keys for the changed paths. For example with a change like this:

        ```diff
        {
          "dependencies": {
            "babel-polyfill": "^6.20.0",
         +  "chalk": "^1.1.1",
            "commander": "^2.9.0",
            "debug": "^2.6.0"
          },
        }
        ```

        You could become aware of what has changed with a Dangerfile in a `schedule`'d function like:

        ```js
        const packageDiff = await git.JSONDiffForFile("package.json")
        if (packageDiff.dependencies) {
          const deps = packageDiff.dependencies

          deps.added   // ["chalk"],
          deps.removed // []
          deps.after   // { "babel-polyfill": "^6.20.0", "chalk": "^1.1.1", "commander": "^2.9.0", "debug": "^2.6.0" }
          deps.before  // { "babel-polyfill": "^6.20.0", "commander": "^2.9.0", "debug": "^2.6.0" }
        }
        ```

        The keys: `added` and `removed` only exist on the object if:

        -   `before` and `after` are both objects - in which case `added` and `removed` are the added or removed keys
        -   `before` and `after` are both arrays - in which case `added` and `removed` are the added or removed values

-   Exposed all global functions ( like `warn`, `fail`, `git`, `schedule`, ... ) on the `danger` object. - orta

    This is specifically to simplify building library code. It should not affect end-users. If you want to
    look at making a Danger JS Plugin, I'd recommend exposing a function which takes the `danger` object and working from that. If you're interested, there is an active discussion on plugin support in the DangerJS issues.

-   Improves messaging to the terminal - orta
-   Adds the ability to not have Danger post to GitHub via a flag: `danger run --text-only` - orta
-   Fix a crasher with `prs.find` #181 - orta

### 0.13.0

-   Add `danger.utils` DSL, which includes `danger.utils.href()` and `danger.utils.sentence()` - macklinu

    We were finding that a lot of Dangerfiles needed similar functions, so we've added a `utils` object
    to offer functions that are going to be used across the board. If you can think of more
    functions you use, we'd love to add them. Ideally you shouldn't need to use anything but Danger + utils
    to write your Dangerfiles.

    ```js
    danger.utils.href("http://danger.systems", "Danger") // <a href="http://danger.systems">Danger</a>
    danger.utils.sentence(["A", "B", "C"]) // "A, B and C"
    ```

-   Adds `danger.github.utils` - which currently has only one function: `fileLinks` - orta

    Most of the time people are working with a list of files (e.g. modified, or created) and then
    want to present clickable links to those. As the logic to figure the URLs is very GitHub specific,
    we've moved that into it's own object with space to grow.

    ```js
    const files = danger.git.modified_files // ["lib/component/a.ts", "lib/component/b.ts"]
    const links = danger.github.utils.fileLinks(files) // "<a href='...'>a</a> and <a href='...'>b</a>"
    warn(`These files have changes: ${links}`)
    ```

### 0.12.1

-   Add support for [Drone](http://readme.drone.io) - gabro

### 0.12.0

-   Added support for handling async code in a Dangerfile - deecewan

    This is still a bit of a work in progress, however, there is a new function added to the DSL: `schedule`.

    A Dangerfile is evaluated as a script, and so async code has not worked out of the box. With the `schedule`
    function you can now register a section of code to evaluate across multiple tick cycles.

    `schedule` currently handles two types of arguments, either a promise or a function with a resolve arg.
    Assuming you have a working Babel setup for this inside your project, you can run a Dangerfile like this:

    ```js
    schedule(async () => {
      const thing = await asyncAction()
      if (thing) { warn('After Async Function') }
    });
    ```

    Or if you wanted something simpler,

    ```js
    schedule((resolved) => {
      if (failed) {
        fail("Failed to run")
      }
    })
    ```

-   Adds new GitHub DSL elements - deecewan


-   `danger.github.issue` - As a PR is an issue in GitHub terminology, the issue contains a bit more metadata. Mainly labels, so if you want to know what labels are applied to a PR, use `danger.github.issue.labels`
-   `danger.github.reviews` - Find out about your reviews in the new GitHub Reviewer systems,
-   `danger.github.requested_reviewers` - Find out who has been requested to review a PR.


-   Updated TypeScript and Jest dependencies - orta
-   Add support for Github Enterprise via DANGER_GITHUB_API_BASE_URL env var - mashbourne

### 0.11.3 - 0.11.5

-   Internal changes for usage with Peril - orta

-   Add `danger pr --repl`, which drops into a Node.js REPL after evaluating the dangerfile - macklinu
-   Add support for Codeship - deecewan

### 0.11.0 - 0.11.2

-   Add support for [Docker Cloud](https://cloud.docker.com) - camacho

### 0.10.1

-   Builds which only use markdown now only show the markdown, and no violations table is shown - mxstbr

### 0.10.0

-   Adds support for running Danger against a PR locally - orta

The workflow is that you find a PR that exhibits the behavior you'd like Danger to run against,
then edit the local `Dangerfile.js` and run `yarn run danger pr https://github.com/facebook/jest/pull/2629`.

This will post the results to your console, instead of on the PR itself.

-   Danger changes to your Dangerfile are not persisted after the run - orta
-   Add summary comment for danger message - kwonoj
-   Add `jest-environment-node` to the Package.json - orta

### 0.9.0

-   Adds support for `git.commits` and `github.commits` - orta

    Why two? Well github.commits contains a bunch of github specific metadata ( e.g. GitHub user creds,
    commit comment counts. ) Chances are, you're always going to use `git.commits` however if you
    want more rich data, the GitHub one is available too. Here's an example:

```js
const merges = git.commits.filter(commit => commit.message.include("Merge Master"))
if (merges.length) { fail("Please rebase your PR")}
```

-   Support custom dangerfile via `-d` commandline arg - kwonoj
-   Allow debug dump output via `DEBUG=danger:*` environment variable - kwonoj
-   Adds surf-build ci provider - kwonoj
-   Forward environment variables to external module constructor - kwonoj

### 0.8.0

-   Support `danger run -ci` to specify external CI provider - kwonoj
-   Adds `--verbose` to `danger`, which for now will echo out all the URLs Danger has requested - orta
-   Migrate codebase into TypeScript from flow - kwonoj
-   Handle removing all sorts  of import types for Danger in the Dangerfile - orta

### 0.7.3-4-5

-   A failing network request will raise an error - orta
-   Fix Dangerfile parsing which broke due to Peril related changes - orta
-   Tweak the npmignore, ship less random stuff to others - orta

### 0.7.2

-   Fixes to the shipped Flow/TS definitions - orta
-   Adds more functions the the internal Danger GitHub client - orta
-   Infrastructure work to allow Peril to run a Dangerfile - orta
-   Upgrade outdated ESLint packages - macklinu
-   Enhance Windows OS compatibility - kwonoj

### 0.7.1

-   Set exit code to 1 when running `danger` throws an error - macklinu
-   Add Jenkins CI source - macklinu
-   Add .editorconfig - macklinu
-   Adds jest-runtime to the dependencies - orta

### 0.7.0

-   You can build and run in vscode using your own custom `env/development.env` file. This is useful because you can use the debugger against a real PR. See `env/development.env.example` for syntax.  - orta

-   Uses `jest-transform` and `jest-runtime` to eval and apply babel transforms.

    This does two things, makes it feasible to do [hosted-danger](https://github.com/danger/peril) and
    makes it possible to write your Dangerfile in a way that's consistent with the rest of your JavaScript. - orta

-   Add tests directory to .npmignore - macklinu
-   Update to Jest 18 - macklinu

### 0.6.10

-   Brings back the ability to emulate a fake CI run locally via `danger` - orta

### 0.6.9

-   Makes `babel-polyfill` a direct dependency, this is because it is actually an implicit dependency in the app. I'm not sure how I feel about this, I guess if we use a part of it in the babel translation of a user's Dangerfile them I'm OK with it. - orta

### 0.6.6 - 0.6.7 - 0.6.8

-   Ship flow annotations with the npm module - orta

### 0.6.5

-   Adds more node instances to travis - romanki + orta
-   Adds support for Semaphore CI - orta

### 0.6.4

-   The env vars `DANGER_TEST_REPO` and `DANGER_TEST_PR` will allow you initialize the FakeCI with a repo of your choice. See README.md for more info
-   Improved error messaging around not including a `DANGER_GITHUB_API_TOKEN` in the ENV - nsfmc / orta
-   Adds support for getting the diff for a specific file from git: e.g.

```js
// Politely ask for their name on the entry too
const changelogDiff = danger.git.diffForFile("changelog.md")
const contributorName = danger.github.pr.user.login
if (changelogDiff && changelogDiff.indexOf(contributorName) === -1) {
  warn("Please add your GitHub name to the changelog entry, so we can attribute you.")
}
```

### 0.6.3

-   Does not break commonmark on GitHub - orta
-   upgrades to flow 0.35.0 and fixes associated type errors in covariant/invariant interfaces - nsfmc
-   omits flow requirement for new test files - nsfmc
-   adds support for circleci - nsfmc
-   defines CISource properties in flow as read-only - nsfmc

### 0.5.0

-   `danger.pr` -> `danger.github.pr`, I've also created interfaces for them - orta
-   `warn`, `message`, `markdown` are all ported over to DangerJS - orta
-   Shows a HTML table for Danger message - orta
-   Now offers a Flow-typed definition file, it's not shipped to their repo yet, you can make it by `npm run export-flowtype` - orta
-   Started turning this into a real project by adding tests - orta

### 0.0.5-0.0.10

-   Changes some files casing, added some logs, a bit of error reporting, and verifying everything works through npm - orta

### 0.0.4

-   Danger edit an existing post, and delete it when it's not relevant - orta

### 0.0.3

-   Danger will post a comment on a GitHub PR with any Fails - orta

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

That should do ya. I think. This doesn't support babel, and I haven't explored using other modules etc, so...

./

### 0.0.1

Not usable for others, only stubs of classes etc. - orta
