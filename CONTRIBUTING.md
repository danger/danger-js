# How to contribute

## Setup

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

### How does Danger JS work?

Check the [architecture doc](https://github.com/danger/danger-js/blob/main/docs/architecture.md).

### What is the TODO?

Check the issues, I try and keep my short term perspective there. Long term is in the [VISION.md](VISION.md).

### Releasing a new version of Danger

Following [this commit](https://github.com/danger/danger-js/commit/a26ac3b3bd4f002acd37f6a363c8e74c9d5039ab) as a model:

- Checkout the `main` branch. Ensure your working tree is clean, and make sure you have the latest changes by running
  `git pull`.
- Update `package.json` with the new version - for the sake of this example, the new version is **0.21.0**.
- Modify `changelog.md`, adding a new `### 0.21.0` heading under the `### Main` heading at the top of the file.
- Commit both changes with the commit message **Version bump**.
- Tag this commit - `git tag 0.21.0`.
- Push the commit and tag to master - `git push origin main --follow-tags`. Travis CI will build the tagged commit and
  publish that tagged version to NPM.

:ship:

## License, Contributor's Guidelines and Code of Conduct

We try to keep as much discussion as possible in GitHub issues, but also have a pretty inactive Slack --- if you'd like
an invite, ping [@Orta](https://twitter.com/orta/) a DM on Twitter with your email. It's mostly interesting if you want
to stay on top of Danger without all the emails from GitHub.

> This project is open source under the MIT license, which means you have full access to the source code and can modify
> it to fit your own needs.
>
> This project subscribes to the [Moya Contributors Guidelines](https://github.com/Moya/contributors) which TLDR: means
> we give out push access easily and often.
>
> Contributors subscribe to the [Contributor Code of Conduct](http://contributor-covenant.org/version/1/3/0/) based on
> the [Contributor Covenant](http://contributor-covenant.org) version 1.3.0.
