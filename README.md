# danger-js

Danger on Node 

### Get started?

This is like, really, really early.

However, 

``` sh
git clone https://github.com/danger/danger-js.git
cd danger-js
npm install
```

You can then verify your install by running the tests, and the linters:

``` sh
npm test
npm run lint
npm run flow
``` 

---

You'll have a nicer experience as a developer if you use VS Code with Flow enabled, and if you install typings.

``` sh
npm install -g typings
typings install
```  

### What is the TODO?

* a GitHub/GitLab [request source](https://github.com/danger/danger/tree/c7880ebd870407e9effa1bb4295540d1fa6b4bbc/lib/danger/request_sources) (avoid deps for these)
* All of the [CI sources](https://github.com/danger/danger/tree/c7880ebd870407e9effa1bb4295540d1fa6b4bbc/lib/danger/ci_source) from Danger-rb  ( these will be easy )
* A way to do git.diff metadata see [EnvironmentManager](https://github.com/danger/danger/blob/c7880ebd870407e9effa1bb4295540d1fa6b4bbc/lib/danger/danger_core/environment_manager.rb) for setup, needs to get info from request source

The aim is to be able to have this library self testing with Danger-js ASAP, then smarter abstractions can be thought about.
