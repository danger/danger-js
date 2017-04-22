---
title: Danger in a Node App
subtitle: Danger + Node
layout: guide_js
order: 0
---

## Before we get started

This guide continues after "[Getting Started][started]" - so you should have seen Danger comment on your PRs.

## "Node App"

A node app could cover anything from an API, to a website, a native app or a hardware project. The rules on these projects tend to come from your larger dev team culture. In [Artsy][]] a lot of our rules for applications come from trying to have a similar culture between all projects.

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

In a similar vein, we also want to encourage pull requests as a form of documentation. We can help push people in this direction by not allowing the body of a pull request to be less than a few characters long.

```js
if (!danger.pr.body.length < 10) {
  fail("This pull request needs an description.")
}
```

This can be expanded to all sorts of checks for example:

* Making sure every PR references an issue, or JIRA ticket.
* Skipping particular rules based on what someone says inside the message. E.g. "This is a trivial PR."

## Results of CI Processes

Let's assume you're using CI for running tests or linters.

```yaml
script:
  - yarn lint
  - yarn test
  - yarn danger
```

If your tool does not have an extra log file output option, you can look at using [`tee`][tee] to copy the text output into a file for later reading ( so you'd change `- yarn lint` to `yarn lint | tee 'linter.log'` )

And here's a really simple check that it contains the word "Failed" and to post the logs into the PR.

```js
import { danger, markdown } from "danger"

import contains from "lodash-contains"
import fs from "fs"

const testFile = "tests-output.log"
const linterOutput = fs.readFileSync(testFile).toString()

if (contains(linterOutput, "Failed")) {
  const code = "```"
  markdown(`These changes failed to pass the linter:

${code}
${linterOutput}
${code}
  `)
}
```

More mature tools may have a JSON output reporter, so you can parse that file and create your own markdown table.




[started]: /js/guides/asdasdasdas
[Artsy]: http://artsy.github.io
[no-slacking]: https://github.com/alloy/no-slacking-on-pull-requests-bot
[pr]: https://developer.github.com/v3/pulls/#get-a-single-pull-request
[tee]: http://linux.101hacks.com/unix/tee-command-examples/
