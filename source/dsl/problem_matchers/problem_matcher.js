// @flow

import { readFileSync } from "fs"

// Aims to be consistent with https://github.com/Microsoft/vscode/blob/master/src/vs/platform/markers/common/problemMatcher.ts

export type ProblemPattern = {
  regexp: RegExp;
  file?: number;
  message?: number;
  location?: number;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  code?: number;
  severity?: number;
  loop?: boolean;
  mostSignifikant?: boolean;
  [key: string]: any;
}

const valueMap: { [key: string]: string; } = {
  E: "error",
  W: "warning",
  I: "info"
}

interface Location {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

interface ProblemData {
  file?: string;
  location?: string;
  line?: string;
  column?: string;
  endLine?: string;
  endColumn?: string;
  message?: string;
  severity?: string;
  code?: string;
  [key: string]: string;
}

interface ProblemMatcher {
  owner: string;
  // applyTo: ApplyToKind;
  // fileLocation: FileLocationKind;
  filePrefix?: string;
  pattern: ProblemPattern | ProblemPattern[];
  // severity?: Severity;
  // watching?: WatchingMatcher;
}

interface ProblemMatch {
  resource: string;
  marker: any;
  description: ProblemMatcher;
}

interface HandleResult {
  match: any;
  continue: boolean;
}

export const problemPatternProperties = ["file", "message", "location", "line", "column", "endLine", "endColumn", "code", "severity", "loop", "mostSignifikant"]

/**
 * Runs a vscode-compliant problem matcher against
 */
export function problemMatcher(file: string, matchers: string | ProblemPattern | Array<ProblemPattern>) {

}

class AbstractLineMatcher {
  matcher: ProblemMatcher;

  constructor(matcher: ProblemMatcher) {
    this.matcher = matcher
  }

  handle(lines: string[], start: number = 0): HandleResult {
    return { match: null, continue: false }
  }

  next(line: string): ?ProblemMatch {
    return null
  }

  get matchLength(): number {
    throw new Error("Subclass reponsibility")
  }

  fillProblemData(data: ProblemData, pattern: ProblemPattern, matches: Array<any>): void {
    this.fillProperty(data, "file", pattern, matches, true)
    this.fillProperty(data, "message", pattern, matches, true)
    this.fillProperty(data, "code", pattern, matches, true)
    this.fillProperty(data, "severity", pattern, matches, true)
    this.fillProperty(data, "location", pattern, matches, true)
    this.fillProperty(data, "line", pattern, matches)
    this.fillProperty(data, "column", pattern, matches)
    this.fillProperty(data, "endLine", pattern, matches)
    this.fillProperty(data, "endColumn", pattern, matches)
  }

  fillProperty(data: ProblemData, property: string, pattern: ProblemPattern, matches: Array<any>, trim: boolean = false): void {
    if (isUndefined(data[property]) && !isUndefined(pattern[property]) && pattern[property] < matches.length) {
      let value = matches[pattern[property]]
      if (trim) {
        value = Strings.trim(value)
      }
      data[property] = value
    }
  }

  getMarkerMatch(data: ProblemData): ProblemMatch {
    const location = this.getLocation(data)
    if (data.file && location && data.message) {
      const marker: IMarkerData = {
        severity: this.getSeverity(data),
        startLineNumber: location.startLineNumber,
        startColumn: location.startColumn,
        endLineNumber: location.startLineNumber,
        endColumn: location.endColumn,
        message: data.message
      }
      if (!isUndefined(data.code)) {
        marker.code = data.code
      }
      return {
        description: this.matcher,
        resource: this.getResource(data.file),
        marker: marker
      }
    }
  }

  getResource(filename: string): URI {
    return getResource(filename, this.matcher)
  }

  getLocation(data: ProblemData): Location {
    if (data.location) {
      return this.parseLocationInfo(data.location)
    }
    if (!data.line) {
      return null
    }
    const startLine = parseInt(data.line)
    const startColumn = data.column ? parseInt(data.column) : undefined
    const endLine = data.endLine ? parseInt(data.endLine) : undefined
    const endColumn = data.endColumn ? parseInt(data.endColumn) : undefined
    return this.createLocation(startLine, startColumn, endLine, endColumn)
  }

