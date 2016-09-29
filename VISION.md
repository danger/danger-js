### Danger for JS

A year in, [Danger](https://github.com/danger/danger) is doing just fine. See the [original vision file](https://github.com/danger/danger/blob/master/VISION.md). This document assumes you have read it. 

The amount of issues we get in comparison to the number of downloads on Rubygems makes me feel pretty confident about her state of production quality and maturity. I wanted to start thinking about the larger patterns in software. At Artsy, we are starting to use JavaScript in many, many places.

I've explored [running JavaScript](https://github.com/danger/danger/pull/423) from the ruby Danger, ([example](https://github.com/artsy/emission/blob/d58b3d57bf41100e3cce3c2c1b1c4d6c19581a68/Dangerfile.js)) but this pattern isn't going to work on the larger scale: You cannot use npm modules, nor work with babel to transpile your `Dangerfile.js`. That isn't going to work.

This comes at the same time as thinking about a hosted version of Danger. This time around we can limit the exposed API to only something that can be obtained over the API on a hosted server. 

One technique for doing this is to lazy load information required, e.g. by default only get the PR metadata, and file changed. 

### So, initial vision?

* As few dependencies as possible
* Feel native to JS
* Provide Flow/TypeScript types for Danger objects
* Be API agnostic from day one
* If an exposed API can't be done via the APIs, it can't be done for that platform
* Re-use abstractions from the Gem when possible, it took a long time to get those
* Re-use CI source detection from Ruby Danger

### Plugins?

I can't see what that looks like yet. It could just be npm modules, and it's expected that you would import them like normal. JS naturally can give you the DSL structure that I had to make in Ruby.

### Documentation?

The website will stay devoted to the Danger gem, until this project starts to mature. We can link to it, It took 9 months for the gem before it was stable enough to think of large scale documentation.

### Example

``` js
import danger from 'danger'
import _ from 'lodash'

const hasAppChanges = _.filter(danger.git.modified_files, (path) =>
  return _.includes(path, 'lib/');
}.length > 0

if (hasAppChanges && _.includes(danger.git.modified_files, "CHANGELOG.md") === false) {
  fail("No CHANGELOG added.")
}

const testFiles = _.filter(danger.git.modified_files, (path) => {
  return _.includes(path, '__tests__/');
})

const logicalTestPaths = _.map(testFiles, (path) => {
  // turns "lib/__tests__/i-am-good-tests.js" into "lib/i-am-good.js"
  return path.replace(/__tests__\//, '').replace(/-tests\./, '.')
})

const sourcePaths = _.filter(danger.git.modified_files, (path) => {
  return _.includes(path, 'lib/') &&  !_.includes(path, '__tests__/');
})

// Check that any new file has a corresponding tests file
const untestedFiles = _.difference(sourcePaths, logicalTestPaths)
if (untestedFiles.length > 0) {
  warn("The following files do not have tests: " + danger.github.html_link(untestedFiles))
}
```