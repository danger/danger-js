const asyncAction = () =>
  new Promise(res => {
    setTimeout(() => {
      warn("Async Function")
      res()
    }, 50)
  })

schedule(async () => {
  await asyncAction()
  warn("After Async Function")
})
