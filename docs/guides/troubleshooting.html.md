---
title: Troubleshooting
subtitle: Troubleshooting
layout: guide_js
order: 4
blurb: Answers to common bugs.
---

## Danger is not posting to GitHub PRs, but everything looks fine?

Try logging in to the GitHub account that should be writing the messages, it's possible that your account has triggered the bot detection algorithm on GitHub. This means that messages are sent correctly, but do not show up for anyone except the sender. This makes it more or less impossible to detect from Danger's side.

## I'm not sure what Danger is doing

If you run danger with `DEBUG="*"` prefixed, you'll get a lot of information about what's happening under the hood. E.g:

```sh
DEBUG="*" DANGER_GITHUB_API_TOKEN=[123] yarn danger pr https://github.com/facebook/react/pull/11865
```

or on the CI:

```sh
DEBUG="*" yarn danger ci
```

This will print out a _tonne_ of information.

## Circle CI doesnt run my build consistently

Yeah... We're struggling with that one. It's something we keep taking stabs at improving, so [keep an eye on the issues][circle_issues]. Ideally this issue will get resolved and we'll get it [fixed for free][circle_pr].

[circle_issues]: https://github.com/danger/danger-js/search?q=circle&state=open&type=Issues&utf8=✓
[circle_pr]: https://discuss.circleci.com/t/pull-requests-not-triggering-build/1213
