import micromatch from "micromatch"
import mapValues from "lodash.mapvalues"

export type Pattern = string
export type Path = string
export type KeyedPatterns<T> = { [K in Extract<keyof T, string>]: Pattern[] }
export type KeyedPaths<T> = { [K in Extract<keyof T, string>]: Path[] }
export type MatchResult<T> = { [K in Extract<keyof T, string>]: boolean }

export interface Chainsmoker<T> {
  (...patterns: Pattern[]): MatchResult<T>
  tap(callback: (keyedPaths: KeyedPaths<T>) => void): (...patterns: Pattern[]) => MatchResult<T>
  debug(...patterns: Pattern[]): MatchResult<T>
}

const isExclude = (p: Pattern) => p.startsWith("!")

export default function chainsmoker<T>(keyedPaths: KeyedPaths<T>): Chainsmoker<T> {
  function matchPatterns(patterns: Pattern[]): KeyedPaths<T> {
    return mapValues(keyedPaths, (paths: Path[]) => {
      const excludePatterns = patterns.filter(p => isExclude(p))
      const includePatterns = patterns.filter(p => !isExclude(p))

      const included = includePatterns.reduce((accum, pattern) => accum.concat(micromatch.match(paths, pattern)), [])

      return excludePatterns.reduce((accum, pattern) => micromatch.match(accum, pattern), included)
    })
  }

  function finalize(keyedPaths: KeyedPaths<T>): MatchResult<T> {
    return mapValues(keyedPaths, (paths: Path[]) => paths.length > 0)
  }

  const fileMatch = ((...patterns) => finalize(matchPatterns(patterns))) as Chainsmoker<T>

  fileMatch.tap = callback => (...patterns) => {
    const results = matchPatterns(patterns)
    callback(results)
    return finalize(results)
  }

  fileMatch.debug = (...patterns) => {
    const results = matchPatterns(patterns)
    console.log(JSON.stringify(results, undefined, 2))
    return finalize(results)
  }

  return fileMatch
}
