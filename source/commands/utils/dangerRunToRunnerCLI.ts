const usesProcessSeparationCommands = ["ci", "pr", "local"]

const dangerRunToRunnerCLI = (argv: string[]) => {
  let newCommand = []
  newCommand.push(argv[0])

  // e.g. node --inspect distribution/commands/danger-run-ci.js --dangerfile myDangerfile.ts
  // or node distribution/commands/danger-pr.js --dangerfile myDangerfile.ts

  if (argv.length === 1) {
    return ["danger", "runner"]
  } else if (argv[0].includes("node") || process.pkg != null) {
    // convert
    let newJSFile = argv[1]
    usesProcessSeparationCommands.forEach(name => {
      newJSFile = newJSFile.replace("danger-" + name, "danger-runner")
    })

    newCommand.push(newJSFile)
    for (let index = 2; index < argv.length; index++) {
      newCommand.push(argv[index])
    }
  } else {
    // e.g. danger ci --dangerfile
    // if you do `danger run` start looking at args later
    newCommand.push("runner")
    let index = usesProcessSeparationCommands.includes(argv[1]) ? 2 : 1
    for (; index < argv.length; index++) {
      newCommand.push(argv[index])
    }
  }

  return newCommand
}

export default dangerRunToRunnerCLI
