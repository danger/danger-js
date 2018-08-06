---
title: Fast Feedback via Danger Local
subtitle: Platformless
layout: guide_js
order: 4
blurb: How to use Danger to get per-commit feedback
---

## Before we get started

This tutorial continues after "[Getting Started][started]" - it's not required that you have `danger ci` set up though.

## Locality

With Danger, the typical flow is to help you can check rules on CI and get feedback inside your PR. With Peril you can
move those rules to run on an external server making feedback instant. `danger local` provides a somewhat hybrid
approach.

`danger local` provides a way to run a Dangerfile based on git-hooks. This let's you run rules while you are still in
the same context as your work as opposed to later during the code review. Personally, I find this most useful on
projects when I ship 90% of the code to it.

## How it works

Where `danger ci` uses information from the Pull Request to figure out what has changed, `danger local` naively uses the
local differences in git from master to the current commit to derive the runtime environment. This is naive because if
you don't keep your master branch sync, then it will be checking across potentially many branches.

Inside a Dangerfile `danger.github` and `danger.bitbucket` will be falsy in this context, so you can share a Dangerfile
between `danger local` and `danger ci` as long as you verify that these objects exist before using them.

When I thought about how I wanted to use `danger local` on repos in the Danger org, I opted to make a separate
Dangerfile for `danger local` and import this at the end of the main Dangerfile. This new Dangerfile only contains rules
which can run with just `danger.git`, e.g. CHANGELOG/README checks. I called it `dangerfile.lite.ts`.

## Getting it set up

You need to add both Danger and [husky](https://www.npmjs.com/package/husky) to your project:

```sh
yarn add --dev danger husky
```

When husky is in your dependencies, git-hooks are set up to respond according to matching names in the `"scripts"`
section of your `package.json`. We want to use [a pre-push](https://git-scm.com/docs/githooks#_pre_push) hook to let
`danger local` run before code has been submitted.

```json
"scripts": {
  "prepush": "yarn build; yarn danger:prepush",
  "danger:prepush": "yarn danger local --dangerfile dangerfile.lite.ts"
  // [...]
```

Yes, it's a `pre-push` hook and the script is `prepush`, husky
[removes the dashes](https://github.com/typicode/husky/blob/master/HOOKS.md#hooks). If `master` isn't the branch which
you want as a reference then you can use `--base dev` to change the comparison base.
