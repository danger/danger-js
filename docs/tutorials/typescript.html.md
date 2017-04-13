---
title: TypeScript + Danger JS
subtitle: Plugin creation
layout: guide_js
order: 0
---

### TypeScript

Danger is built in TypeScript, so we have great support keeping everything typed. 


### TypeScript without Jest

You'll need to take the following steps for danger to evaluate your `dangerfile.ts`:

* Install the `ts-jest` package - `yarn add ts-jest --dev`
* Add the following `jest` section to your `package.json`

```json
{
  "jest": {
    "transform": {
      ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    }
  }
}
```
