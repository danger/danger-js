const buildHeader = (headers: string[]): string =>
  `| ${headers.join(" | ")} |\n` + `| ${headers.map(_ => "---").join(" | ")} |`

const buildRow = (row: string[]): string => `| ${row.join(" | ")} |`

const buildRows = (rows: string[][]): string => rows.map(buildRow).join("\n")

export function template(headers: string[], rows: string[][]): string {
  return `${buildHeader(headers)}\n` + `${buildRows(rows)}`
}
