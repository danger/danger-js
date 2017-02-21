/*eslint-disable */
const Rx = require('rxjs')

warn("this is a warning")
message("this is a message")

const p = new Promise(resolve => setTimeout(() => resolve(50), 50))

p.then(_=> {
  fail("this is a failure")
})

Rx.Observable.timer(50).subscribe(x => {
  markdown("this is a *markdown*")
})