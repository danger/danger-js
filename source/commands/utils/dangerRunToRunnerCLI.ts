const dangerRunToRunnerCLI = (argv: string[]) => {
  let newCommand = []
  newCommand.push(argv[0])

  // e.g. node --inspect distribution/commands/danger-run.js --dangerfile myDangerfile.ts
  if (argv.length === 1) {
    return ["danger", "runner"]
  } else if (argv[0].includes("node")) {
    newCommand.push(argv[1].replace("-run", "-runner"))
    for (let index = 2; index < argv.length; index++) {
      newCommand.push(argv[index])
    }
  } else {
    // e.g. danger --dangerfile
    // if you do `danger run` start looking at args later
    newCommand.push("runner")
    let index = argv[1] === "run" ? 2 : 1
    for (; index < argv.length; index++) {
      newCommand.push(argv[index])
    }
  }

  return newCommand
}

export default dangerRunToRunnerCLI
