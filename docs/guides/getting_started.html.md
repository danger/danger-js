---
title: Getting Started with Danger JS
subtitle: Getting Started with Danger JS
layout: guide_js
order: 0
---

So, you're ready to get set up. 

There are 5 steps involved in getting Danger running:

* [Include the Danger module](#including-danger).
* [Creating a Dangerfile](#creating-a-dangerfile) and add a few simple rules.
* [Creating an account for Danger to use](#creating-a-bot-account-for-danger-to-use).
* Setting up [an access token for Danger](#setting-up-an-access-token) with that account.
* Setting up [Danger to run on your CI](#setting-up-danger-to-run-on-your-ci).

### Including Danger

We recommend you install Danger via [Yarn][]. Though you can use the npm CLI.

##### Installation

Adding the Danger module by `yarn run danger --dev`. This will add Danger as a `devDependency` and make the command `danger` available by running `yarn danger`.

### Creating a Dangerfile

Create either an empty JavaScript or TypeScript file named `Dangerfile`. Either `Dangerfile.js` or `Dangerfile.ts` will be picked up automatically.

Danger uses [Jest's][jest] infrastructure for handling source code transpilation for your Dangerfile. This means if you are using Jest for your testing, then you have no configuration. If you do not use Jest, I would recommend looking at their [config settings][jest-config]

To get yourself started, try this as your Dangerfile:

```js
import { message, danger } from "danger"
message(":tada:, this worked @" + danger.github.pr.user.login)
```

Which, once you have your authentication set up, will have danger post a message to your PR with your name.

For a deeper understanding of using a Dangerfile, see the guide [dangerfiles][]

### Creating a bot account for Danger to use

This is optional. Pragmatically, you want to do this though. Currently Danger JS only supports communication on GitHub. If you're interested in GitLab and BitBucket support, PRs are welcome, or look at the Ruby version of Danger.

### GitHub

In order to get the most out of Danger, we recommend giving her the ability to post comments in your Pull Requests. This is a regular GitHub account, but depending on whether you are working on a private or public project, you will want to give different levels of access to this bot. You are allowed to have [one bot per GitHub account][github_bots].

To get started, open [https://github.com](https://github.com) in a private browser session.

##### OSS Projects

Do not add the bot to your repo or to your organization.

##### Closed Source Projects

Add the bot to your repo or to your organization. The bot requires permission level "Write" to be able to set a PR's status. Note that you _should not_ re-use this bot for OSS projects.

### Setting up an Access Token

[Here's the link][github_token], you should open this in the private session where you just created the new GitHub account. Again, the rights that you give to the token depend on the openness of your projects. You'll want to save this token for later, when you add a `DANGER_GITHUB_API_TOKEN` to your CI.

##### Tokens for OSS Projects

We recommend giving the token the smallest scope possible. This means just `public_repo`, this scopes limits Danger's abilities to just writing comments on OSS projects. Because the token can be quite easily be extracted from the CI environment, this minimizes the chance for bad actors to cause chaos with it.

##### Tokens for Closed Source Projects

We recommend giving access to the whole `repo` scope, and its children.

### Enterprise GitHub

You can work with GitHub Enterprise by setting 2 environment variables:

* `DANGER_GITHUB_HOST` to the host that GitHub is running on.
* `DANGER_GITHUB_API_BASE_URL` to the host that the GitHub Enterprise API is reachable on.

For example:

```sh
DANGER_GITHUB_HOST=git.corp.evilcorp.com
DANGER_GITHUB_API_BASE_URL=https://git.corp.evilcorp.com/api/v3
```

### Continuous Integration

Continuous Integration is the process of regularly running tests and generating metrics for a project. It is where you can ensure that the code you are submitting for review is passing on all of the tests. You commonly see this as green or red dots next to commits.

Danger is built to run as a part of this process, so you will need to have this set up as a pre-requisite.

### Setting up Danger to run on your CI

(should we do this for DangerJS too?)

/ These docs all come from
/ https://github.com/danger/danger/tree/master/lib/danger/ci_source
/ inline documentation, rather than from inside this page.

### Verify Installation

You should be able to verify that you have successfully integrated Danger by either re-building your CI or pushing your new commits.


[jest-config]: https://facebook.github.io/jest/docs/configuration.html
[github_bots]: https://twitter.com/sebastiangrail/status/750844399563608065
[github_token]: https://github.com/settings/tokens/new
[Yarn]: https://yarnpkg.com
