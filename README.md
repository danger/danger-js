<p align="center">
  <img src="http://danger.systems/images/js/danger-logo-hero-cachable@2x.png" width=250 /></br>
  Formalize your Pull Request etiquette.
</p>

<p align="center">
    <a href="#what-is-danger-js">What is Danger JS?</a> &bull;
    <a href="VISION.md">Vision</a> &bull;
    <a href="#this-thing-is-broken-i-should-help-improve-it">Helping Out</a> &bull;
    <a href="http://danger.systems/js/usage/extending-danger.html">Plugin Development</a>
</p>

## What is Danger JS?

Danger runs after your CI, automating your team's conventions surrounding code review.

This provides another logical step in your process, through which Danger can help lint your rote tasks in daily code
review.

You can use Danger to codify your team's norms, leaving humans to think about harder problems.

Danger JS works with GitHub, BitBucket Server, BitBucket Cloud for code review, then with: Travis CI, GitLab CI,
Semaphore, Circle CI, GitHub Actions, Jenkins, Bamboo, Bitrise, surf-build, Codeship, Drone, Buildkite, Buddy.works,
TeamCity, Visual Studio Team Services, Screwdriver, Concourse, Netlify, CodeBuild, Codefresh, AppCenter, BitBucket
Pipelines, Cirrus CI, Codemagic or Xcode Cloud.

[![npm](https://img.shields.io/npm/v/danger.svg)](https://www.npmjs.com/package/danger)
[![Build Status](https://travis-ci.org/danger/danger-js.svg?branch=main)](https://travis-ci.org/danger/danger-js)
[![Build Status](https://ci.appveyor.com/api/projects/status/ep5hgeox3lbc5c7f?svg=true)](https://ci.appveyor.com/project/orta/danger-js/branch/main)

## For example?

You can:

- Enforce CHANGELOGs
- Enforce links to Trello/JIRA in PR/MR bodies
- Enforce using descriptive labels
- Look out for common anti-patterns
- Highlight interesting build artifacts
- Give warnings when specific files change

Danger provides the glue to let _you_ build out the rules specific to your team's culture, offering useful metadata and
a comprehensive plugin system to share common issues.

## Getting Started

Alright. So, actually, you may be in the wrong place. From here on in, this README is going to be for people who are
interested in working on and improving on Danger JS.

We keep all of the end-user documentation at <http://danger.systems/js>.

Some quick links to get you started:

- [Getting Started](http://danger.systems/js/guides/getting_started.html)
- [Guides Index](http://danger.systems/js/guides.html)
- [DSL Reference](http://danger.systems/js/reference.html)

## This thing is broken, I should help improve it

Awesommmmee. Everything you need is down below. You can also refer to [CONTRIBUTING](CONTRIBUTING.md) file where you'll
find the same information listed below.

```sh
git clone https://github.com/danger/danger-js.git
cd danger-js

# if you don't have yarn installed
npm install -g yarn

yarn install
```

You can then verify your install by running the tests, and the linters:

```sh
yarn test
yarn lint
```

The fixers for both tslint and prettier will be applied when you commit, and on a push your code will be verified that
it compiles.

You can run your dev copy of danger against a PR by running:

```sh
yarn build; node --inspect distribution/commands/danger-pr.js https://github.com/danger/danger-js/pull/817
```

### How does Danger JS work?

Check the [architecture doc](https://github.com/danger/danger-js/blob/main/docs/architecture.md).

### What is the TODO?

Check the issues, I try and keep my short term perspective there. Long term is in the [VISION.md](VISION.md).

### Releasing a new version of Danger

Releases are triggered by pushing a version tag. Tag creation on this repo is restricted by the "Release tags"
repository ruleset, so the set of people who can ship a release is that ruleset's bypass list.

- Checkout the `main` branch. Ensure your working tree is clean, and make sure you have the latest changes by running
  `git pull; yarn`.
- Bump and tag - `npm run release -- patch`. This bumps `package.json`, commits, tags and pushes. It no longer publishes
  to npm from your machine, so there's no OTP to enter.
- Pushing the tag runs [`npm_publish.yml`](.github/workflows/npm_publish.yml), which publishes to npm using npm's
  trusted publishing (there is no `NPM_TOKEN` secret) and then kicks off `release.yml` for the macOS native builds and
  the homebrew tap.

:ship:

## License, Contributor's Guidelines and Code of Conduct

We try to keep as much discussion as possible in GitHub issues, but also have a pretty inactive Slack --- if you'd like
an invite, ping [@Orta](https://twitter.com/orta/) a DM on Twitter with your email. It's mostly interesting if you want
to stay on top of Danger without all the emails from GitHub.

> This project is open source under the MIT license, which means you have full access to the source code and can modify
> it to fit your own needs but don't have access to deploy.
>
> This project subscribes to the [Moya Contributors Guidelines](https://github.com/Moya/contributors) which TLDR: means
> we give out push access easily and often.
>
> Contributors subscribe to the [Contributor Code of Conduct](http://contributor-covenant.org/version/1/3/0/) based on
> the [Contributor Covenant](http://contributor-covenant.org) version 1.3.0.
