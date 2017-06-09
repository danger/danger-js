import { DangerContext } from "./Dangerfile"

export type Path = string

export interface ResolverConfig {
  browser?: boolean
  defaultPlatform: string | null
  extensions: string[]
  hasCoreModules: boolean
  moduleDirectories: string[]
  moduleNameMapper: { [key: string]: RegExp } | null
  modulePaths: Path[]
  platforms?: string[]
}

export interface HasteConfig {
  providesModuleNodeModules: string[]
  defaultPlatform?: string | null
  platforms?: string[]
}

export interface EnvironmentConstructor {
  new (config: any): Environment
}

export interface InternalModuleOptions {
  isInternalModule: boolean
}

export interface JestRuntime {
  requireModule(from: Path, moduleName?: string, options?: InternalModuleOptions): any
}

export interface Environment extends EnvironmentConstructor {
  dispose(): void
  runScript(script: any): any
  global: any
  fakeTimers: {
    clearAllTimers(): void
    runAllImmediates(): void
    runAllTicks(): void
    runAllTimers(): void
    runTimersToTime(): void
    runOnlyPendingTimers(): void
    runWithRealTimers(callback: any): void
    useFakeTimers(): void
    useRealTimers(): void
  }
  testFilePath: string
  moduleMocker: any
}

export interface DangerfileRuntimeEnv {
  context: DangerContext
  environment: Environment
  runtime: any
}
