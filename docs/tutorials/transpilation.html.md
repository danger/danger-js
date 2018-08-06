---
title: Danger + Transpilation
subtitle: Danger + Transpilation
layout: guide_js
order: 3
blurb: How Danger's TypeScript/Babel integration works.
---

### Transpilation

Danger tries to pick up either Babel or TypeScript up at runtime. It does this by `require`ing both dependencies, which
will follow the standard [NodeJS require resolution](https://nodejs.org/api/modules.html#modules_all_together). If
either don't exist, then the Dangerfile will be treated as not needing transpilation and passed directly to the node
runtime.

A few notes:

- TypeScript is prioritized over Babel
- Babel 7 support for TypeScript is supported
- Whether you use `dangerfile.ts` or `dangerfile.js` is irrelevant, the environment matters more

### TypeScript gotchas

You might have a `src` folder where your actual source code is kept, and adding a `dangerfile.ts` at the root which will
break compilation. The answer to this is to add the dangerfile to the `"exclude"` section. Then to get inline errors
working correct, add it to the `"include"`. It's a neat little trick. You can see it working in
[artsy/emission#tsconfig.json][tsconfig]

```json
{
  "compilerOptions": {},
  "include": ["src/**/*.ts", "src/**/*.tsx", "dangerfile.ts"],
  "exclude": ["dangerfile.ts", "node_modules"]
}
```

### The "danger" module

The `danger` module is removed before evaluation, it's only there to fake your dev env into working correctly. In
reality, all of the exports are added to the global environment. If you import `"danger"` in code that isn't evaluated
inside Danger itself, it will raise an exception.

You can use something like jest's module mocking system to fake it in tests, letting you manipulate the object
`danger.github.pr` to look like whatever you want in tests:

```js
jest.mock("danger", () => jest.fn())
import * as danger from "danger"
const dm = danger as any

import { rfc5 } from "../org/all-prs"

beforeEach(() => {
  dm.fail = jest.fn()
})

it("fails when there's no PR body", () => {
  dm.danger = { github: { pr: { body: "" } } }
  return rfc5().then(() => {
    expect(dm.fail).toHaveBeenCalledWith("Please add a description to your PR.")
  })
})

it("does nothing when there's a PR body", () => {
  dm.danger = { github: { pr: { body: "Hello world" } } }
  return rfc5().then(() => {
    expect(dm.fail).not.toHaveBeenCalled()
  })
})
```

[tsconfig]: https://github.com/artsy/emission/blob/master/tsconfig.json
