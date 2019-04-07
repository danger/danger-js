// Graciously vendored from
// https://github.com/paulmelnikow/chainsmoker
//

import micromatch from "micromatch"
import mapValues from "lodash.mapvalues"

export type Pattern = string
export type Path = string
export type KeyedPatterns<T> = { readonly [K in keyof T]: Pattern[] }
export type KeyedPaths<T> = { readonly [K in keyof T]: Path[] }
export type _MatchResult<T> = { readonly [K in keyof T]: boolean }
export type MatchResult<T> = _MatchResult<T> & {
  /** Returns an object containing arrays of matched files instead of the usual boolean values. */
  getKeyedPaths(): KeyedPaths<T>
}
export type Chainsmoker<T> = (...patterns: Pattern[]) => MatchResult<T>

const isExclude = (p: Pattern) => p.startsWith("!")

export default function chainsmoker<T>(keyedPaths: KeyedPaths<T>): Chainsmoker<T> {
  function matchPatterns(patterns: Pattern[]): KeyedPaths<T> {
    return mapValues(keyedPaths, (paths: Path[]) => {
      const excludePatterns = patterns.filter(p => isExclude(p))
      const includePatterns = patterns.filter(p => !isExclude(p))

      const included = includePatterns.reduce(
        (accum, pattern) => accum.concat(micromatch.match(paths, pattern)),
        [] as Path[]
      )

      return excludePatterns.reduce((accum, pattern) => micromatch.match(accum, pattern), included)
    }) as KeyedPaths<T>
  }

  function finalize(keyedPaths: KeyedPaths<T>): MatchResult<T> {
    return {
      ...mapValues(keyedPaths, (paths: Path[]) => paths.length > 0),
      getKeyedPaths: () => keyedPaths,
    } as MatchResult<T>
  }

  return (...patterns) => finalize(matchPatterns(patterns))
}
