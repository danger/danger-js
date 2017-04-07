const quotes = "```"

export default (error: Error) => `
## Danger has errored

Error: ${error.name}

${quotes}sh
${error.stack}
${quotes}

`
