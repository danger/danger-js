import { DangerContext } from "./Dangerfile"

export type Path = string

export interface ResolverConfig {
  browser?: boolean
  defaultPlatform: string | null
  extensions: Array<string>
  hasCoreModules: boolean
  moduleDirectories: Array<string>
  moduleNameMapper: { [key: string]: RegExp } | null
  modulePaths: Array<Path>
  platforms?: Array<string>
}

export interface HasteConfig {
  providesModuleNodeModules: Array<string>
  defaultPlatform?: string | null
  platforms?: Array<string>
}

export interface EnvironmentConstructor {
  new (config: any): Environment
}

export interface Environment extends EnvironmentConstructor {
  dispose(): void
  runScript(script: any): any
  global: any
  fakeTimers: {
    clearAllTimers(): void;
    runAllImmediates(): void;
    runAllTicks(): void;
    runAllTimers(): void;
    runTimersToTime(): void;
    runOnlyPendingTimers(): void;
    runWithRealTimers(callback: any): void;
    useFakeTimers(): void;
    useRealTimers(): void;
  }
  testFilePath: string
  moduleMocker: any
}

export interface DangerfileRuntimeEnv {
  context: DangerContext
  environment: Environment
  runtime: any
}
