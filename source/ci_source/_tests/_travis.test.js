
test("adds 1 + 2 to equal 3", () => {
  // import { Travis } from "../travis.js"
  let Travis = require("../travis.js")
  let travis = new Travis({thing: ""})
  expect(travis.env).toBe({thing: ""})
})
