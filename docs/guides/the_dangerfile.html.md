---
title: About the Dangerfile
subtitle: The Dangerfile
layout: guide_js
order: 1
blurb: Step two on using Danger in your app, how to work locally and nuances around working with files.
---

## Writing your Dangerfile

The Danger JS DSL is fully typed via TypeScript. These definitions are shipped with the Danger module. If your text
editor supports working with type definitions you will get inline-documentation and auto-completion after you import
danger in your Dangerfile. [Visual Studio Code](https://code.visualstudio.com/) will do this by default for you.

If you are using Babel in your project, your Dangerfile will use the same transpilation settings. If you're using
TypeScript + Jest it will work out of the box too, however, if you don't, you should head over to the [transpilation
guide][transpilation_guide].

## Working on your Dangerfile

There are two ways to locally work on your Dangerfile. These both rely on using the GitHub API locally, so you may hit
the GitHub API rate-limit or need to have authenticated request for private repos. In which case you can use an access
token to do authenticated requests by exposing a token to Danger.

```sh
export DANGER_GITHUB_API_TOKEN='xxxx'

# or for BitBucket by username and password
export DANGER_BITBUCKETSERVER_HOST='xxxx' DANGER_BITBUCKETSERVER_USERNAME='yyyy' DANGER_BITBUCKETSERVER_PASSWORD='zzzz'

# or for BitBucket by username and personal access token
export DANGER_BITBUCKETSERVER_HOST='xxxx' DANGER_BITBUCKETSERVER_USERNAME='yyyy' DANGER_BITBUCKETSERVER_TOKEN='zzzz'

# or for BitBucket Cloud by username (from Account Settings page), password (App-password with Read Pull requests, and Read Account Permissions)
export DANGER_BITBUCKETCLOUD_USERNAME='xxxx'
export DANGER_BITBUCKETCLOUD_PASSWORD='yyyy'

# or for BitBucket Cloud by OAuth key, and OAuth secret
# You can get OAuth key from Settings > OAuth > Add consumer, put `https://bitbucket.org/site/oauth2/authorize` for `Callback URL`, and enable Read Pull requests, and Read Account Permissions.
export DANGER_BITBUCKETCLOUD_OAUTH_KEY='xxxx'
export DANGER_BITBUCKETCLOUD_OAUTH_SECRET='yyyy'
```

Then the danger CLI will use authenticated API calls, which don't get this by API limits.

### Using `danger pr`

The command `danger pr` expects an argument of a PR url, e.g.
`yarn danger pr https://github.com/danger/danger-js/pull/100`.

This will use your local Dangerfile against the metadata of the linked PR. Danger will then output the results into your
terminal, instead of inside the PR itself.

This _will not_ post comments. It is for locally testing, see `yarn danger pr --help` for more info.

### Using `danger` and Faking being on a CI

If you create an
[appropriately scoped temporary api token](http://danger.systems/js/guides/getting_started.html#setting-up-an-access-token)
for your GitHub account, this can be a good way to see if danger is suitable for you before integrating it into your CI
system.

You can manually trigger danger against a pull request on the command line by setting the following environmental
variables:

```bash
export DANGER_FAKE_CI="YEP"
export DANGER_TEST_REPO='username/reponame'
```

Then you can run against a local branch that is attached to a pull-request, by running the following:

```bash
git checkout branch-for-pr-1234
DANGER_TEST_PR='1234' yarn danger ci
```

Assuming that your local file-system matches up to that branch on GitHub, this will be a good approximation of how
danger will work when you integrate it into your CI system. Note: this will leave a comment on the PR.

## Working with files

Over time, we've found it easier to create up-front arrays of files you are interested in - then you can work with these
potential arrays of files. For example:

```js
import { danger } from "danger"

const docs = danger.git.fileMatch("**/*.md")
const app = danger.git.fileMatch("src/**/*.ts")
const tests = danger.git.fileMatch("*/__tests__/*")

if (docs.edited) {
  message("Thanks - We :heart: our [documentarians](http://www.writethedocs.org/)!")
}

if (app.modified && !tests.modified) {
  warn("You have app changes without tests.")
}
```

## Utils

As the JavaScript library API is relatively limited, the Danger module includes utility functions for work which is
common to most Dangerfiles. These functions can be found in both `utils`, and `github.utils` for GitHub specific
functions. We're interested at growing this carefully.

## Finding more info

The [CHANGELOG][changelog] for Danger is kept entirely end-user focused, so if there is an aspect of the Dangerfile that
you do not know, or looks confusing and there is nothing in the documentation - [check the CHANGELOG][changelog]. This
is where we write-up why a change happened, and how it can affect Danger users.

### Examples

If you'd like to work with some reference material, here are some examples in the wild.

JavaScript:

- **Libraries** - [facebook/react-native][rn], [facebook/react][r] and [ReactiveX/rxjs][rxjs].
- **Docs** - [bamlab/dev-standards][bamlab]

Some TypeScript examples:

- **Apps** - [Artsy/Emission][emiss]
- **Libraries** [danger/danger-js][danger-js], [apollographql/apollo-client][apollo]

[emiss]: https://github.com/artsy/emission/blob/master/dangerfile.ts
[danger-js]: https://github.com/danger/danger-js/blob/master/dangerfile.ts
[meta]: https://github.com/artsy/metaphysics/blob/master/dangerfile.js
[rn]: https://github.com/facebook/react-native/blob/master/bots/dangerfile.js
[r]: https://github.com/facebook/react/blob/master/dangerfile.js
[rxjs]: https://github.com/ReactiveX/rxjs/blob/master/dangerfile.js
[setup]: http://danger.systems/guides/getting_started.html#creating-a-bot-account-for-danger-to-use
[jest]: https://github.com/facebook/jest
[transpilation_guide]: /js/tutorials/transpilation.html
[changelog]: http://danger.systems/js/changelog.html
[apollo]: https://github.com/apollographql/apollo-client/blob/master/config/dangerfile.ts
[bamlab]: https://github.com/bamlab/dev-standards/blob/master/dangerfile.js
