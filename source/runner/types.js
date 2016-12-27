export type Path = string

export interface ResolverConfig {
  browser?: boolean,
  defaultPlatform: ?string,
  extensions: Array<string>,
  hasCoreModules: boolean,
  moduleDirectories: Array<string>,
  moduleNameMapper: ?{[key: string]: RegExp},
  modulePaths: Array<Path>,
  platforms?: Array<string>,
};

export interface HasteConfig {
  providesModuleNodeModules: Array<string>,
  defaultPlatform?: ?string,
  platforms?: Array<string>,
};

export interface Environment {
  constructor(config: any): void;
  dispose(): void;
  runScript(script: any): any;
  global: any;
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
  };
  testFilePath: string;
  moduleMocker: any;
};

export interface DangerfileRuntimeEnv {
  context: DangerContext,
  environment: Environment,
  runtime: any
}
