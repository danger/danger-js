---
title: Troubleshooting
subtitle: Plugin creation
layout: guide
order: 0
---

### I only want to run Danger for internal contributors

Let's say you run Danger on the same CI service that deploys your code. If that's open source, you don't want to be letting anyone pull out your private env vars. The work around for this is to not simply call Danger on every test run:

``` sh
'[ ! -z $DANGER_GITHUB_API_TOKEN ] && yarn danger || echo "Skipping Danger for External Contributor"'
```  

This ensures that Danger only runs when you have the environment variables set up to run. This is how Danger works for a lot of the mobile projects work in Artsy.

### I'm seeing a lot of Cannot read property 'bind' in my tests

This causes all of your tests to fail.

```
  ● Test suite failed to run

    TypeError: Cannot read property 'bind' of undefined

      at Runtime._createRuntimeFor (node_modules/jest-cli/node_modules/jest-runtime/build/index.js:709:52)
      at handle (node_modules/worker-farm/lib/child/index.js:41:8)
      at process.<anonymous> (node_modules/worker-farm/lib/child/index.js:47:3)
      at emitTwo (events.js:106:13)
      at process.emit (events.js:191:7)
```

This seems to happen when you have multiple versions of Jest inside the same project. Danger aims to keep up to date with the latest Jest versions. So you may need to update one or the other. There's [more information here](https://github.com/facebook/jest/issues/3114).
