<!--

// Please add your own contribution below inside the Main section, no need to
// set a version number, that happens during a deploy. Thanks!
//
// These docs are aimed at users rather than danger developers, so please limit technical
// terminology in here.

// Note: if this is your first PR, you'll need to add your URL to the footnotes
//       see the bottom of this file. The list there is sorted, try to follow that.

-->

## Main

<!-- Your comment below this -->

<!-- Your comment above this -->

# 10.8.0

- Feature: `danger local --outputJSON` for [#1177](https://github.com/danger/danger-js/pull/1177) [@orta]
- Fix: Updates `jsonpointer` for [#1174](https://github.com/danger/danger-js/pull/1174) [@unfernandito]
- Fix: Updates `parse-link-header` for CVE-2021-23490 [#1190](https://github.com/danger/danger-js/pull/1190) [@fbartho]

# 10.7.1

- Updates micromatch dependencies for CVE-2021-23440

# 10.7.0

- Adds support for XcodeCloud

# 10.6.6

- Fix for supporting Bitbucket Server personal repositories
- GitLab: Added `GitLabApi` to `danger.gitlab.api`. - [@shyim]
- GitLab: Added label helper functions to `danger.gitlab.api.addLabels` and `danger.gitlab.api.removeLabels`. - [@shyim]

# 10.6.5

- Improvements to the git parsing for `danger local` - [@denieler]
- Bitbucket Cloud: Fix type of BitBucketCloudPRDSL.created_on and updated_on. - [@hellocore]

# 10.6.4

- DEBUG="\*" will now log out the response for any HTTP request which isn't classed as "OK" - [@orta]

# 10.6.3

- Fixed Bitrise's `ciRunURL` underlying env var - [@rogerluan]
- Simplified Bitrise repo slug lookup, fixing SSH URL parsing in BitBucketServer - [@rogerluan]
- Log failure to update status also when not in verbose mode - [@rogerluan]

# 10.6.2

- Added Codemagic.io as a supported CI - [@fbartho]
- Switched Danger's default branch to be 'main' from 'master' - [@orta]
- Added GitLab Approvals to the DSL: `gitlab.approvals` - kelvin-lemon

# 10.6.1

- Better detection of using the github actions bot for comment deletion - [@orta]

# 10.6.0

- Bitbucket Cloud: Add markdown emoji instead of unicode - [@JanStevens]
- Add `DANGER_DISABLE_TSC` environment variable to disable transpiling with tsc, providing a way to force transpiling
  with Babel - [@ozzieorca]
- Adds options `--newComment` and `--removePreviousComments` - [@davidhouweling]
- Add support for a file path filter when calculation lines of code - [@melvinvermeer]

# 10.5.4

- Fix for `danger local` not passing through `--staging` - [@g3offrey]

# 10.5.3

- Fix for `danger local` not showing commit messages - [@hmschreiner]

# 10.5.2

- Adds `danger.git.head` and `danger.git.base` - [@jamiebuilds]

# 10.5.1

- Bitbucket Cloud: Fix bug when Danger updating inline comment with summary comment. - [@hellocore]
- Fall back to alternative methods for establishing the PR number from CodeBuild - [@alexandermendes]

# 10.5.0

- Handle deprecations for the APIs used with `--use-github-checks` #1073 [@wardpeet](https://github.com/wardpeet)

# 10.4.1

- Improved `tsconfig.json` file lookup strategy: it now looks for it starting from the location of the danger file.
  #1068 [@igorbek](https://github.com/igorbek)
- Upgrade node-fetch to 2.6.1 to fix GHSA-w7rc-rwvf-8q5r. #1071 [@hmcc](https://github.com/hmcc)

# 10.4.0

- Adds aliases to the FakeCI env vars. You could now have something like:
  ```yml
  - run: "npx danger-ts ci"
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      DANGER_MANUAL_CI: true
      DANGER_MANUAL_GH_REPO: ${{ steps.pr_info.outputs.repo }}
      DANGER_MANUAL_PR: ${{ steps.pr_info.outputs.number }}
  ```
  Which looks more intentional instead of: `DANGER_FAKE_CI` etc. [@orta](https://github.com/orta)

# 10.3.1

- Experimental support for internal routing when using `npx danger-ts` [@orta]

# 10.3.0

- Added a CLI option `--ignoreOutOfDiffComments` so that you can ignore inline-comments for lines that were not changed
  in the checked PR. The comments would be ignored completely - they won't even show in the results comment. [@pinkasey]

# 10.2.2

- Add support for `danger local` on repos without a master branch - [@ahobson](https://github.com/ahobson)

# 10.2.1

- Wait for close event on spawned process in local git platform - [@gzaripov]
- Fix Typo in README.md [@NotMoni]
- Fix danger failure on getting diff for files with spaces in file path [@HonzaMac]
- Document how to disable transpilation [@rzgry]
- Fix get blob url for pr commit [@doniyor2109]

# 10.2.0

- Take commit hash from CircleCI environment variable [@valscion]
- Fix project path with /- in GitLab MR URL [@pgoudreau]
- When creating a new PR with `createOrUpdatePR`, add the description (as done when editing) - [@sogame]

# 10.1.0

- Adds support for Bamboo CI [@tim3trick]
- Replace regex to a long url repos approach on Bitrise [@lucasmpaim]
- Pass process arguments back to the original process [@f-meloni]
- When fetching existing labels in `createOrAddLabel` use pagination to fetch them all - [@sogame]

# 10.0.0

- Changed JSON patch implementation for better memory performance. [@dkundel]

  **Breaking:** `JSONPatchForFile` will return a different order of operations than previously. It will also return a
  `path` with the index of the element inserted into an array for `add` operations.

# 9.3.1

- Don't fail when using `createOrAddLabel` if label fails to be created or added - [@sogame]

# 9.3.0

- Add the staged flag to `danger local` command - [@soyn]
- Don't use hardcoded userId to update comments if using personal token in Github Actions - [@rohit-gohri]
- Disable warning in Github Action if using DANGER_GITHUB_API_TOKEN - [@rohit-gohri]
- Update `parse-diff` library - [@417-72KI]
- Fix repository slug in Jenkins provider - [sandratatarevicova]
- Add Gitlab diff support - [@rohit-gohri]
- Fix Typos across danger-js Repo - [@yohix]
- Fix `@octokit/rest` deprecation warning when using `.issues.addLabels()` - [@sogame]

# 9.2.10

- Fixes for the homebrew generated binaries - [@hellocore]

# 9.2.9

- Bitbucket Cloud: Allow DangerCI to get UUID from Bitbucket - [@hellocore]
- Update docs for GitLab - [@orta]

# 9.2.7-8-9

- Maybe fix deploys to GPR for Docker - [@orta]

# 9.2.6

- Add support for Cirrus CI - [@RDIL]

# 9.2.5

- Remove additional danger from pr generated json - [@f-meloni]

# 9.2.4

- Fix github actions checks - [@f-meloni]

# 9.2.3

- Support more events on GitHub actions - [@f-meloni]

# 9.2.2

- Fix binary files for BitBucket Server - [@osmestad]
- Allow GHE to use checks - [@adam-bratin]

# 9.2.1

- Fix structuredDiffForFile for BitBucket Server - [@osmestad]
- Fix Buddy.works isPR and use PR number instead of PR ID - [@mmiszy]
- remove jsome package and replace with prettyjson - [@watchinharrison]
- Add GitLab support to Jenkins provider - [@sandratatarevicova]

# 9.2.0

- Add Buddy.works Pipelines support - [@kristof0425]
- Added flag to bypass Jira/Issues - [@orieken]
- Improve docs for GitHub Actions - [@nguyenhuy]

# 9.1.8

- Get GitHub Actions event file pathname from env variable - [@IljaDaderko]

# 9.1.7

- GitHub Actions docs update - [@orta]

# 9.1.6

- Release only made for GitHub Actions - [@orta]

# 9.1.5

- Take commit hash from bitrise env - [@f-meloni]

# 9.1.4

- Use new env `BITBUCKET_REPO_FULL_NAME` in bitbucket pipeline. - [@Soyn]
- Take commit hash from CI Source if available - [@f-meloni]

# 9.1.3

- Updates GitLab API to 10.x - [@awgeorge]

# 9.1.2

- Add retry handling for API requests - [@jtreanor]

# 9.1.1

- Fixes TS declarations - [@orta]
- Fix Github Actions documentation - [@ravanscafi]
- Improve Performance by Caching BitBucket Cloud Commits - [@hellocore]
- Add compliment message to comment template on Bitbucket Cloud - [@hellocore]
- Add option to set custom icon in messages - [@rohit-gohri]

# 9.1.0

- Expose BitBucketServerAPI - [@NMinhNguyen]

# 9.0.3

- Add support OAuth for BitBucket Cloud - [@hellocore]
- Allow `handleResults` to be called without a `git` object - [@jtreanor]

# 9.0.2

- Fix for the GitLab dependency making danger not load - [@f-meloni]

# 9.0.1

- Fixed incorrect main comment template on Bitbucket Cloud - [@hellocore]

# 9.0.0

- Add BitBucket Cloud & BitBucket Pipelines support - [@hellocore]
- Add GitLab missing states - [@f-meloni]
- Fixes incorrect slug for builds from forks on Codefresh - [@stevenp]

# 8.0.0

- Adds GitLab & GitLab CI support - [@notjosh], [@bigkraig], [@jamime]
- Add support for AppCenter - [@mrndjo]

# 7.1.4

- Un-hardcodes the repo in `danger.github.utils.createOrUpdatePR`- [@ds300]

# 7.1.3

- Cleans up the declarations a little bit - [@orta]
- Adds support for [Codefresh CI](https://codefresh.io) - [@stevenp]

# 7.1.2

- Update ts-jest to 24.0.2 - [@friederbluemle]
- Adds a fix for the default name of Danger in status - [@orta]
- Adds `danger.git.fileMatch.getKeyedPaths()`, providing more convenient access to paths. This replaces
  `fileMatch.tap()` and `fileMatch.debug()`.

  ```ts
  const components = fileMatch("components/**/*.js", "!**/*.test.js")
  const componentTests = fileMatch("!**/*.test.js")

  if (components.edited && !componentTests.edited) {
    warn(
      [
        "This PR modified some components but none of their tests. <br>",
        "That's okay so long as it's refactoring existing code. <br>",
        "Affected files: ",
        components.getKeyedPaths().edited.join(", "),
      ].join("")
    )
  }
  ```

  This makes it much simpler to compose a collection of file checks - [@paulmelnikow]

# 7.1.0

- Adds Chainsmoker, and expands the Danger DSL with the addition of `danger.git.fileMatch`.

  ```ts
  const documentation = danger.git.fileMatch("**/*.md")
  const packageJson = danger.git.fileMatch("package.json")
  const lockfile = danger.git.fileMatch("yarn.lock", "package-lock.json")

  if (documentation.edited) {
    message("Thanks - We :heart: our [documentarians](http://www.writethedocs.org/)!")
  }

  if (packageJson.modified && !lockfile.modified) {
    warn("This PR modified package.json, but not the lockfile")
  }
  ```

  This makes it much simpler to compose a collection of file checks - [@paulmelnikow]

# 7.0.19

- Taken a stab at trying to make the commit status summary to feel better in both Danger & Peril [@orta][@dblandin]

# 7.0.18

- Adds a CLI option `--failOnErrors` so that you can force `danger ci` to return a failed exit code on any `fail`s in a
  Dangerfile [@f-meloni]

# 7.0.17

- Send different build update keys based on the id on Bitbucket [@f-meloni]

# 7.0.16

- Add support for CodeBuild CI source [@sharkysharks]

# 7.0.15

- Enable Danger runs with different DangerIDs to post separate statuses [@randak]
- Docs: fix typo - [@hiroppy]
- Fixed: isCI check for Codeship - [@msteward]

# 7.0.14

- Fixed: Crash on BitbucketServer when the change type is unknown - [@f-meloni]
- Add `linesOfCode` in `GitDSL` - [@ninjaprox]
- Docs: document GitHubMergeRef type - [@nornagon]

# 7.0.13

- Adds some Debug logs for babel transformation - [@orta]

# 7.0.12

- Support multi-line import/require statements in Dangerfiles & possibly fix source-mapping for errors - [@fbartho]

# 7.0.11

- Return the DangerResults meta after sorting and merging operations - [@f-meloni]
- Make bitbucket generated signature less aggressive - [@f-meloni]

# 7.0.9

- Updates the import for octokit at the top of the danger.d.ts - [@orta]

# 7.0.8

- Handles the previews API correctly - [@orta]

# 7.0.7

- Removed `vm2` from Danger, it's not being used in Peril now - [@orta]
- `danger pr` with `--json` or --js` now don't require a Dangerfile to be present - [@orta]

# 7.0.5

- Remove dead links to example danger files. - [@stevemoser]
- Allow danger-pr to work also on Bitbucket Server - [@f-meloni]
- Fix for nulls in modified_files - [@orta]
- Use new APIs in OctoKit - [@orta]

# 7.0.4

- More fixes for `GITHUB_URL` instead of just `DANGER_GITHUB_URL` for GitHub Enterprise. - [@Aghassi]

# 7.0.3

- Lets you use `GITHUB_URL` instead of just `DANGER_GITHUB_URL` for GitHub Enterprise. - [@Aghassi]

# 7.0.2

- Fix issue where the PR command could not be run with a GitHub Enterprise URL.
- Specify filename when loading Babel options. Fixes [#664](https://github.com/danger/danger-js/issues/664)
  ([#804](https://github.com/danger/danger-js/pull/804)) - [@NMinhNguyen]
- Running Danger on GitHub Actions now runs Danger from source code. Before that, Danger on GitHub Actions is stuck at
  v5.0.0-beta-24. [@dtinth](https://github.com/danger/danger-js/pull/810)

# 7.0.1

- Make use of GitHub Checks optional and disabled by default, pass `--use-github-checks` to enable.
  [@cysp](https://github.com/danger/danger-js/pull/798)

# 7.0.0

- Updates `@octokit/rest` to v16.x.x - this is a **major** semver change on their end, which I know it breaks some of
  Artsy/Danger's Peril Dangerfiles, so it's possible that it could break your Dangerfiles too. How do you know?

  Roughly, if you have any code that uses `danger.github.api` then it's very possible that you need to update your code.

  There are update notes [here](https://github.com/octokit/rest.js/releases/tag/v16.0.1), but if you're using TypeScript
  then it'll raise the issues at a type-check level. Note, that this version may cause issues if you are using GitHub
  Enterprise, you can get [updates here](https://github.com/danger/danger-js/issues/797).

# 6.1.13

- Allow sub-processes to pass their own name an href so that it doesn't say made by Danger JS [@orta]

  This is done by extending the `DangerResults` object passed back to Danger JS, by adding a meta section to the JSON:

  ```json
  {
    "markdowns": [],
    "fails": [],
    "warnings": [],
    "messages": [],
    "meta": {
      "runtimeHref": "https://mysite.com",
      "runtimeName": "My Danger Runner"
    }
  }
  ```

  `"meta"` is optional, and will fall back to the DangerJS one.

- Removed a dependency (voca) now that we're using TypeScript and have access to .includes [@orta]

# 6.1.12

- Fix issue with detecting Babel if `babel-core` is installed - [@sajjadzamani]

# 6.2.0

- Fix detection of GitHub Actions event types [@cysp]

# 6.1.9

- Add commit ID to the comment footer [danger/danger-js#168] - [@randak]
- Add support for `COPY` change type to fix a BitBucket Server regression in
  [danger/danger-js#764](https://github.com/danger/danger-js/pull/764) - [@sebinsua]
- Add support for older Babel versions (prior 7) [@sajjadzamani]

# 6.1.8

- Revert removal of implicit `<p>` tag from [danger/danger-js#754](https://github.com/danger/danger-js/pull/754) and add
  distinction depending on containing markdown or not - [@hanneskaeufler]

# 6.1.7

- Update comment instead deleting, if it has replies (BitBucket Server) [@langovoi]
- Fix BitBucket Server GitDSL [@langovoi]
- Add support of paged APIs of BitBucket Server [@langovoi]

# 6.1.6

- Adds a CLI flag for custom Danger Runners to be able to request a URL to a JSON file instead of receiving the entire
  DSL as a big JSON dump. We're exploring using this in Danger Swift with
  [danger/swift#108](https://github.com/danger/swift/issues/108) - [@orta]

# 6.1.5

- Adds `html_url` to the PR JSON declaration - [@orta]
- Adds a way for a sub-process to tell danger-js that it wants a copy of the DSL. This is a potential fix for when you
  have a process that might not be ready to grab the DSL instantly from danger-js. The subprocess can print the message
  `danger://send-dsl` to stdout and danger-js will re-send the DSL via STDIN.
  [danger/swift#108](https://github.com/danger/swift/issues/108). - [@orta]
- Allows a FakeCI to get a FakePlatform, should fix [#767](https://github.com/danger/danger-js/issues/767) - [@orta]

# 6.1.4

- Fix `GitJSONDSL` and `diffForFile` for BitBucket Server - [@langovoi]

# 6.1.3

- Add support for personal tokens of BitBucket Server - [@langovoi]
- Ships a command `danger-js` which means other languages could also use the command danger and they won't conflict with
  the JS version - [@orta]

# 6.1.2

- Checks for the JSON results file reported by a subprocess before accessing it - [@orta]

# 6.1.1

- Improves debug logging, messaging on CI about status updates - [@orta]
- Better detection of json results: {} from a sub-process - [@orta]
- CLI Args are actually passed to subprocess instead of an empty object - [@orta]
- Fix Netlify integration when repo url includes an access token - [@imorente]

# 6.1.0

- Add CI integration for Netlify - [@imorente]

# 6.0.7

- Removes an accidental import - [@orta]

# 6.0.6

- Adds an internal flag for disabling checks support when being controller by Peril - [@orta]

# 6.0.5

- Fix `danger pr` - [@orta]

# 6.0.4

- Fix GitHub checks API payload - [@pveyes]

# 6.0.3

- Fix passing stdout from the sub-process back to the user - [@orta]
- Fix handling a `"pending"` status update properly using Bitbucket API - [@sgtcoolguy]
- Fix #614 - Posting status updates to Github using issue workflow broken - [@sgtcoolguy]
- Fix vertical alignment in GitHub issue template - [@patrickkempff]

# 5.0.1, err. 6.0.0

- Hah, my computer ran out opf power mid-deploy, and now I have to ship another build to make sure the brew versions of
  Danger JS are set up correctly. - orta

- Hah, I managed to run the same 'deploy major' command instead. So... Happy v6! - orta

# 5.0.0

_No breaking changes_ - I'm just bumping it because it's a lot of under-the-hood work, and I've not been able to test it
thoroughly in production.

This release bring support for GitHub actions. It does this merging in some of the responsibilities that used to live
inside Peril into Danger.

Notes about Danger JS:

- Adds support for running remote GitHub files via the `--dangerfile` argument. It supports urls like:
  `orta/peril-settings/file.ts` which grabs `file.ts` from `orta/peril-settings`.
- Adds support for taking a GitHub Actions event JSON and exposing it in the `default export` function in the same way
  that Peril does it.
- Adds a GitHubActions CI provider - it declares that it can skip the PR DSL so that Danger can also run against
  issues/other events
- Handle remote transpilation of the initial Dangerfile correctly
- Adds support for not include a tsconfig for typescript projects, danger will use the default config if it can't find
  one in your project
- Hardcodes the GitHub Actions userID into danger ( blocked by
  https://platform.github.community/t/obtaining-the-id-of-the-bot-user/2076 )
- Allows running with a simplified DSL when running on a GitHub action that isn't a PR
- Use new env vars for GitHub Actions

There is now 2 ways for a subprocess to communicate to Danger JS - prior to 5.x it was expected that a subprocess would
pass the entire JSON results back via STDOUT to the host Danger JS process, but sometimes this was unreliable. Now a
subprocess can pass a JSON URL for Danger JS by looking in STDOUT for the regex `/danger-results:\/\/*.+json/`.

There is now a JSON schema for both directions of the communication for sub-processes:

- The data Danger sends to the subprocess:
  [`source/danger-incoming-process-schema.json`](source/danger-incoming-process-schema.json)
- The data Danger expects from the subprocess:
  [`source/danger-outgoing-process-schema.json`](source/danger-outgoing-process-schema.json)

This can be used for language DSL generation and/or formal verification if you're interested. Or, for just feeling
completely sure about what is being sent to your process without diving into the Danger JS codebase.

Also, `danger pr` now accepts a `--process` arg.

# 4.4.9

- Add logic for "DANGER_DISABLE_TRANSPILATION" env [@markelog]
- Jenkins: Respect `CHANGE_URL`/`CHANGE_ID` for GitHub and BitBucket Server [@azz]
- Docs: Guides - Update link to apollo-client dangerfile.ts example [@andykenward]
- Fix crash that may occur when no message is set on generic event [@flovilmart]
- Add support to proxy requests using `HTTP_PROXY` or `HTTPS_PROXY` environment variables [@steprescott]

# 4.4.0-7

- Supports installation using Homebrew [@thii]

# 4.3.x

- Some experimental beta builds which didn't turn out very useful

# 4.2.1

- Adds a fallback to `GITHUB_TOKEN` if it's in the ENV - orta
- There was some versioning faffing going on

# 4.1.0

- Adds the ability to send a PR from a Dangerfile easily.

  ```ts
  import { danger } from "danger"

  export default async () => {
    // This is a map of file to contents for things to change in the PR
    const welcomePR = {
      LICENSE: "[the MIT license]",
      "README.md": "[The README content]",
    }

    // Creates a new branch called `welcome`, from `master`. Creates a commit with
    // the changes above and the message "Sets up ...". Then sends a PR to `orta/new-repo`
    // with the title "Welcome to ..." and the body "Here is ...".
    await danger.github.utils.createOrUpdatePR(
      {
        title: "Welcome to [org]",
        body: "Here is your new repo template files",
        owner: "orta",
        repo: "new-repo",
        baseBranch: "main",
        newBranchName: "welcome",
        commitMessage: "Sets up the welcome package",
      },
      welcomePR
    )
  }
  ```

  OK, so this one is cool. This function will create/update an existing PR. You pass in a config object that defines;
  the commit, the branch and the PR metadata and then this function will go and set all that up for you.

  The second argument is a fileMap, this is an object like `{ "README.md": "[the content]" }` and it defines what files
  should change in the commit. The files are completely changed to the content in the fileMap, so if you're making a
  single line change - you need to submit the enfile file.

  This is all based on my module
  [memfs-or-file-map-to-github-branch](https://www.npmjs.com/package/memfs-or-file-map-to-github-branch) so if you need
  a set of lower level APIs for PR/branch needs, `import` that and use it. - [@orta]

# 4.0.1

- Fixed a bug where Danger would fail to update status when there are no failures or messages [@johansteffner]
- Fixed a bug where Danger was throwing an error when removing any existing messages [@stefanbuck]

# 4.0.0

- Updates Danger's runtime to work with Babel 7 - [@adamnoakes]

  **Breaking:** 3.9.0 was the last version to support inline transpilation via Babel 6. Danger doesn't specify babel in
  its dependencies, so this warning won't show anywhere else.

# 3.9.0

- Adds CI integration for Concourse - [@cwright017]

# 3.8.9

- Adds debug logs to the vm2 runner used in Peril - [@orta]

# 3.8.5 - 3.8.8

- Adds a function to handle creating or adding a label on a PR/Issue. Works with both Danger and Peril:
  `danger.github.createOrAddLabel` - [@orta]

# 3.8.4

- Exposes some internals on module resolution to Peril - [@orta]

# 3.8.3

- Fix bitbucket error when trying to obtain a response json when the response code is 204 (which means that there is no
  response).
- Fix bitbucket link of the PR status, so it opens the web version of the PR, pointing to the Danger comment
  [646](https://github.com/danger/danger-js/pull/646) - [@acecilia](https://github.com/acecilia)
- Adapt emoji for Bitbucket server to fix "Database error has occurred"
  [645](https://github.com/danger/danger-js/pull/645) - [@acecilia](https://github.com/acecilia)

# 3.8.2

- Use the Peril Bot ID for the comment lookup checks - [@orta]

# 3.8.1

- Adds additional logging to handleResultsPostingToPlatform - [@ashfurrow]

# 3.8.0

- Fixes a crash if lodash isn't a transitive dependency in your node_modules - [@orta]
- Using the Checks API will now post a summary comment on a PR - [@orta]

# 3.7.20

- Logging / verification improvements for the subprocess - [@orta]

# 3.7.19

- Convert the `exec` in `danger local` to a `spawn` hopefully unblocking large diffs from going through it -
  [@joshacheson][@orta]

# 3.7.18

- Report the error in a commit status update when in verbose - [@orta]

# 3.7.17

- Improvements to PR detection on Team City - @markelog

# 3.7.16

- More work on `danger.github.utils.createUpdatedIssueWithID`. - [@orta]

# 3.7.15

- Turns on the strict mode in the typescript compiler, this only gave build errors, so I was basically there anyway.
  This is so that the type defs will always pass inside environments where strict is already enabled. - [@orta]

- Updates to TypeScript 2.9. - [@orta]

# 3.7.14

- Minor refactoring in GitHubUtils to allow Peril to re-create some of the util functions - [@orta]

# 3.7.13

- Updates type declarations to use top-level exports instead of a module augmentation - [@DanielRosenwasser]
- Bug fixes for `danger.github.utils.createUpdatedIssueWithID` - [@orta]

# 3.7.2-12

- Improved debugging when using the GitHub OctoKit - [@orta]
- Added `danger.github.utils.createUpdatedIssueWithID` which can be used to have danger continually update a single
  issue in a repo, for example:

  ```ts
  await danger.github.utils.createUpdatedIssueWithID("TestID", "Hello World", {
    title: "My First Issue",
    open: true,
    repo: "sandbox",
    owner: "PerilTest",
  })
  ```

  Will first create, then update that issue with a new body. - [@orta]

# 3.7.1

- Improve checks support for Danger - orta

# 3.7.0

- Adds support for the GH Checks API.

  This brings some interesting architectural changes inside Danger, but more important to you dear reader, is that using
  the Checks API has some API restrictions. This makes in infeasible to re-use the user access token which we've
  previously been recommending for setup.

  Instead there are two options:

  - Use a GitHub app owned by Danger: https://github.com/apps/danger-js
  - Use your own GitHub app.

  The security model of the GitHub app means it's totally safe to use our GitHub app, it can only read/write to checks
  and has no access to code or organizational data. It's arguably safer than the previous issue-based comment.

  To use it, you need to hit the above link, install the app on the org of your choice and then get the install ID from
  the URL you're redirected to. Set that in your CI's ENV to be `DANGER_JS_APP_INSTALL_ID` and you're good to go.

  If you want to run your own GitHub App, you'll need to set up a few ENV vars instead:

  - `DANGER_GITHUB_APP_ID` - The app id, you can get this from your app's overview page at the bottom
  - `DANGER_GITHUB_APP_PRIVATE_SIGNING_KEY` - The whole of the private key as a string with `\n` instead of newlines
  - `DANGER_GITHUB_APP_INSTALL_ID` - The installation id after you've installed your app on an org

  Checks support is still a bit of a WIP, because it's a whole new type of thing. I don't forsee a need for Danger to be
  deprecating the issue based commenting (we use that same infra with bitbucket).

  So now there are three ways to set up communications with GitHub, I'm not looking forwards to documenting that.

  [@orta]

- JSON diffs use the JSON5 parser, so can now ignore comments in JSON etc [@orta]
- Allows the synchronous execution of multiple dangerfiles in one single "danger run".

  Not a particularly useful feature for Danger-JS, but it means Peril can combine many runs into a single execution
  unit. This means people only get 1 message. [@orta]

# 3.6.6

- Updates vm2 to be an npm published version [@orta]

# 3.6.5

- Fix setting the status url on bitbucket [@orta]
- Adds more logs to `danger process` [@orta]

# 3.6.4

- Fix running Danger on issues with no comments for real [@mxstbr]

# 3.6.3

- Fix running Danger on issues with no comments [@mxstbr]

# 3.6.2

- Automatically rate limit concurrent GitHub API calls to avoid hitting GitHub rate limits [@mxstbr]

# 3.6.1

- Catch the github api error thrown from @octokit/rest [@Teamop]
- Replace preview media type of github pull request reviews api [@Teamop]
- Add support for [Screwdriver CI](http://screwdriver.cd) [@dbgrandi]

# 3.6.0

- A Dangerfile can return a default export, and then Danger will handle the execution of that code [@orta]
- Changes the order of the text output in verbose, or when STDOUT is the only option [@orta]
- Prints a link to the comment in the build log [@orta]

## 3.5.0 - 3.5.1

- Fixed a bug where Danger posts empty main comment when it have one or more inline comments to post [@codestergit]
- fix bug when commiting .png files on BitBucket [@Mifi]
- Adds support for inline comments for bitbucket server. [@codestergit]

## 3.4.7

- Update dependencies [@orta]

## 3.4.6

- Fixed Babel 7 breaking due to invalid sourceFileName configuration [@kesne]

## 3.4.5

- Don't print error for commit status when there was no error [@sunshinejr]

## 3.4.4

- Fixed a bug where Danger would get access to _all_ inline comments, thus deleting comments posted by other people
  [@sunshinejr]

## 3.4.3

- Fixed a bug where updating multiple inline comments caused a Javascript error [@sunshinejr]

## 3.4.2

- Improving reporting when multiple violations are o nthe same line of a file [@sunshinejr]

## 3.4.1

- Protection against nulls in the inline comment data [@orta]

## 3.4.0

- Adds support for inline comments when using GitHub.

  This is one of those "massive under the hood" changes, that has a tiny user DSL surface. From this point onwards
  `fail`, `warn`, `message` and `markdown` all take an extra two optional params: `file?: string` and `line?: number`.

  Adding `file` and `line` to the call of any exported communication function will trigger one of two things:

  - Danger will create a new comment inline inside your PR with your warning/message/fail/markdown
  - Danger will append a in the main Danger comment with your warning/message/fail/markdown

  Inline messages are edited/created/deleted with each subsequent run of `danger ci` in the same way the main comment
  does. This is really useful for: linters, test runners and basically anything that relies on the contents of a file
  itself.

  If you're using `danger process` to communicate with an external process, you can return JSON like:

  ```json
  {
    "markdowns": [
      {
        "file": "package.swift",
        "line": 3,
        "message": "Needs more base"
      }
    ]
    // [...]
  }
  ```

  -- [@sunshinejr]

- Adds a data validation step when Danger gets results back from a process . [@orta]

## 3.3.2

- Adds support for TeamCity as a CI provider. [@fwal]

## 3.3.1

- Fixed Babel 7 breaking because of sourceFileName being defined wrong. [@happylinks]

## 3.3.0

- Fix `committer` field issue - missing in Stash API by using commit author instead. [@zdenektopic]
- Adds a new command: `reset-status`

  This command is for setting the CI build status in advance of running Danger. If your Danger build relies on running
  tests/linters, then you might want to set the PR status (the red/green/yellow dots) to pending at the start of your
  build. You can do this by running `yarn danger reset-status`.

  [@mxstbr]

## 3.2.0

- Add BitBucket Server support.

  To use Danger JS with BitBucket Server: you'll need to create a new account for Danger to use, then set the following
  environment variables on your CI:

  - `DANGER_BITBUCKETSERVER_HOST` = The root URL for your server, e.g. `https://bitbucket.mycompany.com`.
  - `DANGER_BITBUCKETSERVER_USERNAME` = The username for the account used to comment.
  - `DANGER_BITBUCKETSERVER_PASSWORD` = The password for the account used to comment.

  Then you will have a fully fleshed out `danger.bitbucket_server` object in your Dangerfile to work with, for example:

  ```ts
  import { danger, warn } from "danger"

  if (danger.bitbucket_server.pr.title.includes("WIP")) {
    warn("PR is considered WIP")
  }
  ```

  The DSL is fully fleshed out, you can see all the details inside the [Danger JS Reference][ref], but the summary is:

  ```ts
  danger.bitbucket_server.
    /** The pull request and repository metadata */
    metadata: RepoMetaData
    /** The related JIRA issues */
    issues: JIRAIssue[]
    /** The PR metadata */
    pr: BitBucketServerPRDSL
    /** The commits associated with the pull request */
    commits: BitBucketServerCommit[]
    /** The comments on the pull request */
    comments: BitBucketServerPRActivity[]
    /** The activities such as OPENING, CLOSING, MERGING or UPDATING a pull request */
    activities: BitBucketServerPRActivity[]
  ```

  You can see more in the docs for [Danger + BitBucket Server](http://danger.systems/js/usage/bitbucket_server.html).

  -- [@azz]

- Don't check for same user ID on comment when running as a GitHub App. [@tibdex]

## 3.1.8

- Improvements to the Flow definition file. [@orta]
- Improve path generator for danger-runner. [@Mifi]
- Update the PR DSL to include bots. [@orta]
- Add utility function to build tables in Markdown [@keplersj]

## 3.1.7

- Minor error reporting improvements. [@orta]

## 3.1.6

- Move more code to only live inside functions. [@orta]

## 3.1.5

- Fix --base options for danger local. [@peterjgrainger]
- Fix a minor typo in Semaphore CI setup. [@hongrich]
- Fix for capitalized Dangerfiles in CI environment. [@wizardishungry]
- Fix `danger local` crashing when comparing master to HEAD with no changes. [@orta]

## 3.1.4

- Register danger-runner as a package binary. [@urkle]

## 3.1.2-3.1.3

- Peril typings to the Danger DSL. [@orta]
- Reference docs updates for the website. [@orta]

## 3.1.1

- Allows `danger runner` (the hidden command which runs the process) to accept unknown command flags (such as ones
  passed to it via `danger local`.) - [@adam-moss]/[@orta]

## 3.1.0

- Adds a new command `danger local`.

  This command will look between the current branch and master and use that to evaluate a dangerfile. This is aimed
  specifically at tools like git commit hooks, and for people who don't do code review.

  `danger.github` will be falsy in this context, so you could share a dangerfile between `danger local` and `danger ci`.

  When I thought about how to use it on Danger JS, I opted to make another Dangerfile and import it at the end of the
  main Dangerfile. This new Dangerfile only contains rules which can run with just `danger.git`, e.g. CHANGELOG/README
  checks. I called it `dangerfile.lite.ts`.

  Our setup looks like:

  ```json
  "scripts": {
    "prepush": "yarn build; yarn danger:prepush",
    "danger:prepush": "yarn danger local --dangerfile dangerfile.lite.ts"
    // [...]
  ```

You'll need to have [husky](https://www.npmjs.com/package/husky) installed for this to work. - [@orta]

- STDOUT formatting has been improved, which is the terminal only version of Danger's typical GitHub comment style
  system. It's used in `danger pr`, `danger ci --stdout` and `danger local`. - [@orta]
- Exposed a get file contents for the platform abstraction so that Peril can work on many platforms in the future -
  [@orta]

### 3.0.5

- Added support for Bitrise as a CI Provider - [@tychota]
- Nevercode ENV var fixes - [@fbartho]

### 3.0.4

- Paginate for issues - [@orta]

### 3.0.3

- Added support for Nevercode.io as a CI Provider - [@fbartho]

### 3.0.2

- Don't log ENV vars during a run - thanks @samdmarshall. - [@orta]

### 3.0.1

- Bug fixes and debug improvements. If you're interested run danger with `DEBUG="*" yarn danger [etc]` and you'll get a
  _lot_ of output. This should make it much easier to understand what's going on. - [@orta]

### 3.0.0

- Updates to the CLI user interface. Breaking changes for everyone.

  **TLDR** - change `yarn danger` to `yarn danger ci`.

  Danger JS has been fighting an uphill battle for a while with respects to CLI naming, and duplication of work. So, now
  it's been simplified. There are four user facing commands:

  - `danger init` - Helps you get started with Danger
  - `danger ci` - Runs Danger on CI
  - `danger process` - Like `ci` but lets another process handle evaluating a Dangerfile
  - `danger pr` - Runs your local Dangerfile against an existing GitHub PR. Will not post on the PR

  This release deprecates running `danger` on it's own, so if you have `yarn danger` then move that be `yarn danger ci`.

  Each command name is now much more obvious in it intentions, I've heard many times that people aren't sure what
  commands do and it's _is_ still even worse in Danger ruby. I figure now is as good a time as any a good time to call
  it a clean slate.

  On a positive note, I gave all of the help screens an update and tried to improve language where I could.

* [@orta]

### 2.1.9-10

- Fix to `danger pr` and `danger` infinite looping - [@orta]

### 2.1.8

- Add a note in `danger pr` if you don't have a token set up - [@orta]
- Bunch of docs updates - [@orta]

### 2.1.7

- Fix Codeship integration - [@caffodian]
- Updates documentation dependencies - [@orta]
- Fixes to running `danger` with params - [@orta]
- Fixes for `danger pr` not acting like `danger` WRT async code - [@orta]
- Fixes `tsconfig.json` parse to be JSON5 friendly - [@gantman]
- Fixes for `danger.github.thisPR` to use the base metadata for a PR, I'm too used to branch workflows - [@orta]

### 2.1.6

- Updates dependencies - [@orta]
- Link to the build URL if Danger can find it in the CI env - [@orta]
- Removes the "couldn't post a status" message - [@orta]

### 2.1.5

- The TS compiler will force a module type of commonjs when transpiling the Dangerfile - [@orta]

### 2.1.4

- Adds a CLI option for a unique Danger ID per run to `danger` and `danger process`, so you can have multiple Danger
  comments on the same PR. - [@orta]

### 2.1.1 - 2.1.2 - 2.1.3

- Fixes/Improvements for `danger init` - [@orta]

### 2.1.0

- Adds a new command for getting set up: `danger init` - [@orta]
- Fix double negative in documentation. [@dfalling]
- Fix `gloabally` typo in documentation. [@dfalling]

### 2.0.2 - 2.0.3

- Adds a warning when you try to import Danger when you're not in a Dangerfile - [@orta]
- Exports the current process env to the `danger run` subprocess - [@orta]

### 2.0.1

- Potential fixes for CLI sub-commands not running when packaging danger - [@orta]

### 2.0.0

- Fixes the `danger.js.flow` fix to handle exports correctly, you _probably_ need to add
  `.*/node_modules/danger/distribution/danger.js.flow` to the `[libs]` section of your settings for it to work though -
  [@orta]

### 2.0.0-beta.2

- Fixes a bug with `danger.github.utils` in that it didn't work as of b1, and now it does :+1: - [@orta]
- Ships a `danger.js.flow` in the root of the project, this may be enough to support flow typing, thanks to [@joarwilk]
  and [flowgen](https://github.com/joarwilk/flowgen) - [@orta]

### 2.0.0-beta.1

- Converts the command `danger` (and `danger run`) to use `danger process` under the hood. What does this do?

  - Dangerfile evaluation is in a separate process, run without a vm sandbox. This fixes the async problem which we
    created `schedule` for. Previously, any async work in your Dangerfile needed to be declared to Danger so that it
    knew when all of the work had finished. Now that the running happens inside another process, we can use the
    `on_exit` calls of the process to know that all work is done. So, _in Danger_ (not in Peril) async code will work
    just like inside a traditional node app.

  - Makes `danger process` a first class citizen. This is awesome because there will be reliable support for other
    languages like [danger-swift], [danger-go] and more to come.

  - The `danger process` system is now codified in types, so it's really easy to document on the website.

- Adds a `--js` and `--json` option to `danger pr` which shows the output in a way that works with `danger process`.
  This means you can preview the data for any pull request.

./[@orta]

### 2.0.0-alpha.20

Moves away from vm2 to a require-based Dangerfile runner. This removes the sandboxing aspect of the Dangerfile
completely, but the sandboxing was mainly for Peril and I have a plan for that.

https://github.com/danger/peril/issues/159

I would like to move the main parts of Danger JS to also work like `danger process`, so I'll be continuing to work as a
alpha for a bit more. One interesting side-effect of this could be that I can remove `schedule` from the DSL. I've not
tested it yet though. Turns out this change is _real_ hard to write tests for. I've made #394 for that.

./[@orta]

### 2.0.0-alpha.18 - 19

- Moves internal methods away from Sync to avoid problems when running in Peril - [@ashfurrow]
- Passes through non-zero exit codes from `danger process` runs - [@ashfurrow]

### 2.0.0-alpha.17

- Improve CircleCI PR detection

### 2.0.0-alpha.16

Some UX fixes:

- Don't show warnings about not setting a commit status (unless in verbose) - [@orta]
- Delete duplicate Danger message, due to fast Peril edits - [@orta]
- Show Peril in the commit status if inside Peril, not just Danger - [@orta]
- [internal] Tightened the typings on the commands, and abstracted them to share some code - [@orta]

### 2.0.0-alpha.15

- Updates `diffForFile`, `JSONPatchForFile`, and `JSONDiffForFile` to include created and removed files - #368 -
  [@bdotdub]

### 2.0.0-alpha.14

- Adds a blank project generated in travis 8 to test no-babel or TS integration - [@orta]
- Improvements to `danger process` logging, and build fails correctly #363 - [@orta]

### 2.0.0-alpha.13

- Improve the error handling around the babel API - #357 - [@orta]
- Move back to the original URLs for diffs, instead of relying on PR metadata - [@orta]
- Updates the types for `schedule` to be more accepting of what it actually takes - [@orta]

### 2.0.0-alpha.12

- Fixed #348 invalid json response body error on generating a diff - felipesabino
- Potential fix for ^ that works with Peril also - [@orta]

### 2.0.0-alpha.11

- Doh, makes the `danger process` command actually available via the CLI - [@orta]

### 2.0.0-alpha.10

- Adds a `danger process` command, this command takes amn argument of a process to run which expects the Danger DSL as
  JSON in STDIN, and will post a DangerResults object to it's STDOUT. This frees up another process to do whatever they
  want. So, others can make their own Danger runner.

  An example of this is [Danger Swift][danger-swift]. It takes a [JSON][swift-json] document via [STDIN][swift-stdin],
  [compiles and evaluates][swift-eval] a [Swift file][swift-dangerfile] then passes the results back to `danger process`
  via [STDOUT][swift-stdout].

  Another example is this simple Ruby script:

  ```ruby
    #!/usr/bin/env ruby

  require 'json'
  dsl_json = STDIN.tty? ? 'Cannot read from STDIN' : $stdin.read
  danger = JSON.parse(dsl_json)
  results = { warnings: [], messages:[], fails: [], markdowns: [] }

  if danger.github.pr.body.include? "Hello world"
    results.messages << { message: "Hey there" }
  end

  require 'json'
  STDOUT.write(results.to_json)
  ```

  Which is basically Ruby Danger in ~10LOC. Lols.

  This is the first release of the command, it's pretty untested, but [it does work][swift-first-pr]. - [@orta]

[danger-swift]: https://github.com/danger/danger-swift
[swift-json]: https://github.com/danger/danger-swift/blob/master/fixtures/eidolon_609.json
[swift-stdin]:
  https://github.com/danger/danger-swift/blob/1576e336e41698861456533463c8821675427258/Sources/Runner/main.swift#L9-L11
[swift-eval]:
  https://github.com/danger/danger-swift/blob/1576e336e41698861456533463c8821675427258/Sources/Runner/main.swift#L23-L40
[swift-dangerfile]:
  https://github.com/danger/danger-swift/blob/1576e336e41698861456533463c8821675427258/Dangerfile.swift
[swift-stdout]:
  https://github.com/danger/danger-swift/blob/1576e336e41698861456533463c8821675427258/Sources/Runner/main.swift#L48-L50
[swift-first-pr]: https://github.com/danger/danger-swift/pull/12

### 2.0.0-alpha.9

- Uses the Babel 7 alpha for all source compilation with JS, Flow+JS and TS. This worked without any changes to our
  internal infra which is pretty awesome. All TS tests passed. Babel 7 is still in alpha, but so is Danger 2.0 - so I'm
  happy to keep Danger in a pretty long alpha, till at least Babel 7 is in beta.

  It also still supports using TypeScript via the "`typescript"` module, if you have that installed. - [@orta]

- `danger.github.thisPR` now uses the PR's head, not base - [@orta]

### 2.0.0-alpha.8

- Uses the GitHub `diff_url` instead of the `diff` version header, as it conflicted with Peril - [@orta]
- Handle exceptions in Dangerfile and report them as failures in Danger results - [@macklinu]

### 2.0.0-alpha.6-7

- Expose a Promise object to the external GitHub API - [@orta]

### 2.0.0-alpha.4-5

- Allow running a dangerfile entirely from memory using the `Executor` API - [@orta]

### 2.0.0-alpha.2-3

- Removes the `jest-*` dependencies - [@orta]

### 2.0.0-alpha.1

- Support [a vm2](https://github.com/patriksimek/vm2) based Dangerfile runner as an alternative to the jest
  infrastructure. There are a few main reasons for this:

  - I haven't been able to completely understand how Jest's internals work around all of the code-eval and pre-requisite
    setup, which has made it hard to work on some more complex Peril features.

  - Jest releases are every few months, personally I love this as a user of Jest, as an API consumer it can be difficult
    to get changes shipped.

  - The fact that both Danger/Jest make runtime changes means that you need to update them together

  - I have commit access to vm2, so getting changes done is easy

  I like to think of it as having gone from Jest's runner which is a massive toolbox, to vm2 which is a tiny toolbox
  where I'll have to add a bunch of new tools to get everything working.

  The _massive downside_ to this is that Danger now has to have support for transpiling via Babel, or from TypeScript
  unlike before, where it was a freebie inside Jest. Jest handled this so well. This means that a Dangerfile which used
  to "just work" with no config may not. Thus, IMO, this is a breaking major semver.

  Is it likely that you need to make any changes? So far, it seems probably not. At least all of the tests with
  Dangerfiles original from the older Jest runner pass with the new version.

  This is an alpha release, because it's knowingly shipped with some breakages around babel support, specifically:

  - Babel parsing of relative imports in a Dangerfile aren't working
  - Some of the features which require the `regeneratorRuntime` to be set up aren't working yet

  Those are blockers on a 2.0.0 release.

### 1.2.0

- Exposes an internal API for reading a file from a GitHub repo as `danger.github.utils.fileContents` - [@orta]

  Ideally this is what you should be using in plugins to read files, it's what Danger uses throughout the codebase
  internally. This means that your plugin/dangerfile doesn't need to rely on running on the CI when instead it could run
  via the GitHub API.

- Update prettier - [@orta]
- Removes dtslint as a dependency - sapegin/orta

### 1.1.0

- Support retrieve paginated pull request commit list - [@kwonoj]
- Add support for VSTS CI - [@mlabrum]
- Remove the DSL duplication on the `danger` export, it wasn't needed or used. - [@orta]
- Update to TypeScript 2.4.x - [@orta]
- Rename github test static_file to remove `:` from the filename to fix a checkout issue on windows - [@mlabrum]

### 1.0.0

Hello readers! This represents a general stability for Danger. It is mainly a documentation release, as it corresponds
to <http://danger.systems/js/> being generally available. I made the initial commit back in 20 Aug 2016 and now it's
30th June 2017. It's awesome to look back through the CHANGELOG and see how things have changed.

You can find out a lot more about the 1.0, and Danger's history on my
[Artsy blog post on the Danger 1.0](https://artsy.github.io/blog/2017/06/30/danger-one-oh-again/).

- Adds inline docs for all CI providers - [@orta]

### 0.21.1

- Use HTTP for the GitHub status check target URL - macklinu
- Correct some examples in node-app - clintam
- Add support for buddybuild CI - benkraus/clintam
- Add support for GithHub Apps API (no GET /user) - clintam

### 0.21.0

- Posts status reports for passing/failing builds, if the account for danger has access - [@orta]
- Adds prettier to the codebase - [@orta]
- Converts a bunch of Danger's dangerfile into a plugin -
  [danger-plugin-yarn](https://github.com/orta/danger-plugin-yarn) - [@orta]

This is my first non-trivial plugin, based on infrastructure from @macklinu. Plugins are looking great, you can get some
info at <https://github.com/macklinu/generator-danger-plugin>.

- Docs updates for the website - [@orta]

### 0.20.0

- Fix `danger pr` commands are not running on windows - kwonoj
- Fix broken link in getting started docs - frozegnome
- Do not delete comment written from user have same userid for danger - kwonoj
- Fix link to `jest` in getting started docs - palleas
- Fix yarn install instruction in getting started docs - palleas

### 0.19.0

- Update to Jest 20 - macklinu
- Change the danger.d.ts to use module exports instead of globals - [@orta]
- Render markdown inside `message()`, `warn()`, and `fail()` messages. - macklinu

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

- `src/lib/components/artist/artworks/__tests__/index-tests.tsx`
- `src/lib/components/artwork_grids/__tests__/infinite_scroll_grid-tests.tsx`
- `src/lib/containers/__tests__/works_for_you-tests.tsx`

If these files are supposed to not exist, please update your PR body to include "Skip New Tests".

</td>
    </tr>
  </tbody>
</table>

### 0.18.0

- Adds `github.api`. This is a fully authenticated client from the [github](https://www.npmjs.com/package/github) npm
  module. - @orta

  An easy example of it's usage would be using Danger to add a label to your PR. Note that Danger will have the
  permissions for your account, so for OSS repos - this won't work.

  ```js
  danger.github.api.issues.addLabels({
    owner: "danger",
    repo: "danger-js",
    number: danger.github.pr.number,
    labels: ["Danger Passed"],
  })
  ```

  Yeah, that's a bit verbose, I agree. So, there's also `github.thisPR` which should simplify that. It aims to provide a
  lot of the values for the current PR to use with the API.

  ```js
  const github = danger.github
  github.api.issues.addLabels({ ...github.thisPR, labels: ["Danger Passed"] })
  ```

  You could use this API for a bunch of things, here's some quick ideas:

  - Request specific reviewers when specific files change (`api.pullRequests.createReviewRequest`)
  - Add a label for when something passes or fails (`api.issues.addLabels`)
  - Verifying if someone is in your org? (`api.orgs.checkMembership`)
  - Updating Project tickets to show they have a PR (`api.projects.updateProject`)

### 0.17.0

- [Enhancements to `danger.git.diffForFile()`](https://github.com/danger/danger-js/pull/223) - @namuol

  - Removed `diffTypes` second argument in favor of `result.added` and `result.removed`
  - Added `result.before` and `result.after` for easy access to full contents of the original & updated file
  - `danger.git.diffForFile` is now an `async` function

  #### TL;DR:

  ```js
  // In danger 0.16.0:
  const fullDiff = danger.git.diffForFile("foo.js")
  const addedLines = danger.git.diffForFile("foo.js", ["add"])
  const removedLines = danger.git.diffForFile("foo.js", ["del"])

  // In the latest version:
  const diff = await danger.git.diffForFile("foo.js")
  const fullDiff = diff.diff
  const addedLines = diff.added
  const removedLines = diff.removed
  const beforeFileContents = diff.before
  const afterFileContents = diff.after
  ```

- Update internal test fixture generation docs - namuol

### 0.16.0

- Adds a `diffTypes` option to `diffForFile` - alex3165
- Add Buildkite CI source - jacobwgillespie

### 0.15.0

- When a Dangerfile fails to eval, send a message to the PR - [@orta]

### 0.14.2

- Updated jest-\* dependencies to 19.x - [@orta]

  Updating the jest-\* dependencies seems to be exhibiting strange behavior in tests for windows if you update, and use
  windows, can you please confirm that everything is 👍

- Added type shapings to `JSONPatchForFile` - [@orta]
- Replaced deprecated `lodash.isarray` package with `Array.isArray` - damassi

### 0.14.1

- Moved `@types/chalk` from dependencies to devDependencies - [@orta]
- Killed some stray console logs - [@orta]
- Updated the danger.d.ts - [@orta]

### 0.14.0

- TypeScript Dangerfiles are now support in Danger - [@orta]

  We use TypeScript in Danger, and a lot of my work in Artsy now uses TypeScript (see:
  [JS2017 at Artsy](http://artsy.github.io/blog/2017/02/05/Front-end-JavaScript-at-Artsy-2017/#TypeScrip1t)), so I
  wanted to explore using TypeScript in Dangerfiles.

  This is built on top of Jest's custom transformers, so if you are already using Jest with TypeScript, then you can
  change the `dangerfile.js` to `dangerfile.ts` and nothing should need changing ( except that you might have new
  warnings/errors ) (_note:_ in changing this for Danger, I had to also add the `dangerfile.ts` to the `"exclude"`
  section of the `tsconfig.json` so that it didn't change the project's root folder.)

  This repo is now using both a babel Dangerfile (running on Circle CI) and a TypeScript one (running on Travis) to
  ensure that we don't accidentally break either.

- Created a new `danger.d.ts` for VS Code users to get auto-completion etc - [@orta]
- Added a two new `git` DSL functions: `git.JSONDiffForFile(filename)` and `git.JSONPatchForFile(filename)`.

  - `git.JSONPatchForFile`

    This will generate a rfc6902 JSON patch between two files inside your repo. These patch files are useful as a
    standard, but are pretty tricky to work with in something like a Dangerfile, where rule terseness takes priority.

  - `git.JSONDiffForFile`

    This uses `JSONPatchForFile` to generate an object that represents all changes inside a Dangerfile as a single
    object, with keys for the changed paths. For example with a change like this:

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

      deps.added // ["chalk"],
      deps.removed // []
      deps.after // { "babel-polyfill": "^6.20.0", "chalk": "^1.1.1", "commander": "^2.9.0", "debug": "^2.6.0" }
      deps.before // { "babel-polyfill": "^6.20.0", "commander": "^2.9.0", "debug": "^2.6.0" }
    }
    ```

    The keys: `added` and `removed` only exist on the object if:

    - `before` and `after` are both objects - in which case `added` and `removed` are the added or removed keys
    - `before` and `after` are both arrays - in which case `added` and `removed` are the added or removed values

- Exposed all global functions ( like `warn`, `fail`, `git`, `schedule`, ... ) on the `danger` object. - [@orta]

  This is specifically to simplify building library code. It should not affect end-users. If you want to look at making
  a Danger JS Plugin, I'd recommend exposing a function which takes the `danger` object and working from that. If you're
  interested, there is an active discussion on plugin support in the DangerJS issues.

- Improves messaging to the terminal - [@orta]
- Adds the ability to not have Danger post to GitHub via a flag: `danger run --text-only` - [@orta]
- Fix a crasher with `prs.find` #181 - [@orta]

### 0.13.0

- Add `danger.utils` DSL, which includes `danger.utils.href()` and `danger.utils.sentence()` - macklinu

  We were finding that a lot of Dangerfiles needed similar functions, so we've added a `utils` object to offer functions
  that are going to be used across the board. If you can think of more functions you use, we'd love to add them. Ideally
  you shouldn't need to use anything but Danger + utils to write your Dangerfiles.

  ```js
  danger.utils.href("http://danger.systems", "Danger") // <a href="http://danger.systems">Danger</a>
  danger.utils.sentence(["A", "B", "C"]) // "A, B and C"
  ```

- Adds `danger.github.utils` - which currently has only one function: `fileLinks` - [@orta]

  Most of the time people are working with a list of files (e.g. modified, or created) and then want to present
  clickable links to those. As the logic to figure the URLs is very GitHub specific, we've moved that into it's own
  object with space to grow.

  ```js
  const files = danger.git.modified_files // ["lib/component/a.ts", "lib/component/b.ts"]
  const links = danger.github.utils.fileLinks(files) // "<a href='...'>a</a> and <a href='...'>b</a>"
  warn(`These files have changes: ${links}`)
  ```

### 0.12.1

- Add support for [Drone](http://readme.drone.io) - gabro

### 0.12.0

- Added support for handling async code in a Dangerfile - deecewan

  This is still a bit of a work in progress, however, there is a new function added to the DSL: `schedule`.

  A Dangerfile is evaluated as a script, and so async code has not worked out of the box. With the `schedule` function
  you can now register a section of code to evaluate across multiple tick cycles.

  `schedule` currently handles two types of arguments, either a promise or a function with a resolve arg. Assuming you
  have a working Babel setup for this inside your project, you can run a Dangerfile like this:

  ```js
  schedule(async () => {
    const thing = await asyncAction()
    if (thing) {
      warn("After Async Function")
    }
  })
  ```

  Or if you wanted something simpler,

  ```js
  schedule(resolved => {
    if (failed) {
      fail("Failed to run")
    }
  })
  ```

- Adds new GitHub DSL elements - deecewan

* `danger.github.issue` - As a PR is an issue in GitHub terminology, the issue contains a bit more metadata. Mainly
  labels, so if you want to know what labels are applied to a PR, use `danger.github.issue.labels`
* `danger.github.reviews` - Find out about your reviews in the new GitHub Reviewer systems,
* `danger.github.requested_reviewers` - Find out who has been requested to review a PR.

- Updated TypeScript and Jest dependencies - [@orta]
- Add support for Github Enterprise via DANGER_GITHUB_API_BASE_URL env var - mashbourne

### 0.11.3 - 0.11.5

- Internal changes for usage with Peril - [@orta]

- Add `danger pr --repl`, which drops into a Node.js REPL after evaluating the dangerfile - macklinu
- Add support for Codeship - deecewan

### 0.11.0 - 0.11.2

- Add support for [Docker Cloud](https://cloud.docker.com) - camacho

### 0.10.1

- Builds which only use markdown now only show the markdown, and no violations table is shown - mxstbr

### 0.10.0

- Adds support for running Danger against a PR locally - [@orta]

The workflow is that you find a PR that exhibits the behavior you'd like Danger to run against, then edit the local
`Dangerfile.js` and run `yarn run danger pr https://github.com/facebook/jest/pull/2629`.

This will post the results to your console, instead of on the PR itself.

- Danger changes to your Dangerfile are not persisted after the run - [@orta]
- Add summary comment for danger message - kwonoj
- Add `jest-environment-node` to the Package.json - [@orta]

### 0.9.0

- Adds support for `git.commits` and `github.commits` - [@orta]

  Why two? Well github.commits contains a bunch of github specific metadata ( e.g. GitHub user creds, commit comment
  counts. ) Chances are, you're always going to use `git.commits` however if you want more rich data, the GitHub one is
  available too. Here's an example:

```js
const merges = git.commits.filter(commit => commit.message.include("Merge Master"))
if (merges.length) {
  fail("Please rebase your PR")
}
```

- Support custom dangerfile via `-d` commandline arg - kwonoj
- Allow debug dump output via `DEBUG=danger:*` environment variable - kwonoj
- Adds surf-build ci provider - kwonoj
- Forward environment variables to external module constructor - kwonoj

### 0.8.0

- Support `danger run -ci` to specify external CI provider - kwonoj
- Adds `--verbose` to `danger`, which for now will echo out all the URLs Danger has requested - [@orta]
- Migrate codebase into TypeScript from flow - kwonoj
- Handle removing all sorts of import types for Danger in the Dangerfile - [@orta]

### 0.7.3-4-5

- A failing network request will raise an error - [@orta]
- Fix Dangerfile parsing which broke due to Peril related changes - [@orta]
- Tweak the npmignore, ship less random stuff to others - [@orta]

### 0.7.2

- Fixes to the shipped Flow/TS definitions - [@orta]
- Adds more functions the the internal Danger GitHub client - [@orta]
- Infrastructure work to allow Peril to run a Dangerfile - [@orta]
- Upgrade outdated ESLint packages - macklinu
- Enhance Windows OS compatibility - kwonoj

### 0.7.1

- Set exit code to 1 when running `danger` throws an error - macklinu
- Add Jenkins CI source - macklinu
- Add .editorconfig - macklinu
- Adds jest-runtime to the dependencies - [@orta]

### 0.7.0

- You can build and run in vscode using your own custom `env/development.env` file. This is useful because you can use
  the debugger against a real PR. See `env/development.env.example` for syntax. - [@orta]

- Uses `jest-transform` and `jest-runtime` to eval and apply babel transforms.

  This does two things, makes it feasible to do [hosted-danger](https://github.com/danger/peril) and makes it possible
  to write your Dangerfile in a way that's consistent with the rest of your JavaScript. - [@orta]

- Add tests directory to .npmignore - macklinu
- Update to Jest 18 - macklinu

### 0.6.10

- Brings back the ability to emulate a fake CI run locally via `danger` - [@orta]

### 0.6.9

- Makes `babel-polyfill` a direct dependency, this is because it is actually an implicit dependency in the app. I'm not
  sure how I feel about this, I guess if we use a part of it in the babel translation of a user's Dangerfile them I'm OK
  with it. - [@orta]

### 0.6.6 - 0.6.7 - 0.6.8

- Ship flow annotations with the npm module - [@orta]

### 0.6.5

- Adds more node instances to travis - romanki + orta
- Adds support for Semaphore CI - [@orta]

### 0.6.4

- The env vars `DANGER_TEST_REPO` and `DANGER_TEST_PR` will allow you initialize the FakeCI with a repo of your choice.
  See README.md for more info
- Improved error messaging around not including a `DANGER_GITHUB_API_TOKEN` in the ENV - nsfmc / orta
- Adds support for getting the diff for a specific file from git: e.g.

```js
// Politely ask for their name on the entry too
const changelogDiff = danger.git.diffForFile("changelog.md")
const contributorName = danger.github.pr.user.login
if (changelogDiff && changelogDiff.indexOf(contributorName) === -1) {
  warn("Please add your GitHub name to the changelog entry, so we can attribute you.")
}
```

### 0.6.3

- Does not break commonmark on GitHub - [@orta]
- upgrades to flow 0.35.0 and fixes associated type errors in covariant/invariant interfaces - nsfmc
- omits flow requirement for new test files - nsfmc
- adds support for circleci - nsfmc
- defines CISource properties in flow as read-only - nsfmc

### 0.5.0

- `danger.pr` -> `danger.github.pr`, I've also created interfaces for them - [@orta]
- `warn`, `message`, `markdown` are all ported over to DangerJS - [@orta]
- Shows a HTML table for Danger message - [@orta]
- Now offers a Flow-typed definition file, it's not shipped to their repo yet, you can make it by
  `npm run export-flowtype` - [@orta]
- Started turning this into a real project by adding tests - [@orta]

### 0.0.5-0.0.10

- Changes some files cashing, added some logs, a bit of error reporting, and verifying everything works through npm -
  [@orta]

### 0.0.4

- Danger edit an existing post, and delete it when it's not relevant - [@orta]

### 0.0.3

- Danger will post a comment on a GitHub PR with any Fails - [@orta]

### 0.0.2

OK, first usable for others version. Only supports GitHub and Travis CI.

You can run by doing:

```sh
danger
```

Make sure you set a `DANGER_GITHUB_API_TOKEN` on your CI -
[see the Ruby guide](http://danger.systems/guides/getting_started.html#setting-up-danger-to-run-on-your-ci) for that.

Then you can make a `dangerfile.js` (has to be lowercase, deal with it.) It has access to a whopping 2 DSL attributes.

```sh
pr
git
fail(message: string)
```

`pr` _probably_ won't be sticking around for the long run, but if you're using a `0.0.2` release, you should be OK with
that. It's the full metadata of the PR, so
[this JSON file](https://raw.githubusercontent.com/danger/danger/master/spec/fixtures/github_api/pr_response.json).
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

./[@orta]

### 0.0.1

Not usable for others, only stubs of classes etc. - [@orta]

[danger-swift]: https://github.com/danger/danger-swift#danger-swift
[danger-go]: https://github.com/bdotdub/danger-go
[@adam-moss]: https://github.com/adam-moss
[@adamnoakes]: https://github.com/adamnoakes
[@aghassi]: https://github.com/aghassi
[@ashfurrow]: https://github.com/ashfurrow
[@azz]: https://github.com/azz
[@caffodian]: https://github.com/caffodian
[@codestergit]: https://github.com/codestergit
[@cwright017]: https://github.com/Cwright017
[@cysp]: https://github.com/cysp
[@danielrosenwasser]: https://github.com/DanielRosenwasser
[@davidbrunow]: https://github.com/davidbrunow
[@dfalling]: https://github.com/dfalling
[@dkundel]: https://github.com/dkundel
[@f-meloni]: https://github.com/f-meloni
[@fbartho]: https://github.com/fbartho
[@fwal]: https://github.com/fwal
[@happylinks]: https://github.com/happylinks
[@hmcc]: https://github.com/hmcc
[@hongrich]: https://github.com/hongrich
[@hellocore]: https://github.com/HelloCore
[@imorente]: https://github.com/imorente
[@joarwilk]: https://github.com/joarwilk
[@johansteffner]: https://github.com/johansteffner
[@joshacheson]: https://github.com/joshacheson
[@keplersj]: https://github.com/keplersj
[@langovoi]: https://github.com/langovoi
[@mifi]: https://github.com/ionutmiftode
[@mxstbr]: https://github.com/mxstbr
[@ninjaprox]: https://github.com/ninjaprox
[@nminhnguyen]: https://github.com/NMinhNguyen
[@nornagon]: https://github.com/nornagon
[@notmoni]: https://github.com/NotMoni
[@orta]: https://github.com/orta
[@osmestad]: https://github.com/osmestad
[@patrickkempff]: https://github.com/patrickkempff
[@peterjgrainger]: https://github.com/peterjgrainger
[@randak]: https://github.com/randak
[@ravanscafi]: https://github.com/ravanscafi
[@rohit-gohri]: https://github.com/rohit-gohri
[@sajjadzamani]: https://github.com/sajjadzamani
[@sebinsua]: https://github.com/sebinsua
[@sgtcoolguy]: https://github.com/sgtcoolguy
[@sharkysharks]: https://github.com/sharkysharks
[@sogame]: https://github.com/sogame
[@stevemoser]: https://github.com/stevemoser
[@stevenp]: https://github.com/stevenp
[@sunshinejr]: https://github.com/sunshinejr
[@tychota]: https://github.com/tychota
[@urkle]: https://github.com/urkle
[@wizardishungry]: https://github.com/wizardishungry
[@dblandin]: https://github.com/dblandin
[@paulmelnikow]: https://github.com/paulmelnikow
[@ds300]: https://github.com/ds300
[@jamime]: https://github.com/jamime
[@mrndjo]: https://github.com/mrndjo
[@bigkraig]: https://github.com/bigkraig
[@notjosh]: https://github.com/notjosh
[@iljadaderko]: https://github.com/IljaDaderko
[@417-72ki]: https://github.com/417-72KI
[@soyn]: https://github.com/Soyn
[@tim3trick]: https://github.com/tim3trick
[@doniyor2109]: https://github.com/doniyor2109
[@alexandermendes]: https://github.com/alexandermendes
[@jamiebuilds]: https://github.com/jamiebuilds
[@hmschreiner]: https://github.com/hmschreiner
[@g3offrey]: https://github.com/g3offrey
[@denieler]: https://github.com/denieler
