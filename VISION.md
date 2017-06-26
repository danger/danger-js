# Danger for JS

Two years in, and [Danger](https://github.com/danger/danger) Ruby is doing just fine. See the [original vision file](https://github.com/danger/danger/blob/master/VISION.md). This document assumes you have read it. 

The amount of issues we get in comparison to the number of downloads on Rubygems makes me feel pretty confident about her state of production quality and maturity. I wanted to start thinking about the larger patterns in software, because at Artsy, we are starting to use JavaScript in [for many teams](http://artsy.github.io/blog/2016/08/15/React-Native-at-Artsy/).

I've explored [running JavaScript](https://github.com/danger/danger/pull/423) from the ruby Danger, ([example](https://github.com/artsy/emission/blob/d58b3d57bf41100e3cce3c2c1b1c4d6c19581a68/Dangerfile.js) from production) but this pattern isn't going to work on the larger scale: You cannot use npm modules, nor work with babel/tsc to transpile your `Dangerfile.js` and the requirements on the integrating project to [feel weird](https://github.com/artsy/emission/pull/233). Running JS in Ruby isn't going to work for me.

This realization came at the same time as serious thinking on a hosted version of Danger. With a JavaScript versions we can limit the exposed Danger DSL to only something that can be obtained over the API remotely. By doing this, a hosted Danger does not need to clone and run the associated projects. This is essential for my sanity. I cannot run multiple [servers like CocoaDocs](http://cocoadocs.org). So far, I'm calling this Peril. You can consult the [vision file for Peril](https://github.com/danger/peril/blob/master/VISION.md) if you'd like.

# Where is Danger JS going?

You can see the roadmap for features for Danger JS by looking at things the Ruby version supports.

-   Inline comments in PRs
-   GitLab / BitBucket support
-   Bigger plugin ecosystem

However because of the addition of Peril, Danger JS should also look at:

-   Module or function whitelisting
-   Callback based Danger runs

### Example of a Dangerfile.js

```js
import danger from 'danger'
import _ from 'lodash'

const hasAppChanges = _.filter(danger.git.modified_files, (path) => {
  return _.includes(path, 'lib/');
}).length > 0

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