  parseLocationInfo(value: string): Location {
    if (!value || !value.match(/(\d+|\d+,\d+|\d+,\d+,\d+,\d+)/)) {
      return null
    }
    const parts = value.split(",")
    const startLine = parseInt(parts[0])
    const startColumn = parts.length > 1 ? parseInt(parts[1]) : undefined
    if (parts.length > 3) {
      return this.createLocation(startLine, startColumn, parseInt(parts[2]), parseInt(parts[3]))
    } else {
      return this.createLocation(startLine, startColumn, undefined, undefined)
    }
  }

  createLocation(startLine: number, startColumn: number, endLine: number, endColumn: number): Location {
    if (startLine && startColumn && endColumn) {
      return { startLineNumber: startLine, startColumn: startColumn, endLineNumber: endLine || startLine, endColumn: endColumn }
    }
    if (startLine && startColumn) {
      return { startLineNumber: startLine, startColumn: startColumn, endLineNumber: startLine, endColumn: startColumn }
    }
    return { startLineNumber: startLine, startColumn: 1, endLineNumber: startLine, endColumn: Number.MAX_VALUE }
  }

  getSeverity(data: ProblemData): Severity {
    let result: Severity = null
    if (data.severity) {
      let value = data.severity
      if (value && value.length > 0) {
        if (value.length === 1 && valueMap[value[0]]) {
          value = valueMap[value[0]]
        }
        result = Severity.fromValue(value)
      }
    }
    if (result === null || result === Severity.Ignore) {
      result = this.matcher.severity || Severity.Error
    }
    return result
  }
}

class SingleLineMatcher extends AbstractLineMatcher {

  pattern: ProblemPattern;

  constructor(matcher: ProblemMatcher) {
    super(matcher)
    this.pattern = matcher.pattern
  }

  get matchLength(): number {
    return 1
  }

  handle(lines: string[], start: number = 0): HandleResult {
    Assert.ok(lines.length - start === 1)
    const data: ProblemData = Object.create(null)
    const matches = this.pattern.regexp.exec(lines[start])
    if (matches) {
      this.fillProblemData(data, this.pattern, matches)
      const match = this.getMarkerMatch(data)
      if (match) {
        return { match: match, continue: false }
      }
    }
    return { match: null, continue: false }
  }

  next(line: string): ProblemMatch {
    return null
  }
}

class MultiLineMatcher extends AbstractLineMatcher {

  patterns: Array<ProblemPattern>;
  data: ProblemData;

  constructor(matcher: ProblemMatcher) {
    super(matcher)
    this.patterns = matcher.pattern
  }

  get matchLength(): number {
    return this.patterns.length
  }

  handle(lines: string[], start: number = 0): HandleResult {
    Assert.ok(lines.length - start === this.patterns.length)
    this.data = Object.create(null)
    let data = this.data
    for (let i = 0; i < this.patterns.length; i++) {
      const pattern = this.patterns[i]
      const matches = pattern.regexp.exec(lines[i + start])
      if (!matches) {
        return { match: null, continue: false }
      } else {
        // Only the last pattern can loop
        if (pattern.loop && i === this.patterns.length - 1) {
          data = Objects.clone(data)
        }
        this.fillProblemData(data, pattern, matches)
      }
    }
    const loop = this.patterns[this.patterns.length - 1].loop
    if (!loop) {
      this.data = null
    }
    return { match: this.getMarkerMatch(data), continue: loop }
  }

  next(line: string): ProblemMatch {
    const pattern = this.patterns[this.patterns.length - 1]
    Assert.ok(pattern.loop === true && this.data !== null)
    const matches = pattern.regexp.exec(line)
    if (!matches) {
      this.data = null
      return null
    }
    const data = Objects.clone(this.data)
    this.fillProblemData(data, pattern, matches)
    return this.getMarkerMatch(data)
  }
}

/**
 * @returns whether the provided parameter is undefined.
 */
export function isUndefined(obj: any): boolean {
  return typeof (obj) === "undefined"
}
