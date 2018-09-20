import pinpoint from "pinpoint"
import { DangerResults } from "../../../dsl/DangerResults"

/** Returns Markdown results to post if an exception is raised during the danger run */
const resultsForCaughtError = (file: string, contents: string, error: Error): DangerResults => {
  const match = /(\d+:\d+)/g.exec(error.stack!)
  let code
  if (match) {
    const [line, column] = match[0].split(":").map(value => parseInt(value, 10) - 1)
    code = pinpoint(contents, { line, column })
  } else {
    code = contents
  }
  const failure = `Danger failed to run \`${file}\`.`
  const errorMD = `## Error ${error.name}
\`\`\`
${error.message}
${error.stack}
\`\`\`
### Dangerfile
\`\`\`
${code}
\`\`\`
  `
  return { fails: [{ message: failure }], warnings: [], markdowns: [{ message: errorMD }], messages: [] }
}

export default resultsForCaughtError
