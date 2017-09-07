import { GitHub } from "../../GitHub"
import { GitHubAPI } from "../GitHubAPI"

import { GitCommit } from "../../../dsl/Commit"
import { FakeCI } from "../../../ci_source/providers/Fake"
import { readFileSync } from "fs"
import { resolve, join as pathJoin } from "path"
import { EOL } from "os"

const fixtures = resolve(__dirname, "..", "..", "_tests", "fixtures")

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = async (path: string): Promise<() => Promise<any>> => () =>
  Promise.resolve(JSON.parse(readFileSync(pathJoin(fixtures, path), {}).toString()))

/** Returns arbitrary text value from a request */
export const requestWithFixturedContent = async (path: string): Promise<() => Promise<string>> => () =>
  Promise.resolve(readFileSync(pathJoin(fixtures, path), {}).toString())

/**
 * HACKish: Jest on Windows seems to include some additional
 * whitespace that differs from non-Windows snapshot output,
 * so we strip these until we can better-address the issue.
 */
const stripWhitespaceForSnapshot = (str: string) => {
  return str.replace(/\s/g, "")
}

const pullRequestInfoFilename = "github_pr.json"
const masterSHA = JSON.parse(readFileSync(pathJoin(fixtures, pullRequestInfoFilename), {}).toString()).base.sha

