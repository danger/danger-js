import { join } from "path"

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
    usesProcessSeparationCommands.forEach((name) => {
      const re = new RegExp(`danger-${name}\.js$`)
      newJSFile = newJSFile.replace(re, "danger-runner.js")
    })

    // Support re-routing internally in npx for danger-ts
    // If I recall, npm 7 is getting an npx re-write, so it might
    // be worth recommending yarn, but that requires folks using yarn 2
    // which I'm not sure will ever get the same level of a adoption of yarn v1
    //
    if (newJSFile.includes("npx") && newJSFile.endsWith("danger-ts")) {
      newJSFile = join(
        newJSFile,
        "..",
        "..",
        "lib",
        "node_modules",
        "danger-ts",
        "node_modules",
        "danger",
        "distribution",
        "commands",
        "danger-runner.js"
      )
    }
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
