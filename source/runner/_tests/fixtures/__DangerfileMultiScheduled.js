/*eslint-disable */

debugger

schedule(
  new Promise(res => {
    setTimeout(() => {
      fail("Asynchronous Failure")
      res()
    }, 100)
  })
)

schedule(
  new Promise(res => {
    warn("Asynchronous Warning")
    res()
  })
)

schedule(
  new Promise(res => {
    setTimeout(() => {
      message("Asynchronous Message")
      res()
    }, 10)
  })
)

schedule(
  new Promise(res => {
    setTimeout(() => {
      markdown("Asynchronous Markdown")
      res()
    }, 50)
  })
)
