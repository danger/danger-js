# danger-js

Danger on Node, wonder what's going on? see [VISION.md](VISION.md)

### Get started?

This is like, pretty early. If you can take a bit of heat, it's usable in production.

However, 

``` sh
git clone https://github.com/danger/danger-js.git
cd danger-js

# if you don't have have yarn installed
npm install -g yarn
 
yarn install
```

You can then verify your install by running the tests, and the linters:

``` sh
npm test
npm run lint
npm run flow
``` 

---

### Dev Life

We use quite a few semi-bleeding edge features of JS in Danger. Please see the [glossary for an overview](docs/js_glossary.md). Notably Flow, Interfaces, Async/Await and Typealiases. 

You'll have a nicer experience as a developer if you use VS Code with Flow enabled, and if you install flow-typed.

``` sh
npm install -g flow-typed
flow-typed install
```

( and maybe `flow-typed install jest@14`)

Tips:

* You can run the `danger` command globally from your dev build by running `npm run link`.
* If you're using VS Code, press Run to start an example run, should go through most of the process with a debugger attatched. Either use breakpoints, or add `debugger` to get a repl and context.

### What is the TODO?

* a GitHub/GitLab [request source](https://github.com/danger/danger/tree/c7880ebd870407e9effa1bb4295540d1fa6b4bbc/lib/danger/request_sources) (avoid deps for these)
* All of the [CI sources](https://github.com/danger/danger/tree/c7880ebd870407e9effa1bb4295540d1fa6b4bbc/lib/danger/ci_source) from Danger-rb  ( these will be easy )
* A way to do git.diff metadata see [EnvironmentManager](https://github.com/danger/danger/blob/c7880ebd870407e9effa1bb4295540d1fa6b4bbc/lib/danger/danger_core/environment_manager.rb) for setup, needs to get info from request source

The aim is to be able to have this library self testing with Danger-js ASAP, then smarter abstractions can be thought about.

