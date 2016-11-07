## New to ES6 + Flow?

I came to JS at a great point in time, a lot of the tools used in native code that offer so much programming safety are now available and easy to use in JS. Sometimes it feels like Ruby, but with useful editor feedback. 👍. 

### Flow

[Flow](https://flowtype.org) is a fascinating tool that infers types through-out your codebase. Flow will give you realtime feedback on the health of your code, so make sure you have it installed in whatever editor you use.

Danger uses a lot of Flow, we have a lot of linters for it too, so instead of writing a function like:

```js
function getPlatformForEnv(env, source) {
  return [...]
}
```

We would write it like this:

```js
function getPlatformForEnv(env: Env, source: CISource): ?Platform {
 return [...]
}
```

This means that throughout the project we know the shape of the objects 
that are being passed around. We do this via Interfaces as much as possible. 

#### Interfaces

This is an interface:

```js
/** An API representation for a Code Review site */
export interface Platform {
    /** Mainly for logging and error reporting */
    name: string;
    /** Used internally for getting PR/Repo metadata */
    ciSource: CISource;
    /** Pulls in the Code Review Metadata for inspection */
    getReviewInfo: () => Promise<any>;
    /** Pulls in the Code Review Diff, and offers a succinct user-API for it */
    getReviewDiff: () => Promise<GitDSL>;
    /** Creates a comment on the PR */
    createComment: (body: string) => Promise<?Comment>;
    /** Delete the main Danger comment */
    deleteMainComment: () => Promise<bool>;
    /** Replace the main Danger comment */
    editMainComment: (newComment: string) => Promise<any>;
    /** Replace the main Danger comment */
    updateOrCreateComment: (newComment: string) => Promise<any>;
}
```

It defines the shape of an object, e.g. what functions/properties it will it have.
This means that you can expose the least about an object, but you can be certain that if someone refactors the object it will highlight the uses.

We use this a lot instead of object inheritence for things like CI Sources (e.g. Travis, Circle, Semaphor etc) they all have the same shape. Inside Danger we can only work against the shared interface instead of the private internals.  

Here is an example of an object that conforms to that interface:

```js
export class GitHub {
  token: APIToken
  ciSource: CISource
  name: string

  constructor(token: APIToken, ciSource: CISource) {
    this.token = token
    this.ciSource = ciSource
    this.name = "GitHub"
  }

  /**
   * Get the Code Review description metadata
   *
   * @returns {Promise<any>} JSON representation
   */
  async getReviewInfo() : Promise<any> {
    const details = await this.getPullRequestInfo()
    return await details.json()
  }

  [...]
```

It contains a `name` and a `ciSource`, but also a `token`. The constructor is also not inside the interface. The `token` and `constructor` are hidden to `GitHub` instances which are reffered to via the `Platform` interface. This is great.  

Useful notes:

* You do not mention that a function is async here. They just need to wrap their return values.
* When an interface is changed, the Flow error message that your object does not conform to the interface will be placed on a LOC where the class is starting to be used as an interface. E.g. a place where a real instance is `new`'d and then returned as the Interface.

### Async Await

This took me a bit of time to get my head around. An Async function is just some useful syntax sugar around promises.

* You cannot use `await` inside a function that has not been declared `async`. 
* Anything you do return will be implicitly wrapped in a Promise
* Non-async functions can just handle the promise an `async` function returns  

So, a typical `async` function

``` js
  async getReviewInfo() : Promise<any> {              // this function will do async
    const details = await this.getPullRequestInfo()   // wait for the promise in getPullRequestInfo to resolve 
    return await details.json()                       // wait for the promise in json to resolve
  }                                                   // return the json
```

And a non-async function, that is optimised for _using_ inside an async function. This happens when you have closure based callbacks, which need to be wrapped into promises.

```js
  readFile(path: String): Promise<string> {                       // returns a promise with a string
    return new Promise((resolve: any, reject: any) => {           // create a new promise, with 2 callbacks
      fs.readFile(path, "utf8", (err: Error, data: string) => {   // do the work
        if (err) { return reject(err) }                           // did it fail? reject the promise
        resolve(data)                                             // did it pass? resolve the promise
      })
    })
  }
```

The `await` part of an `async` function will now wait on synchronous execution until the promise has resolved.

### Types Tricks

#### Importing

Flow comes with a unique way to import types.

```js
import type { Env } from "./ci_source"
```

This exposes the Env type to the current file, when compiled it be erased.

#### Typealias

If you have a special case example of a literal, you should consider using a typealias. Ash Furrow wrote a great example of why we came to use them a [lot in Swift](http://artsy.github.io/blog/2016/06/24/typealias-for-great-good/). Some examples from the current Danger codebase:

* An `Env` type, that maps to `any`.
* An `APIToken` type, that maps to `strings`.

Note: If you think you're being clever by having a both ES6 classes, and Flow interfaces exported from the same file - don't, it's not worked well for me so far. Odd transpilation errors. 

#### Tests + Types

Realistically, it's a bit too early for me to be writing about that. Here as a stub for later.