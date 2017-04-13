---
title: Danger + Node Library
subtitle: Plugin creation
layout: guide_js
order: 0
---

## Before we get started

This guide continues after "[Getting Started][started]" - so you should have seen Danger comment on your PRs.

## Keeping on top of your library

* CHANGELOG (checking for lib changes)
* Dependencies
* Release PRs
* Interacting with your source, eg. 

``` js
// Always ensure we name all CI providers in the README. These
// regularly get forgotten on a PR adding a new one.

import { realProviders } from "./source/ci_source/providers"
import Fake from "./source/ci_source/providers/Fake"
const readme = fs.readFileSync("README.md").toString()
const names = realProviders.map(p => new p({}).name)
const missing = names.filter(n => !readme.includes(n))
if (missing.length) {
  warn(`These providers are missing from the README: ${sentence(missing)}`)
}
```

and our `danger.d.ts` checks
