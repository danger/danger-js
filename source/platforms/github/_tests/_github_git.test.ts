import { GitHub } from "../../GitHub"
import { GitHubAPI } from "../GitHubAPI"

import { GitCommit } from "../../../dsl/Commit"
import { FakeCI } from "../../../ci_source/providers/Fake"
import { readFileSync } from "fs"
import { resolve } from "path"
import * as os from "os"

const fixtures = resolve(__dirname, "..", "..", "_tests", "fixtures")
const EOL = os.EOL

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = async (path: string): Promise<() => Promise<any>> => () => (
  Promise.resolve(JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString()))
)

/** Returns arbitrary text value from a request */
export const requestWithFixturedContent = async (path: string): Promise<() => Promise<string>> => () => (
  Promise.resolve(readFileSync(`${fixtures}/${path}`, {}).toString())
)

describe("the dangerfile gitDSL", async () => {
  let github: GitHub = {} as any
  beforeEach(async () => {
    const api = new GitHubAPI(new FakeCI({}))
    github = new GitHub(api)

    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")
    api.getPullRequestDiff = await requestWithFixturedContent("github_diff.diff")
    api.getPullRequestCommits = await requestWithFixturedJSON("github_commits.json")
    api.getFileContents = async (path, repoSlug, ref) => (await requestWithFixturedJSON(`static_file:${ref}.json`))()
  })

  it("sets the modified/created/deleted", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()

    expect(gitDSL.modified_files).toEqual(["CHANGELOG.md", "data/schema.graphql", "data/schema.json", "externals/metaphysics", "lib/__mocks__/react-relay.js", "lib/components/artist/about.js", "lib/components/gene/header.js", "lib/containers/__tests__/__snapshots__/gene-tests.js.snap", "lib/containers/__tests__/gene-tests.js", "lib/containers/gene.js", "tsconfig.json"]) //tslint:disable-line:max-line-length

    expect(gitDSL.created_files).toEqual(["lib/components/gene/about.js", "lib/components/gene/biography.js", "lib/components/related_artists/index.js", "lib/components/related_artists/related_artist.js"]) //tslint:disable-line:max-line-length

    expect(gitDSL.deleted_files).toEqual(["lib/components/artist/related_artists/index.js", "lib/components/artist/related_artists/related_artist.js", "lib/components/gene/about_gene.js"]) //tslint:disable-line:max-line-length
  })

  it("shows the diff for a specific file", async () => {
    const expected = ` - [dev] Updates Flow to 0.32 - orta${EOL} - [dev] Updates React to 0.34 - orta${EOL} - [dev] Turns on "keychain sharing" to fix a keychain bug in sim - orta${EOL}+- GeneVC now shows about information, and trending artists - orta${EOL} ${EOL} ### 1.1.0-beta.2${EOL} ` //tslint:disable-line:max-line-length
    const gitDSL = await github.getPlatformGitRepresentation()
    const {diff} = await gitDSL.diffForFile("CHANGELOG.md")

    expect(diff).toEqual(expected)
  })

  it("should show only diff of specified type", async () => {
    const expected = "+- GeneVC now shows about information, and trending artists - orta"
    const gitDSL = await github.getPlatformGitRepresentation()
    const {diff} = await gitDSL.diffForFile("CHANGELOG.md", ["add"])

    expect(diff).toEqual(expected)
  })

  it("should include `before` text content of the file", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()
    const {before} = await gitDSL.diffForFile("CHANGELOG.md")

    expect(before).toMatchSnapshot()
  })

  it("should include `after` text content of the file", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()
    const {after} = await gitDSL.diffForFile("CHANGELOG.md")

    expect(after).toMatchSnapshot()
  })

  it("sets up commit data correctly", async () => {
    const exampleCommit: GitCommit = {
      "author": {
        "date": "2016-09-30T13:52:14Z",
        "email": "orta.therox@gmail.com",
        "name": "Orta Therox",
      },
      "committer": {
        "date": "2016-09-30T13:52:14Z",
        "email": "orta.therox@gmail.com",
        "name": "Orta Therox",
      },
      "message": "WIP on Gene",
      "parents": ["98f3e73f5e419f3af9ab928c86312f28a3c87475"],
      "sha": "13da2c844def1f4262ee440bd86fb2a3b021718b",
      "tree": {
        "sha": "d1b7448d7409093054efbb06ae12d1ffb002b956",
        "url": "https://api.github.com/repos/artsy/emission/git/trees/d1b7448d7409093054efbb06ae12d1ffb002b956",
      },
      "url": "https://api.github.com/repos/artsy/emission/commits/13da2c844def1f4262ee440bd86fb2a3b021718b"
    }
    const gitDSL = await github.getPlatformGitRepresentation()
    expect(gitDSL.commits[0]).toEqual(exampleCommit)
  })

  describe("JSONPatchForFile", () => {
    it("returns a null for files not in the modified_files", async () => {
      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONPatchForFile("fuhqmahgads.json")
      expect(empty).toEqual(null)
    })

    it("handles showing a patch for two different diff files", async () => {
      const before = {
        a: "Hello, world",
        b: 1,
        c: ["one", "two", "three"]
      }

      const after = {
        a: "o, world",
        b: 3,
        c: ["one", "two", "three", "four"]
      }

      github.api.fileContents = async (path, repo, ref) => {
        const obj = (ref === "master") ? before : after
        return JSON.stringify(obj)
      }

      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONPatchForFile("data/schema.json")
      expect(empty).toEqual({
        before,
        after,
        diff: [
          { "op": "replace", "path": "/a", "value": "o, world" },
          { "op": "replace", "path": "/b", "value": 3 },
          { "op": "add", "path": "/c/-", "value": "four" }
        ]
      }
      )
    })
  })

  describe("JSONDiffForFile", () => {
    it("returns an empty object for files not in the modified_files", async () => {
      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONDiffForFile("fuhqmahgads.json")
      expect(empty).toEqual({})
    })

    it("handles showing a patch for two different diff files", async () => {
      github.api.fileContents = async (path, repo, ref) => {
        const before = {
          a: "Hello, world",
          b: 1,
          c: ["one", "two", "three"], // add
          d: ["one", "two", "three"], // remove
          e: ["one", "two", "three"], // replace
        }

        const after = {
          a: "o, world",
          b: 3,
          c: ["one", "two", "three", "four"],
          d: ["one", "two"],
          e: ["five", "one", "three"]
        }

        const obj = (ref === "master") ? before : after
        return JSON.stringify(obj)
      }
      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONDiffForFile("data/schema.json")
      expect(empty).toEqual({
        "a": { "after": "o, world", "before": "Hello, world" },
        "b": { "after": 3, "before": 1 },
        "c": { "added": ["four"], "after": ["one", "two", "three", "four"], "before": ["one", "two", "three"], "removed": [] },
        "d": { "added": [], "after": ["one", "two"], "before": ["one", "two", "three"], "removed": ["three"] },
        "e": { "added": ["five"], "after": ["five", "one", "three"], "before": ["one", "two", "three"], "removed": ["two"] }
      })
    })

    it("handles a package.json change elegantly", async () => {
      github.api.fileContents = async (path, repo, ref) => {
        const before = {
          "dependencies": {
            "babel-polyfill": "^6.20.0",
            "chalk": "^1.1.1",
            "commander": "^2.9.0",
            "debug": "^2.6.0"
          },
          "devDependencies": {
            "babel-cli": "^6.16.0",
            "babel-plugin-syntax-async-functions": "^6.13.0",
            "babel-plugin-transform-flow-strip-types": "^6.8.0",
          }
        }

        const after = {
          "dependencies": {
            // "babel-polyfill": "^6.20.0",
            "chalk": "^1.2.1", // from ^1.1.1 to ^1.2.1
            "commander": "^2.9.0",
            "debug": "^2.6.0"
          },
          "devDependencies": {
            "babel-cli": "^6.16.0",
            "babel-plugin-typescript": "^2.2.0", // hah - I wish (added)
            "babel-plugin-syntax-async-functions": "^6.13.0",
            "babel-plugin-transform-flow-strip-types": "^6.8.0",
          }
        }

        const obj = (ref === "master") ? before : after
        return JSON.stringify(obj)
      }
      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONDiffForFile("data/schema.json")
      expect(empty).toEqual({
        "dependencies": {
          "added": [],
          "after": { "chalk": "^1.2.1", "commander": "^2.9.0", "debug": "^2.6.0" },
          "before": { "babel-polyfill": "^6.20.0", "chalk": "^1.1.1", "commander": "^2.9.0", "debug": "^2.6.0" },
          "removed": ["babel-polyfill"]
        },
         "devDependencies": {
           "added": ["babel-plugin-typescript"],
           "after": { "babel-cli": "^6.16.0", "babel-plugin-syntax-async-functions": "^6.13.0", "babel-plugin-transform-flow-strip-types": "^6.8.0", "babel-plugin-typescript": "^2.2.0" }, //tslint:disable-line:max-line-length
           "before": { "babel-cli": "^6.16.0", "babel-plugin-syntax-async-functions": "^6.13.0", "babel-plugin-transform-flow-strip-types": "^6.8.0" },
           "removed": []
          }
      })
    })
  })
})
