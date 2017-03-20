import { GitHub } from "../GitHub"
import { GitHubAPI } from "../github/GitHubAPI"

import { GitCommit } from "../../dsl/Commit"
import { FakeCI } from "../../ci_source/providers/Fake"
import { readFileSync } from "fs"
import { resolve } from "path"
import * as os from "os"

const fixtures = resolve(__dirname, "fixtures")
const EOL = os.EOL

// Gets a mocked out GitHub class for checking a get path
const mockGitHubWithGetForPath = (expectedPath): GitHub => {
  const mockSource = new FakeCI({})

  const api = new GitHubAPI(mockSource)
  const github = new GitHub(api)

  api.get = (path: string, headers: any = {}, body: any = {}, method: string = "GET"): Promise<any> => {
    return new Promise((resolve: any, reject: any) => {
      expect(path).toBe(expectedPath)
      resolve({})
    })
  }

  return github
}

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = async (path: string): Promise<() => Promise<any>> => () => (
  Promise.resolve(JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString()))
)

/** Returns arbitrary text value from a request */
export const requestWithFixturedContent = async (path: string): Promise<() => Promise<string>> => () => (
  Promise.resolve(readFileSync(`${fixtures}/${path}`, {}).toString())
)

describe("with fixtured data", () => {
  it("returns the correct github data", async () => {
    const mockSource = new FakeCI({})
    const api = new GitHubAPI(mockSource)
    const github = new GitHub(api)
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    const info = await github.getReviewInfo()
    expect(info.title).toEqual("Adds support for showing the metadata and trending Artists to a Gene VC")
  })

  describe("the dangerfile gitDSL", async () => {
    let github: GitHub = {} as any
    beforeEach(async () => {
      const api = new GitHubAPI(new FakeCI({}))
      github = new GitHub(api)

      api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")
      api.getPullRequestDiff = await requestWithFixturedContent("github_diff.diff")
      api.getPullRequestCommits = await requestWithFixturedJSON("github_commits.json")
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

      expect(gitDSL.diffForFile("CHANGELOG.md")).toEqual(expected)
    })

    it("sets up commit data correctly", async () => {
      const exampleCommit: GitCommit = {
        "author":  {
          "date": "2016-09-30T13:52:14Z",
          "email": "orta.therox@gmail.com",
          "name": "Orta Therox",
        },
        "committer":  {
          "date": "2016-09-30T13:52:14Z",
          "email": "orta.therox@gmail.com",
          "name": "Orta Therox",
        },
        "message": "WIP on Gene",
        "parents":  ["98f3e73f5e419f3af9ab928c86312f28a3c87475"],
        "sha": "13da2c844def1f4262ee440bd86fb2a3b021718b",
        "tree": {
          "sha": "d1b7448d7409093054efbb06ae12d1ffb002b956",
          "url": "https://api.github.com/repos/artsy/emission/git/trees/d1b7448d7409093054efbb06ae12d1ffb002b956",
        },
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
          diff: [{"op": "replace", "path": "/a", "value": "o, world"},
          {"op": "replace", "path": "/b", "value": 3},
          {"op": "add", "path": "/c/-", "value": "four"}
        ]}
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
          "a": {"after": "o, world", "before": "Hello, world"},
          "b": {"after": 3, "before": 1},
          "c": {"added": ["four"], "after": ["one", "two", "three", "four"], "before": ["one", "two", "three"], "removed": []},
          "d": {"added": [], "after": ["one", "two"], "before": ["one", "two", "three"], "removed": ["three"]},
          "e": {"added": ["five"], "after": ["five", "one", "three"], "before": ["one", "two", "three"], "removed": ["two"]}
        })
      })
    })
  })
})