describe("the dangerfile gitDSL", async () => {
  let github: GitHub = {} as any
  beforeEach(async () => {
    const api = new GitHubAPI(new FakeCI({}))
    github = new GitHub(api)

    api.getPullRequestInfo = await requestWithFixturedJSON(pullRequestInfoFilename)
    api.getPullRequestDiff = await requestWithFixturedContent("github_diff.diff")
    api.getPullRequestCommits = await requestWithFixturedJSON("github_commits.json")
    api.getFileContents = async (path, repoSlug, ref) => (await requestWithFixturedJSON(`static_file.${ref}.json`))()
  })

  it("sets the modified/created/deleted", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()

    expect(gitDSL.modified_files).toEqual([
      "CHANGELOG.md",
      "data/schema.graphql",
      "data/schema.json",
      "externals/metaphysics",
      "lib/__mocks__/react-relay.js",
      "lib/components/artist/about.js",
      "lib/components/gene/header.js",
      "lib/containers/__tests__/__snapshots__/gene-tests.js.snap",
      "lib/containers/__tests__/gene-tests.js",
      "lib/containers/gene.js",
      "tsconfig.json",
    ]) //tslint:disable-line:max-line-length

    expect(gitDSL.created_files).toEqual([
      "lib/components/gene/about.js",
      "lib/components/gene/biography.js",
      "lib/components/related_artists/index.js",
      "lib/components/related_artists/related_artist.js",
    ]) //tslint:disable-line:max-line-length

    expect(gitDSL.deleted_files).toEqual([
      "lib/components/artist/related_artists/index.js",
      "lib/components/artist/related_artists/related_artist.js",
      "lib/components/gene/about_gene.js",
    ]) //tslint:disable-line:max-line-length
  })

  it("shows the diff for a specific file", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()
    const { diff } = await gitDSL.diffForFile("tsconfig.json")

    expect(stripWhitespaceForSnapshot(diff)).toMatchSnapshot()
  })

  it("should include `before` text content of the file", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()
    const { before } = await gitDSL.diffForFile("tsconfig.json")

    expect(stripWhitespaceForSnapshot(before)).toMatchSnapshot()
  })

  it("should include `after` text content of the file", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()
    const { after } = await gitDSL.diffForFile("tsconfig.json")

    expect(stripWhitespaceForSnapshot(after)).toMatchSnapshot()
  })

  it("should include `added` text content of the file", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()
    const { added } = await gitDSL.diffForFile("tsconfig.json")

    expect(stripWhitespaceForSnapshot(added)).toMatchSnapshot()
  })

  it("should include `removed` text content of the file", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()
    const { removed } = await gitDSL.diffForFile("tsconfig.json")

    expect(stripWhitespaceForSnapshot(removed)).toMatchSnapshot()
  })

  it("resolves to `null` for files not in modified_files", async () => {
    const gitDSL = await github.getPlatformGitRepresentation()
    const result = await gitDSL.diffForFile("fuhqmahgads.json")

    expect(result).toBeNull()
  })

  it("sets up commit data correctly", async () => {
    const exampleCommit: GitCommit = {
      author: {
        date: "2016-09-30T13:52:14Z",
        email: "orta.therox@gmail.com",
        name: "Orta Therox",
      },
      committer: {
        date: "2016-09-30T13:52:14Z",
        email: "orta.therox@gmail.com",
        name: "Orta Therox",
      },
      message: "WIP on Gene",
      parents: ["98f3e73f5e419f3af9ab928c86312f28a3c87475"],
      sha: "13da2c844def1f4262ee440bd86fb2a3b021718b",
      tree: {
        sha: "d1b7448d7409093054efbb06ae12d1ffb002b956",
        url: "https://api.github.com/repos/artsy/emission/git/trees/d1b7448d7409093054efbb06ae12d1ffb002b956",
      },
      url: "https://api.github.com/repos/artsy/emission/commits/13da2c844def1f4262ee440bd86fb2a3b021718b",
    }
    const gitDSL = await github.getPlatformGitRepresentation()
    expect(gitDSL.commits[0]).toEqual(exampleCommit)
  })

  describe("JSONPatchForFile", () => {
    it("returns a null for files not in the change list", async () => {
      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONPatchForFile("fuhqmahgads.json")
      expect(empty).toEqual(null)
    })

    it("handles showing a patch for a created file", async () => {
      const before = ""

      const after = {
        a: "o, world",
        b: 3,
        c: ["one", "two", "three", "four"],
      }

      github.api.fileContents = async (path, repo, ref) => {
        const obj = ref === masterSHA ? before : after
        return obj === "" ? "" : JSON.stringify(obj)
      }

      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONPatchForFile("data/schema.json")
      expect(empty).toEqual({
        before: null,
        after: after,
        diff: [
          { op: "add", path: "/a", value: "o, world" },
          { op: "add", path: "/b", value: 3 },
          { op: "add", path: "/c", value: ["one", "two", "three", "four"] },
        ],
      })
    })

    it("handles showing a patch for a deleted file", async () => {
      const before = {
        a: "o, world",
        b: 3,
        c: ["one", "two", "three", "four"],
      }

      const after = ""

      github.api.fileContents = async (path, repo, ref) => {
        const obj = ref === masterSHA ? before : after
        return obj === "" ? "" : JSON.stringify(obj)
      }

      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONPatchForFile("data/schema.json")
      expect(empty).toEqual({
        before: before,
        after: null,
        diff: [{ op: "remove", path: "/a" }, { op: "remove", path: "/b" }, { op: "remove", path: "/c" }],
      })
    })

    it("handles showing a patch for two different diff files", async () => {
      const before = {
        a: "Hello, world",
        b: 1,
        c: ["one", "two", "three"],
      }

      const after = {
        a: "o, world",
        b: 3,
        c: ["one", "two", "three", "four"],
      }

      github.api.fileContents = async (path, repo, ref) => {
        const obj = ref === masterSHA ? before : after
        return JSON.stringify(obj)
      }

      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONPatchForFile("data/schema.json")
      expect(empty).toEqual({
        before,
        after,
        diff: [
          { op: "replace", path: "/a", value: "o, world" },
          { op: "replace", path: "/b", value: 3 },
          { op: "add", path: "/c/-", value: "four" },
        ],
      })
    })
  })

  describe("JSONDiffForFile", () => {
    it("returns an empty object for files not in the change list", async () => {
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
          e: ["five", "one", "three"],
        }

        const obj = ref === masterSHA ? before : after
        return JSON.stringify(obj)
      }
      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONDiffForFile("data/schema.json")
      expect(empty).toEqual({
        a: { after: "o, world", before: "Hello, world" },
        b: { after: 3, before: 1 },
        c: { added: ["four"], after: ["one", "two", "three", "four"], before: ["one", "two", "three"], removed: [] },
        d: { added: [], after: ["one", "two"], before: ["one", "two", "three"], removed: ["three"] },
        e: { added: ["five"], after: ["five", "one", "three"], before: ["one", "two", "three"], removed: ["two"] },
      })
    })

    it("handles a package.json change elegantly", async () => {
      github.api.fileContents = async (path, repo, ref) => {
        const before = {
          dependencies: {
            "babel-polyfill": "^6.20.0",
            chalk: "^1.1.1",
            commander: "^2.9.0",
            debug: "^2.6.0",
          },
          devDependencies: {
            "babel-cli": "^6.16.0",
            "babel-plugin-syntax-async-functions": "^6.13.0",
            "babel-plugin-transform-flow-strip-types": "^6.8.0",
          },
        }

        const after = {
          dependencies: {
            // "babel-polyfill": "^6.20.0",
            chalk: "^1.2.1", // from ^1.1.1 to ^1.2.1
            commander: "^2.9.0",
            debug: "^2.6.0",
          },
          devDependencies: {
            "babel-cli": "^6.16.0",
            "babel-plugin-typescript": "^2.2.0", // hah - I wish (added)
            "babel-plugin-syntax-async-functions": "^6.13.0",
            "babel-plugin-transform-flow-strip-types": "^6.8.0",
          },
        }

        const obj = ref === masterSHA ? before : after
        return JSON.stringify(obj)
      }
      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.JSONDiffForFile("data/schema.json")
      expect(empty).toEqual({
        dependencies: {
          added: [],
          after: { chalk: "^1.2.1", commander: "^2.9.0", debug: "^2.6.0" },
          before: { "babel-polyfill": "^6.20.0", chalk: "^1.1.1", commander: "^2.9.0", debug: "^2.6.0" },
          removed: ["babel-polyfill"],
        },
        devDependencies: {
          added: ["babel-plugin-typescript"],
          after: {
            "babel-cli": "^6.16.0",
            "babel-plugin-syntax-async-functions": "^6.13.0",
            "babel-plugin-transform-flow-strip-types": "^6.8.0",
            "babel-plugin-typescript": "^2.2.0",
          }, //tslint:disable-line:max-line-length
          before: {
            "babel-cli": "^6.16.0",
            "babel-plugin-syntax-async-functions": "^6.13.0",
            "babel-plugin-transform-flow-strip-types": "^6.8.0",
          },
          removed: [],
        },
      })
    })
  })

  describe("textDiffForFile", () => {
    it("returns a null for files not in the change list", async () => {
      const gitDSL = await github.getPlatformGitRepresentation()
      const empty = await gitDSL.diffForFile("fuhqmahgads.json")
      expect(empty).toEqual(null)
    })

    it("returns a diff for created files", async () => {
      const before = ""
      const after =
        "/* @flow */\n" +
        "'use strict'\n" +
        "import Relay from 'react-relay'\n" +
        "import React from 'react'\n" +
        "import { View, StyleSheet } from 'react-native'\n" +
        "import Biography from './biography'\n" +
        "import RelatedArtists from '../related_artists'\n" +
        "import Separator from '../separator'\n" +
        "class About extends React.Component\n"

      github.api.fileContents = async (path, repo, ref) => {
        return ref === masterSHA ? before : after
      }

      const gitDSL = await github.getPlatformGitRepresentation()
      const diff = await gitDSL.diffForFile("lib/components/gene/about.js")

      expect(diff.before).toEqual("")
      expect(diff.after).toMatch(/class About extends React.Component/)
      expect(diff.diff).toMatch(/class About extends React.Component/)
    })

    it("returns a diff for deleted files", async () => {
      const before =
        "'use strict'\n" +
        "import Relay from 'react-relay'\n" +
        "import React from 'react'\n" +
        "import { StyleSheet, View, Dimensions } from 'react-native'\n\n" +
        "class RelatedArtists extends React.Component"

      const after = ""

      github.api.fileContents = async (path, repo, ref) => {
        return ref === masterSHA ? before : after
      }

      const gitDSL = await github.getPlatformGitRepresentation()
      const diff = await gitDSL.diffForFile("lib/components/artist/related_artists/index.js")

      expect(diff.before).toMatch(/class RelatedArtists extends React.Component/)
      expect(diff.after).toEqual("")
      expect(diff.diff).toMatch(/class RelatedArtists extends React.Component/)
    })

    it("returns a diff for modified files", async () => {
      const before =
        `- [dev] Updates Flow to 0.32 - orta\n` +
        `- [dev] Updates React to 0.34 - orta\n` +
        `- [dev] Turns on "keychain sharing" to fix a keychain bug in sim - orta`

      const after = `- [dev] Updates Flow to 0.32 - orta
        - [dev] Updates React to 0.34 - orta
        - [dev] Turns on "keychain sharing" to fix a keychain bug in sim - orta
        - GeneVC now shows about information, and trending artists - orta`

      github.api.fileContents = async (path, repo, ref) => {
        return ref === masterSHA ? before : after
      }

      const gitDSL = await github.getPlatformGitRepresentation()
      const diff = await gitDSL.diffForFile("CHANGELOG.md")

      expect(diff.before).toEqual(before)
      expect(diff.after).toEqual(after)
      expect(diff.added).toEqual("+- GeneVC now shows about information, and trending artists - orta")
      expect(diff.removed).toEqual("")
      expect(diff.diff).toMatch(/GeneVC now shows about information, and trending artists/)
    })
  })
})
