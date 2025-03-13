// This file represents the module that is exposed as the danger API

throw `
Hey there, it looks like you're trying to import the danger module. Turns out
that the code you write in a Dangerfile.js is actually a bit of a sneaky hack.

When running Danger, the import or require for Danger is removed before the code
is evaluated. Instead all of the imports are added to the global runtime, so if
you are importing Danger to use one of it's functions - you should instead just
use the global object for the root DSL elements.

There is a thread for discussion here:
  - https://github.com/danger/danger-js/discussions/1153#discussioncomment-10981472
`
