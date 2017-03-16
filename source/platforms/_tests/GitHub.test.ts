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
export const requestWithFixturedJSON = async (path: string): Promise<any> => {
  const json = JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString())
  return () => {
    return {
      json: () => Promise.resolve(json)
    }
  }
}

/** Returns arbitrary text value from a request */
export const requestWithFixturedContent = async (path: string): Promise<any> => {
  const content = readFileSync(`${fixtures}/${path}`, {}).toString()
  return () => {
    return {
      text: () => Promise.resolve(content)
    }
  }
}

describe("with fixtured data", () => {
  it("returns the correct github data", async () => {
    const mockSource = new FakeCI({})
    const api = new GitHubAPI(mockSource)
    const github = new GitHub(api)
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")
    api.getPullRequestCommits = await requestWithFixturedJSON("github_commits.json")

    const info = await github.getReviewInfo()
    expect(info.title).toEqual("Adds support for showing the metadata and trending Artists to a Gene VC")
  })

  describe("the dangerfile gitDSL", async () => {
    let github: GitHub = {} as any
    beforeEach(async () => {
      const api = new GitHubAPI(new FakeCI({}))
      github = new GitHub(api)

      const res = await requestWithFixturedContent("github_diff.diff")
      api.getPullRequestDiff = res().text
      const jsonFixtures = await requestWithFixturedJSON("github_commits.json")
      api.getPullRequestCommits = jsonFixtures().json
    })

    it("sets the modified/created/deleted", async () => {
      const gitDSL = await github.getReviewDiff()

      expect(gitDSL.modified_files).toEqual(["CHANGELOG.md", "data/schema.graphql", "data/schema.json", "externals/metaphysics", "lib/__mocks__/react-relay.js", "lib/components/artist/about.js", "lib/components/gene/header.js", "lib/containers/__tests__/__snapshots__/gene-tests.js.snap", "lib/containers/__tests__/gene-tests.js", "lib/containers/gene.js", "tsconfig.json"]) //tslint:disable-line:max-line-length

      expect(gitDSL.created_files).toEqual(["lib/components/gene/about.js", "lib/components/gene/biography.js", "lib/components/related_artists/index.js", "lib/components/related_artists/related_artist.js"]) //tslint:disable-line:max-line-length

      expect(gitDSL.deleted_files).toEqual(["lib/components/artist/related_artists/index.js", "lib/components/artist/related_artists/related_artist.js", "lib/components/gene/about_gene.js"]) //tslint:disable-line:max-line-length
    })

    it("shows the diff for a specific file", async () => {
      const expected = ` - [dev] Updates Flow to 0.32 - orta${EOL} - [dev] Updates React to 0.34 - orta${EOL} - [dev] Turns on "keychain sharing" to fix a keychain bug in sim - orta${EOL}+- GeneVC now shows about information, and trending artists - orta${EOL} ${EOL} ### 1.1.0-beta.2${EOL} ` //tslint:disable-line:max-line-length
      const gitDSL = await github.getReviewDiff()

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
      const gitDSL = await github.getReviewDiff()
      expect(gitDSL.commits[0]).toEqual(exampleCommit)
    })
  })
})
