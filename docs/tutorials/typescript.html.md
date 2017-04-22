---
title: Danger + TypeScript
subtitle: Danger + TypeScript
layout: guide_js
order: 3
---

### TypeScript

Danger is built in TypeScript, so we have great editor support as a consumer. If you are using Jest for testing, 
then the only thing you need to do is change your Dangerfile to be `dangerfile.ts` and Danger will pick it up.

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
