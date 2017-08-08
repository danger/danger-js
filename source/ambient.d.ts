declare module "parse-diff"
declare module "lodash.includes"
declare module "lodash.find"
declare module "lodash.isobject"
declare module "lodash.keys"
declare module "jest-runtime"
declare module "jest-haste-map"
declare module "jest-environment-node"
declare module "jest-config"
declare module "voca"
declare module "jsome"
declare module "jsonpointer"
declare module "parse-link-header"

declare module "*/package.json"

declare module "vm2" {
  export interface VMRequire {
    builtin?: string[]
    context?: "host" | "sandbox"
    external?: boolean
    import?: string[]
    root?: string
    mock?: any
  }

  /**
   * A custom compiler function for all of the JS that comes
   * into the VM
   */
  type CompilerFunction = (code: string, filename: string) => string

  export interface VMOptions {
    compiler?: "javascript" | "coffeescript" | CompilerFunction
    sandbox?: any
    timeout?: number
  }

  export interface NodeVMOptions extends VMOptions {
    console?: "inherit" | "redirect"
    require?: true | VMRequire
    nesting?: boolean
    wrapper?: "commonjs" | "none"
  }

  export class NodeVM {
    constructor(options?: NodeVMOptions)
    run(js: string, path: string): any
  }

  export class VM {
    constructor(options?: VMOptions)
    run(js: string, path: string): any
  }
}
