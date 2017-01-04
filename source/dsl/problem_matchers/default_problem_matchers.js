// @flow

/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { ProblemPattern } from "./problem_matcher"

export const defaultPatterns: { [name: string]: ProblemPattern | Array<ProblemPattern>; } = Object.create(null)

defaultPatterns["msCompile"] = {
  regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\)\s*:\s+(error|warning|info)\s+(\w{1,2}\d+)\s*:\s*(.*)$/,
  file: 1,
  location: 2,
  severity: 3,
  code: 4,
  message: 5
}

defaultPatterns["gulp-tsc"] = {
  regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(\d+)\s+(.*)$/,
  file: 1,
  location: 2,
  code: 3,
  message: 4
}

defaultPatterns["tsc"] = {
  regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(TS\d+)\s*:\s*(.*)$/,
  file: 1,
  location: 2,
  severity: 3,
  code: 4,
  message: 5
}

defaultPatterns["cpp"] = {
  regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(C\d+)\s*:\s*(.*)$/,
  file: 1,
  location: 2,
  severity: 3,
  code: 4,
  message: 5
}

defaultPatterns["csc"] = {
  regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(CS\d+)\s*:\s*(.*)$/,
  file: 1,
  location: 2,
  severity: 3,
  code: 4,
  message: 5
}

defaultPatterns["vb"] = {
  regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(BC\d+)\s*:\s*(.*)$/,
  file: 1,
  location: 2,
  severity: 3,
  code: 4,
  message: 5
}

defaultPatterns["lessCompile"] = {
  regexp: /^\s*(.*) in file (.*) line no. (\d+)$/,
  message: 1,
  file: 2,
  line: 3
}

defaultPatterns["jshint"] = {
  regexp: /^(.*):\s+line\s+(\d+),\s+col\s+(\d+),\s(.+?)(?:\s+\((\w)(\d+)\))?$/,
  file: 1,
  line: 2,
  column: 3,
  message: 4,
  severity: 5,
  code: 6
}

defaultPatterns["jshint-stylish"] = [
  {
    regexp: /^(.+)$/,
    file: 1
  },
  {
    regexp: /^\s+line\s+(\d+)\s+col\s+(\d+)\s+(.+?)(?:\s+\((\w)(\d+)\))?$/,
    line: 1,
    column: 2,
    message: 3,
    severity: 4,
    code: 5,
    loop: true
  }
]

defaultPatterns["eslint-compact"] = {
  regexp: /^(.+):\sline\s(\d+),\scol\s(\d+),\s(Error|Warning|Info)\s-\s(.+)\s\((.+)\)$/,
  file: 1,
  line: 2,
  column: 3,
  severity: 4,
  message: 5,
  code: 6
}

defaultPatterns["eslint-stylish"] = [
  {
    regexp: /^([^\s].*)$/,
    file: 1
  },
  {
    regexp: /^\s+(\d+):(\d+)\s+(error|warning|info)\s+(.+?)\s\s+(.*)$/,
    line: 1,
    column: 2,
    severity: 3,
    message: 4,
    code: 5,
    loop: true
  }
]

defaultPatterns["go"] = {
  regexp: /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+))?: (.*)$/,
  file: 2,
  line: 4,
  column: 6,
  message: 7
}

// Everything above here is taken from microsoft/vscode
// https://github.com/Microsoft/vscode/blob/cafc25cc99856e6fdf15ecfba486fbc51e0bd63d/src/vs/platform/markers/common/problemMatcher.ts#L396-L504

// TODO

// flow
// Jest
