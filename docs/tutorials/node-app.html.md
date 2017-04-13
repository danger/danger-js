---
title: Danger in a Node App
subtitle: Plugin creation
layout: guide_js
order: 0
---

## Before we get started

This guide continues after "[Getting Started][started]" - so you should have seen Danger comment on your PRs.

## "Node App"

A node app could cover anything from an API, to a website, to a native app or hardware project. The rules on these projects tend to come from your larger dev team culture. In [Artsy][]] a lot of our rules for applications come from trying to have a similar culture between all projects.

## Assignees

We use [a slack bot][no-slacking] to let people know when they've been assigned to a PR, and so the first rule added to an app is a check that there are assignees to your PR. This is a really simple check:

```js
import { danger, fail, warn } from "danger"

if (!danger.pr.assignee) {
  fail("This pull request needs an assignee, and optionally include any reviewers.")
}
```

The `danger.pr` object is the JSON provided by GitHub to [represent a pull request][pr]. So here we're pulling out the `assignee` key and validating that anything is inside it.

## PR Messages

On a similar vein, we also want to encourage pull requests as a form of documentation. We can help push people in this direction by not allowing the body of a pull request to be a few characters long.

```js
if (!danger.pr.body.length < 10) {
  fail("This pull request needs an description.")
}
```

The rules help establish your cultural baselines. 



* Checking test changes for new files
* Reference a GitHub Issue
* Warn about large PRs
* Warn on commit rules


[started]: /js/guides/asdasdasdas
[Artsy]: http://artsy.github.io
[no-slacking]: https://github.com/alloy/no-slacking-on-pull-requests-bot
[pr]: https://developer.github.com/v3/pulls/#get-a-single-pull-request
