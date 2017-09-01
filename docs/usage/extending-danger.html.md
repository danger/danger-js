---
title: Extending Danger
subtitle: Plugin creation
layout: guide_js
order: 0
blurb: How to take your rules, and make them accessible to more people by writing a Danger plugin.
---

You've built a few rules now, and you think you've wrote something that's useful in a more general sense. So, rather than copy & paste between all your Dangerfiles, it's time to move that code into a plugin.

A plugin in this context is nothing special, it's a node module that you create which exposes some functions. With luck, you should be able to basically copy and paste your rules - add a test or two and then you're good to go.

You can get started with the [danger-plugin](https://github.com/danger/generator-danger-plugin/) Yeoman generator. This will ask a few questions around your language choices and GitHub metadata.

-   `cd` to your JavaScript projects folder.
-   Install the Yeoman generator and our template: `npm i -g yo generator-danger-plugin`.
-   Start the process: `yo danger-plugin`.

This will either generate a JavaScript or TypeScript project, if you ask this biased author's opinion - try the TypeScript one. Mainly, because it comes with a great editor experience for VS Code. 

This project should look something like:

```sh
$ tree danger-plugin-yarn

├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE.md
├── README.md
├── package.json
├── src
│   ├── index.test.ts
│   └── index.ts
├── tsconfig.json
├── tslint.json
└── yarn.lock
```

### Writing your Plugin

The default template comes with an example of a simple Danger plugin in `src/index.{j,t}s`, which provides a default function that makes Danger post the title of the PR as a message. In the TypeScript version, there's a bunch of `declare`s at the top - this is so you can get the full type-system of the Danger DSL available.

This is the file where you want to paste in your existing Dangerfile code. Note, that you should not add a `import { danger, et, cetera } from "danger"` in your plugin. The dirty truth is that Danger completely ignores that at runtime, and just puts all of it's exports inside the global context. You'll get compiler errors, or confusing shadow variable issues. So assume that it's there, and working fine.

## Recommendations

* If you need to access the contents of a file in the repo, use `danger.github.utils.fileContents` instead of `fs.readFile`, this will mean that [Peril](https://github.com/danger/peril) (hosted Danger) will work with your plugin.

## Testing

Now that you're in the secret global club, you can see in `src/index.test.{j,t}s` that you can easily mock the Danger API. Calls like `warning`, `fail`, `message` and `markdown` can easily be tested via `jest.fn` mocks, and the Danger API can be stubbed by setting a JS object which is shaped how you'd like it to be. 

Should be pretty easy to make Act Arrange and Assert style tests with that infrastructure in place.

If you want to test locally against a known PR what I have done in the past is:

* Ship a 0.0.1 release to NPM
* Run `yarn link` inside my plugin's working directory
* Then in an app that uses Danger JS, I add the dependency with `yarn add [plugin] -d`
* Then I convert that dependency to use a symlink to my working directory with `yarn link [plugin]`
* Then I make sure that my library's transpiled code is always up-to-date with `yarn tsc -- --watch`
* _Now_ I can use `danger pr` to run any existing pull request: `yarn danger -- pr -v https://github.com/artsy/emission/pull/597`

Note that using `danger pr` more than 2-3 times would require that you send authenticated requests, so make sure that your shell has the environment `DANGER_GITHUB_API_TOKEN` set to a valid token.

## Shipping

With your code tested and ready, you can publish - update your app's `package.json` and import your new node module into your Dangerfile. Done and dusted.

With the Ruby version of Danger, we collate all of the plugins to highlight them on the homepage of the site - I'd like to do this again sometime, so please include the tag `"danger-plugin"` inside your `package.json`. Then at some point this website will pull all of the READMEs into the site.

Finally send us a tweet to [@DangerSystems](https://twitter.com/dangersystems) to let us know you've made something awesome.
