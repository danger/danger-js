import { StructuredDiff } from "../../dsl/GitDSL"
import { debug } from "../../debug"
import { Chunk } from "parse-diff"

const d = debug("GitLab inlinePositionParser")

export interface InlinePosition {
  pathDiff: PathDiff
  lineDiff: LineDiff
}

export interface PathDiff {
  oldPath: string | undefined
  newPath: string
}

export interface LineDiff {
  oldLine: number | undefined
  newLine: number | undefined
}

export function inlinePositionParser(structuredDiff: StructuredDiff, path: string, line: number): InlinePosition {
  d("structuredDiff", structuredDiff)
  const lineDiff = calculateLineDiff(structuredDiff, line)
  return {
    pathDiff: {
      oldPath: structuredDiff.fromPath,
      newPath: path,
    },
    lineDiff: lineDiff,
  }
}

function calculateLineDiff(diff: StructuredDiff, line: number): LineDiff {
  let chunk = findRelevantChunk(diff, line)
  d("calculateLineDiff found chunk", { line: line, chunk: chunk, changes: chunk?.changes })

  if (!chunk) {
    return {
      oldLine: line,
      newLine: line,
    }
  }

  if (chunk.newStart <= line && line <= chunk.newStart + chunk.newLines) {
    const change = chunk.changes.find((change) => {
      switch (change.type) {
        case "add":
          return change.ln === line
        case "del":
          return false
        case "normal":
          return change.ln2 === line
      }
    })

    // If there is no relevant change we return the requested line.
    if (!change || change.type === "del") {
      return {
        oldLine: line,
        newLine: line,
      }
    }

    switch (change.type) {
      case "add":
        return {
          oldLine: undefined,
          newLine: change.ln,
        }
      case "normal":
        return {
          oldLine: change.ln1,
          newLine: change.ln2,
        }
    }
  } else if (line < chunk.newStart) {
    d("calculateLineDiff line below changes in file", { line: line })
    return {
      oldLine: line,
      newLine: line,
    }
  } else {
    const offset = chunk.newStart + chunk.newLines - (chunk.oldStart + chunk.oldLines)
    d("calculateLineDiff line above changes in file", { line: line, offset: offset })
    return {
      oldLine: line - offset,
      newLine: line,
    }
  }
}

// Find the most relevant chunk using a binary search approach.
// A chunk containing changes with the line is preferred.
// If none exists then a chunk with the nearest newStart below the line is preferred.
// Only if no other chunks exists is the first chunk above the line returned.
function findRelevantChunk(diff: StructuredDiff, line: number): Chunk | undefined {
  let chunks = diff.chunks

  if (chunks.length == 0) {
    return undefined
  }

  let startIndex = 0
  let endIndex = chunks.length - 1
  while (true) {
    const currentIndex = Math.floor((startIndex + endIndex) / 2)
    const currentChunk = chunks[currentIndex]

    if (chunkContainsLine(currentChunk, line)) {
      return currentChunk
    }

    if (currentIndex === startIndex) {
      const endChunk = chunks[endIndex]
      if (!endChunk) {
        return currentChunk
      }

      if (chunkContainsLine(endChunk, line)) {
        return endChunk
      }

      if (endChunk.newStart < line) {
        return endChunk
      }

      if (currentChunk.newStart < line) {
        return currentChunk
      }

      const currentChunkOffset = Math.abs(currentChunk.newStart - line)
      const endChunkOffset = Math.abs(endChunk.newStart - line)

      if (currentChunkOffset <= endChunkOffset) {
        return currentChunk
      } else {
        return endChunk
      }
    }

    if (currentChunk.newStart < line) {
      startIndex = currentIndex
    } else {
      endIndex = currentIndex
    }
  }
}

function chunkContainsLine(chunk: Chunk, line: number): boolean {
  return chunk.newStart <= line && line <= chunk.newStart + chunk.newLines
}
