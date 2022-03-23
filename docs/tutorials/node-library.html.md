---
title: Danger + Node Library
subtitle: Danger + Node Library
layout: guide_js
order: 1
blurb:
  An example where you work on an OSS node library, so you're trying to improve overall contributions from light
  contributors.
---

## Before we get started

This tutorial continues after "[Getting Started][started]" - so you should have seen Danger comment on your PRs.

## Keeping on top of your library

End-users want to understand what has changed between versions of your library, and a CHANGELOG is a great way to keep
them up to date. However, it can be easy to forget to add a CHANGELOG entry to any changes to a library. So let's add a
check that a CHANGELOG entry is added on every PR:

```js
import { danger, fail, warn } from "danger"

const changelogChanges = danger.git.fileMatch("CHANGELOG.md")
if (!changelogChanges.modified) {
  warn("This pull request may need a CHANGELOG entry.")
}
```

We went with `warn` here because there are a lot of legitimate reasons to not need a CHANGELOG entry (updating typos, CI
and other infrastructure.) We can improve this though, let's _also_ check that there are changes to the source code for
our library.

```js
import { danger, fail, warn } from "danger"
import first from "lodash.first"

const changelogChanges = danger.git.fileMatch("CHANGELOG.md")
const hasLibraryChanges = first(danger.git.modified_files, path => path.startsWith("lib/"))
if (hasLibraryChanges && !changelogChanges.modified) {
  warn("This pull request may need a CHANGELOG entry.")
}
```

This is a much more specific rule, now changes to the README won't warrant a CHANGELOG entry.

### Dependencies

Any dependencies that you use are passed on to all of your library consumers, so you should consider using Danger to
keep track of those as they evolve. For more information, see the tutorial on [Dependencies][deps].

### Keep your README up to date

An example from Danger itself, is that we want to ensure the README always shows what CI providers will work by default
with Danger. As both the app, and Danger use JavaScript, we can import code from the app and use that to create a new
rule.

```js
import { danger, fail, warn } from "danger"
import contains from "lodash.contains"

// This is a list of all the CI providers
import { realProviders } from "./source/ci_source/providers"

const readme = fs.readFileSync("README.md", "utf8")
const names = realProviders.map(ci => new ci({}).name)
const missing = names.filter(name => !contains(readme, name))
if (missing.length) {
  warn(`These providers are missing from the README: ${sentence(missing)}`)
}
```

Danger also uses a similar check to create our type definition files, if any of the public DSL changes then Danger
checks that the type definitions have been updated, and recommends how to do so if not. These are rare chores which are
really hard to remember to do, and impossible if you're not intimate with the codebase - so providing automated feedback
here is really useful.

[deps]: /js/tutorials/dependencies.html
[started]: /js/guides/getting_started.html
