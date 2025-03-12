jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  realpathSync: {},
  existsSync: jest.fn(),
  statSync: jest.fn(),
  stat: jest.fn(),
}))
jest.mock("path", () => {
  const path = jest.requireActual("path")
  return { ...path, resolve: jest.fn(path.resolve) }
})

import { typescriptify, lookupTSConfig, dirContains, babelify } from "../transpiler"
import * as fs from "fs"
import * as path from "path"

describe("typescriptify", () => {
  it("removes the module option in a tsconfig", () => {
    const dangerfile = `import {a} from 'lodash'; a()`
    const fakeTSConfig = {
      compilerOptions: {
        target: "es5",
        module: "es2015",
      },
    }
    const fsMock = fs.readFileSync as jest.Mock
    fsMock.mockImplementationOnce(() => JSON.stringify(fakeTSConfig))

    expect(typescriptify(dangerfile, "/a/b")).not.toContain("import")
  })
})

/** Normalizes path to platform-specific */
function n(p: string) {
  if (path.sep !== "/") {
    return p.split("/").join(path.sep)
  }
  return p
}

describe("lookupTSConfig", () => {
  function setup(cwd: string, configDir: string) {
    cwd = n(cwd)
    configDir = n(configDir)
    // mock path.resolve to be relative to cwd
    const actualPath = jest.requireActual("path") as typeof path
    const resolve = path.resolve as jest.Mock
    resolve.mockImplementation((p: string = "") => actualPath.resolve(cwd, p))

    const existsSync = fs.existsSync as jest.Mock
    const tsconfigPath = path.resolve(path.join(configDir, "tsconfig.json"))
    existsSync.mockImplementation((f: string) => path.resolve(f) === tsconfigPath)
  }

  it("can find in the same folder as dangerfile", () => {
    setup("/a", "/c")
    expect(lookupTSConfig(n("/c"))).toBe(n("/c/tsconfig.json"))
  })

  it("can find in a parent folder", () => {
    setup("/a", "/a/b")
    expect(lookupTSConfig(n("./b/c"))).toBe(n("b/tsconfig.json"))
  })

  it("can find in the working dir", () => {
    setup("/a", "/a")
    expect(lookupTSConfig(n("/c"))).toBe("tsconfig.json")
  })

  it("cannot find in a directory higher than current", () => {
    setup("/a/b", "/a")
    expect(lookupTSConfig(n("/a/b/c"))).toBe(null)
  })
})

describe("dirContains", () => {
  it("identifies what directory contains", () => {
    expect(dirContains(n("/a"), n("/a/b"))).toBe(true)
    expect(dirContains(n("/a/b"), n("/a"))).toBe(false)
    expect(dirContains(n("/a"), n("/a"))).toBe(true)
  })

  if (path.sep === "\\") {
    it("identifies what directory contains on win32", () => {
      expect(dirContains(`c:\\a`, `c:\\a\\b`)).toBe(true)
      expect(dirContains(`c:\\a`, `c:\\a`)).toBe(true)
      expect(dirContains(`c:\\a`, `d:\\a\\b`)).toBe(false)
      expect(dirContains(`c:\\a`, `d:\\a`)).toBe(false)
    })
  }
})

describe("babelify", () => {
  it("does not throw when a filepath is ignored due to babel options, and should return the content unchanged", () => {
    const dangerfile = `import { a } from 'lodash';
a();`

    const actualFs = jest.requireActual("fs") as typeof fs
    const existsSyncMock = fs.existsSync as jest.Mock
    const statSyncMock = fs.statSync as jest.Mock
    existsSyncMock.mockImplementation((path) => path === "/a/b/babel.config.js" || actualFs.existsSync(path))
    statSyncMock.mockImplementation((path) =>
      // browserslist gets called by babelify, and browserslist checks for all imported things to see if they're directories
      path === "/a/b/babel.config.js" ? { isDirectory: () => false } : actualFs.statSync(path)
    )
    jest.mock(
      "/a/b/babel.config.js",
      () => {
        return { ignore: ["/a/b"] }
      },
      { virtual: true }
    )
    const act = () => babelify(dangerfile, "a/b/", [])

    expect(act).not.toThrow()
    expect(act()).toEqual(dangerfile)
  })
})
