jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}))

import { typescriptify } from "../transpiler"
import * as fs from "fs"

describe("typescriptify", () => {
  it("removes the module option in a tsconfig ", () => {
    const dangerfile = `import {a} from 'lodash'; a()`
    const fakeTSConfig = {
      compilerOptions: {
        target: "es5",
        module: "es2015",
      },
    }
    const fsMock = fs.readFileSync as any
    fsMock.mockImplementationOnce(() => JSON.stringify(fakeTSConfig))

    expect(typescriptify(dangerfile)).not.toContain("import")
  })
})
