import { DangerResults } from "../../dsl/DangerResults"

export const markdownCode = (string: string): string => `
\`\`\`sh
${string}
\`\`\`
`
export const resultsWithFailure = (failure: string, moreMarkdown?: string): DangerResults => {
  const fail = { message: failure }
  return {
    warnings: [],
    messages: [],
    fails: [fail],
    markdowns: moreMarkdown ? [moreMarkdown] : [],
  }
}
