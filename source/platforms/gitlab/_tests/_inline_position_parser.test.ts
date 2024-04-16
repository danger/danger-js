import { inlinePositionParser } from "../inlinePositionParser"
import { StructuredDiff } from "../../../dsl/GitDSL"
import { Chunk, Change, NormalChange, AddChange, DeleteChange } from "parse-diff"

const newPath = "path/to/new/file"

function createStructuredDiff(chunks: Chunk[], fromPath: string | undefined): StructuredDiff {
  return {
    chunks: chunks,
    fromPath: fromPath,
  }
}

function createChunk(changes: Change[], oldStart: number, oldLines: number, newStart: number, newLines: number): Chunk {
  return {
    content: "",
    changes: changes,
    oldStart: oldStart,
    oldLines: oldLines,
    newStart: newStart,
    newLines: newLines,
  }
}

function createNormalChange(ln1: number, ln2: number): NormalChange {
  return {
    type: "normal",
    ln1: ln1,
    ln2: ln2,
    normal: true,
    content: "",
  }
}

function createAddChange(ln: number): AddChange {
  return {
    type: "add",
    add: true,
    ln: ln,
    content: "",
  }
}

function createDeleteChange(ln: number): DeleteChange {
  return {
    type: "del",
    del: true,
    ln: ln,
    content: "",
  }
}

describe("inlinePositionParser", () => {
  it("If no matching chunk return requested line", async () => {
    const lineChange = 2
    const structuredDiff = createStructuredDiff([], newPath)
    const inlinePosition = inlinePositionParser(structuredDiff, newPath, lineChange)
    expect(inlinePosition).toStrictEqual({
      pathDiff: {
        oldPath: newPath,
        newPath: newPath,
      },
      lineDiff: {
        oldLine: lineChange,
        newLine: lineChange,
      },
    })
  })

  it("Handles deletes and adds on same line", async () => {
    const lineChange = 4
    const changes = [
      createNormalChange(1, 1),
      createNormalChange(2, 2),
      createNormalChange(3, 3),
      createDeleteChange(4),
      createDeleteChange(5),
      createAddChange(4),
      createAddChange(5),
      createNormalChange(6, 6),
    ]
    const chunks = [createChunk(changes, 1, 6, 1, 6)]
    const structuredDiff = createStructuredDiff(chunks, newPath)
    const inlinePosition = inlinePositionParser(structuredDiff, newPath, lineChange)
    expect(inlinePosition).toStrictEqual({
      pathDiff: {
        oldPath: newPath,
        newPath: newPath,
      },
      lineDiff: {
        oldLine: undefined,
        newLine: lineChange,
      },
    })
  })

  it("Handles renamed files", async () => {
    const lineChange = 7
    const oldPath = "path/to/old/file"
    const changes = [createNormalChange(4, 4), createNormalChange(5, 5), createNormalChange(6, 6), createAddChange(7)]
    const chunks = [createChunk(changes, 4, 3, 4, 4)]
    const structuredDiff = createStructuredDiff(chunks, oldPath)
    const inlinePosition = inlinePositionParser(structuredDiff, newPath, lineChange)
    expect(inlinePosition).toStrictEqual({
      pathDiff: {
        oldPath: oldPath,
        newPath: newPath,
      },
      lineDiff: {
        oldLine: undefined,
        newLine: lineChange,
      },
    })
  })

  it("Handles new files", async () => {
    const lineChange = 1
    const oldPath = undefined
    const changes = [createAddChange(1), createAddChange(2), createAddChange(3)]
    const chunks = [createChunk(changes, 0, 0, 1, 3)]
    const structuredDiff = createStructuredDiff(chunks, oldPath)
    const inlinePosition = inlinePositionParser(structuredDiff, newPath, lineChange)
    expect(inlinePosition).toStrictEqual({
      pathDiff: {
        oldPath: oldPath,
        newPath: newPath,
      },
      lineDiff: {
        oldLine: undefined,
        newLine: lineChange,
      },
    })
  })
})

describe("inlinePositionParser findRelevantChunk", () => {
  let structuredDiff: StructuredDiff
  const oldPath = newPath

  beforeEach(() => {
    const chunks = [
      createChunk(
        [
          createNormalChange(16, 16),
          createNormalChange(17, 17),
          createNormalChange(18, 18),
          createAddChange(19),
          createAddChange(20),
          createNormalChange(19, 21),
          createNormalChange(20, 22),
          createAddChange(23),
          createNormalChange(21, 24),
          createNormalChange(22, 25),
          createNormalChange(23, 26),
        ],
        16,
        8,
        16,
        11
      ),
      createChunk(
        [
          createNormalChange(25, 28),
          createNormalChange(26, 29),
          createNormalChange(27, 30),
          createAddChange(31),
          createAddChange(32),
          createNormalChange(28, 33),
          createNormalChange(29, 34),
          createDeleteChange(30),
          createAddChange(35),
          createAddChange(36),
          createNormalChange(31, 37),
          createNormalChange(32, 38),
          createAddChange(39),
          createAddChange(40),
          createNormalChange(33, 41),
          createNormalChange(34, 42),
          createNormalChange(35, 43),
        ],
        25,
        11,
        28,
        16
      ),
      createChunk(
        [
          createNormalChange(45, 53),
          createNormalChange(46, 54),
          createNormalChange(47, 55),
          createAddChange(56),
          createNormalChange(48, 57),
          createNormalChange(49, 58),
          createNormalChange(50, 59),
        ],
        45,
        6,
        53,
        7
      ),
    ]
    structuredDiff = createStructuredDiff(chunks, oldPath)
  })

  it("finds chunk containing line", async () => {
    const lineChange = 19
    const inlinePosition = inlinePositionParser(structuredDiff, newPath, lineChange)
    expect(inlinePosition).toStrictEqual({
      pathDiff: {
        oldPath: oldPath,
        newPath: newPath,
      },
      lineDiff: {
        oldLine: undefined,
        newLine: lineChange,
      },
    })
  })

  it("handles line below chunks", async () => {
    const lineChange = 1
    const inlinePosition = inlinePositionParser(structuredDiff, newPath, lineChange)
    expect(inlinePosition).toStrictEqual({
      pathDiff: {
        oldPath: oldPath,
        newPath: newPath,
      },
      lineDiff: {
        oldLine: lineChange,
        newLine: lineChange,
      },
    })
  })

  it("handles line above chunks", async () => {
    const lineChange = 65
    const inlinePosition = inlinePositionParser(structuredDiff, newPath, lineChange)
    expect(inlinePosition).toStrictEqual({
      pathDiff: {
        oldPath: oldPath,
        newPath: newPath,
      },
      lineDiff: {
        oldLine: 56,
        newLine: lineChange,
      },
    })
  })

  it("finds nearest chunk below the line", async () => {
    const lineChange = 48
    const inlinePosition = inlinePositionParser(structuredDiff, newPath, lineChange)
    expect(inlinePosition).toStrictEqual({
      pathDiff: {
        oldPath: oldPath,
        newPath: newPath,
      },
      lineDiff: {
        oldLine: 40,
        newLine: lineChange,
      },
    })
  })
})
