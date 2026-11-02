import parseDiff from "parse-diff"

/**
 * Git quotes paths in diffs when they contain non-ASCII bytes, quotes, or
 * control characters. `parse-diff` leaves those quoted paths (including the
 * a/ and b/ prefixes) as-is, which leaks Git's transport encoding into the
 * Danger DSL. Normalize both sides before exposing paths to Dangerfiles.
 */
const normalizeGitDiffPath = (path: string | undefined, prefix: string): string | undefined => {
  if (!path) {
    return path
  }

  const quotedPath = path.match(/^"((?:\\.|[^"\\])*)"$/)
  const withoutQuotes = quotedPath ? quotedPath[1] : path
  const withoutPrefix = withoutQuotes.startsWith(prefix) ? withoutQuotes.slice(prefix.length) : withoutQuotes

  return quotedPath ? decodeGitQuotedPath(withoutPrefix) : withoutPrefix
}

const escapeBytes: Record<string, number> = {
  a: 0x07,
  b: 0x08,
  f: 0x0c,
  n: 0x0a,
  r: 0x0d,
  t: 0x09,
  v: 0x0b,
  "\\": 0x5c,
  '"': 0x22,
}

const decodeGitQuotedPath = (path: string): string => {
  const bytes: number[] = []

  for (let i = 0; i < path.length; i++) {
    if (path[i] !== "\\") {
      bytes.push(path.charCodeAt(i) & 0xff)
      continue
    }

    const escape = path[++i]
    if (escape === undefined) {
      bytes.push(path.charCodeAt(i - 1) & 0xff)
      continue
    }

    const escapedByte = escapeBytes[escape]
    if (escapedByte !== undefined) {
      bytes.push(escapedByte)
      continue
    }

    if (!escape.match(/[0-7]/)) {
      bytes.push(0x5c, escape.charCodeAt(0) & 0xff)
      continue
    }

    let octal = escape
    while (i + 1 < path.length && octal.length < 3 && path[i + 1].match(/[0-7]/)) {
      octal += path[++i]
    }

    const octalByte = parseInt(octal, 8)
    if (octalByte >= 0 && octalByte <= 0xff) {
      bytes.push(octalByte)
    } else {
      // Preserve malformed octal escapes instead of silently dropping digits.
      bytes.push(0x5c)
      for (const digit of octal) {
        bytes.push(digit.charCodeAt(0) & 0xff)
      }
    }
  }

  return Buffer.from(bytes).toString("utf8")
}

export const parseGitDiff = (diff: string): parseDiff.File[] =>
  parseDiff(diff).map((file) => ({
    ...file,
    from: normalizeGitDiffPath(file.from, "a/"),
    to: normalizeGitDiffPath(file.to, "b/"),
  }))
