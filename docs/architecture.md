## How does Danger JS work?

Danger provides an evaluation system for creating per-application rules. Basically, it is running arbitrary JavaScript
with some extra PR metadata added in at runtime.

Actually doing that though, is a bit of a process.

## Setup

**Step 1: CI**. Danger needs to figure out what CI we're running on. You can see them all in [
`source/ci_source/providers`][provs]. These use ENV VARs to figure out which CI `danger ci` is running on and validate
whether it is a pull request.

**Step 2: Platform**. Danger needs to know which platform the code review is happening in. Today, Danger supports
Github, Gitlab, BitBucket Server, and BitBucket Cloud. You can see them them all in [`source/platforms`][platforms].

**Step 3: JSON DSL**. To allow for all of:

- `danger ci` to evaluate async code correctly
- `danger process` to work with other languages
- `peril` to arbitrarily sandbox danger per-run on a unique docker container

Danger first generates a JSON DSL. This can be passed safely between processes, or servers. For `danger ci` the exposed
DSL is created as a [DangerDSLJSONType][dangerdsl] and this is passed into the hidden command [`danger runner`][runner].

**Step 4: DSL**. The JSON DSL is picked up from STDIN in `danger runner` and then converted into a
[DangerDSLType][dangerdsl]. This is basically where functions are added into the DSL.

**Step 5: Evaluation**. With the DSL ready, the [inline runner][in_runner] sets up a transpiled environment for
evaluating your code, and adds the DSL attributes into the global evaluation context. The Dangerfile has the
`import {...} from 'danger'` stripped, and then is executed inline.

**Step 6: Results**. Once the `danger runner` process is finished with evaluation, the results are passed back to the
the platform. The platform then chooses whether to create/delete/edit any messages in core review.

[provs]: https://github.com/danger/danger-js/tree/master/source/ci_source/providers
[dangerdsl]: https://github.com/danger/danger-js/blob/master/source/dsl/DangerDSL.ts
[runner]: https://github.com/danger/danger-js/blob/master/source/commands/danger-runner.ts
[in_runner]: https://github.com/danger/danger-js/blob/master/source/runner/runners/inline.ts
[platforms]: https://github.com/danger/danger-js/blob/master/source/platforms
