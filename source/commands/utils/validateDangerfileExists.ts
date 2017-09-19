import * as fs from "fs"

const validateDangerfileExists = (filePath: string): boolean => {
  let stat: fs.Stats | null = null
  try {
    stat = fs.statSync(filePath)
  } catch (error) {
    console.error(`Could not find a dangerfile at ${filePath}, not running against your PR.`)
    process.exitCode = 1
  }

  if (!!stat && !stat.isFile()) {
    console.error(`The resource at ${filePath} appears to not be a file, not running against your PR.`)
    process.exitCode = 1
  }

  return !!stat && stat.isFile()
}

export default validateDangerfileExists
