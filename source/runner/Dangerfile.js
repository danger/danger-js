// @flow

// https://nodejs.org/api/vm.html
// https://60devs.com/executing-js-code-with-nodes-vm-module.html

import fs from "fs"
import vm from "vm"
import type { DangerResults } from "./DangerResults"
import type { DangerDSLType } from "../dsl/DangerDSL"
import type { MarkdownString } from "../dsl/Aliases"

interface DangerContext {
/* BEGIN FLOWTYPE EXPORT */
  /**
   * Fails a build, outputting a specific reason for failing
   *
   * @param {MarkdownString} message the String to output
   */
  fail(message: MarkdownString): void;

  /**
   * Highlights low-priority issues, does not fail the build
   *
   * @param {MarkdownString} message the String to output
   */
  warn(message: MarkdownString): void;

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
  message(message: MarkdownString): void;

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
  markdown(message: MarkdownString): void;

  /** Typical console */
  console: any;

  /**
   * The Danger object to work with
   *
   * @type {DangerDSLType}
   */
  danger: DangerDSLType;
  /**
   * Results of a Danger run
   *
   * @type {DangerDSLType}
   */
  results: DangerResults;
/* END FLOWTYPE EXPORT */
}

export function contextForDanger(dsl: DangerDSLType): DangerContext {
  const results: DangerResults = {
    fails: [],
    warnings: [],
    messages: [],
    markdowns: []
  }

  const fail = (message: MarkdownString) => {
    results.fails.push({ message })
  }

  const warn = (message: MarkdownString) => {
    results.warnings.push({ message })
  }

  const message = (message: MarkdownString) => {
    results.messages.push({ message })
  }

  const markdown = (message: MarkdownString) => {
    results.markdowns.push(message)
  }

  return {
    fail,
    warn,
    message,
    markdown,
    console,
    results,
    danger: dsl
  }
}

export class Dangerfile {
  dsl: DangerDSLType

  constructor(dsl: DangerDSLType) {
    this.dsl = dsl
  }

  async run(file: string): Promise<DangerResults> {
    const contents = await this.readFile(file)

    // comment out imports of 'danger'
    // e.g `import danger from`
    // then user get typed data, and we fill it in
    // via the VM context

    const cleaned = contents
      .replace(/import danger /gi, "// import danger ")
      .replace(/import { danger/gi, "// import { danger ")

    const script = new vm.Script(cleaned, {
      filename: file,
      lineOffset: 1,
      columnOffset: 1,
      displayErrors: true,
      timeout: 1000 // ms
    })

    try {
      script.runInNewContext(context)
    }
    catch (e) {
      console.log(e.toString())
    }

    return results
  }

  /**
   * A dumb fs.readFile promise wrapper,
   * converts to string
   *
   * @param {string} path filepath
   * @returns {Promise<string>} probably your string
   */
  readFile(path: string): Promise<string> {
    return new Promise((resolve: any, reject: any) => {
      fs.readFile(path, (err: any, data: Buffer) => {
        if (err) {
          console.error("Error: " + err.message)
          process.exitCode = 1
          reject(err)
        } else {
          resolve(data.toString())
        }
      })
    })
  }
}

