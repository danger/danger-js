import * as fs from "fs"

// Update the CHANGELOG with the new version

const changelog = fs.readFileSync("CHANGELOG.md", "utf8")
const newCHANGELOG = changelog.replace(
  "<!-- Your comment below this -->",
  `<!-- Your comment below this -->

# ${process.env.VERSION}
`
)
fs.writeFileSync("CHANGELOG.md", newCHANGELOG, "utf8")
