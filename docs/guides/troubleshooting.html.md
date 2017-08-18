---
title: Troubleshooting
subtitle: Troubleshooting
layout: guide_js
order: 4
blurb: Answers to common bugs.
---

## I'm seeing a lot of "Cannot read property 'bind'" in my tests

This causes all of your tests to fail.

      ● Test suite failed to run

        TypeError: Cannot read property 'bind' of undefined

          at Runtime._createRuntimeFor (node_modules/jest-cli/node_modules/jest-runtime/build/index.js:709:52)
          at handle (node_modules/worker-farm/lib/child/index.js:41:8)
          at process.<anonymous> (node_modules/worker-farm/lib/child/index.js:47:3)
          at emitTwo (events.js:106:13)
          at process.emit (events.js:191:7)

This seems to happen when you have multiple versions of Jest inside the same project. Danger aims to keep up to date with the latest Jest versions. So you may need to update one or the other. There's [more information here](https://github.com/facebook/jest/issues/3114).

#### Danger is not posting to GitHub PRs, but everything looks fine?

Try logging in to the GitHub account that should be writing the messages, it's possible that your account has triggered the bot detection algorithm on GitHub. This means that messages are sent correctly, but do not show up for anyone except the sender. This makes it more or less impossible to detect from Danger's side.

## Circle CI doesnt run my build consistently

Yeah... We're struggling with that one. It's something we keep taking stabs at improving, so [keep an eye on the issues][circle_issues]. Ideally this issue will get resolved and we'll get it [fixed for free][circle_pr].

[circle_issues]: https://github.com/danger/danger-js/search?q=circle&state=open&type=Issues&utf8=✓
[circle_pr]: https://discuss.circleci.com/t/pull-requests-not-triggering-build/1213


