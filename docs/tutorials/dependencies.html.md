---
title: Danger + Dependencies
subtitle: Danger + Dependencies
layout: guide_js
order: 2
blurb: An example of how can you use Danger to keep your dependencies in check.
---

## Before we get started

This tutorial continues after "[Getting Started][started]" - so you should have seen Danger comment on your PRs.

## Keeping on top of your dependencies

Building pretty-much anything in the node ecosystem involves using external dependencies. In an ideal situation
you want to use as few dependencies as possible, and get the most use out of them. Remember that you are shipping your
dependencies too, so you are responsible for them to your end-users.

The numerical scale of dependencies can make it tough to feel like you own your entire stack. So let's try and use
Danger to give us more insight into changes related to our dependencies.

## Lockfiles

The simplest rule, which we can evolve, is that any time your `package.json` changes you probably want a change to the
[`yarn.lock`][lockfile] or [`shrinkwrap.json`][shrinkwrap] file. Yes, not every change to the `package.json` represents
a dependency update, but we're starting simple. You start off your `Dangerfile` like this:

```js
import { danger, warn } from "danger"

const packageJson = danger.git.fileMatch("package.json")
const packageLock = danger.git.fileMatch("yarn.lock")
if (packageJson.modified && !packageLock.modified) {
  warn("There are package.json changes with no corresponding lockfile changes")
}
```

### Vetting New Dependencies

This works, and for a while, this is enough. Time passes and you hear about a node module with a
[CVE](https://cve.mitre.org) against it, let's call it `"spaced-between"`, you want to ensure it isn't added as a
dependency.

There are two aspects that you consider:

- Keeping track of changes to `dependencies` (for noted dependencies)
- Reading the lockfile for the dependency (for transitive dependencies)

### Keeping track of changes to dependencies

We can use `danger.git.JSONDiffForFile` to understand the changes to a JSON file during code review. Note: it returns a
promise, so we'll need to use `schedule` to make sure it runs async code correctly in Peril.

```js
const blacklist = "spaced-between"

schedule(async () => {
  const packageDiff = await danger.git.JSONDiffForFile("package.json")

  if (packageDiff.dependencies) {
      const newDependencies = packageDiff.dependencies.added
      if (newDependencies.includes(blacklist)) {
        fail(`Do not add ${blacklist} to our dependencies, see CVE #23")
      }
  }
})
```

So for example with a diff of `package.json` where spaced-between is added:

```diff
{
  "dependencies": {
    "commander": "^2.9.0",
    "debug": "^2.6.0"
+    "spaced-between": "^1.1.1",
    "typescript": "^2.2.1",
  },
}
```

`JSONDiffForFile` will return an object shaped like this:

```js
{
  dependencies: {
    added: ["chalk"],
    removed: [],
    after: { commander: "^2.9.0", debug: "^2.6.0", "spaced-between": "^1.1.1", typescript: "^2.2.1" },
    before: { commander: "^2.9.0", debug: "^2.6.0", typescript: "^2.2.1" },
  }
}
```

Danger can then look inside the added `keys` for your blacklisted module, and fail the build if it is included.

### Parsing the lockfile

You can trust that this dependency is going to be added directly to your project without it being highlighted in code
review, but you can't be sure that any updates to your dependency tree won't bring it in transitively. A transitive
dependency is one that comes in as a dependency of a dependency, one which isn't added to `packages.json` but is in
`node_modules`. So you're going to look at a simple rule that parses the text of the file for your blacklisted module.

```js
import fs from "fs"

const blacklist = "spaced-between"
const lockfile = fs.readFileSync("yarn.lock").toString()

if (lockfile.includes(blacklist)) {
  const message = `${blacklist} was added to our dependencies, see CVE #23`
  const hint = `To find out what introduced it, use \`yarn why ${blacklist}\`.`
  fail(`${message}<br/>${hint}`)
}
```

Note the use of `readFileSync`, as Danger is running as a script you'll find it simpler to use the synchronous methods
when possible. You could improve the above rule by making danger run `yarn why spaced-between` and outputting the text
into the messages. We do this in the [danger repo][danger-why] with `child-process` and `execSync`.

### Building from here

This should give you an idea on how to understand changes to your `node_modules`, from here you can create any rules you
want using a mix of `JSONDiffForFile`, `fs.readFileSync` and `child_process.execSync`. Here are a few ideas to get you
started:

- Convert the check for the package and lockfile to use `JSONDiffForFile` so that it only warns on `dependencies` or
  `devDependencies`.
- Ensure you never add `@types/[module]` to `dependencies` but only into `devDependencies`.
- When a new dependency is added, use a web-service like [libraries.io][libs] to describe the module inline.
- [Parse][yarn-parse] the `yarn.lock` file, to say how many transitive dependencies are added on every new dependency.
- When a dependency is removed, and no other dependencies are added, do a thumbs up 👍.

[started]: /js/guides/getting_started.html
[lockfile]: https://yarnpkg.com/lang/en/docs/yarn-lock/
[shrinkwrap]: https://docs.npmjs.com/cli/shrinkwrap
[danger-why]: https://github.com/danger/danger-js/blob/8fba6e7c301ac3459c2b0b93264bff7256efd8da/dangerfile.ts#L49
[libs]: https://libraries.io
[yarn-parse]: https://www.npmjs.com/package/parse-yarn-lock
