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
    external?: boolean
    builtin?: any[]
    rooty?: string
    mock?: any
    context?: "host" | "sandbox"
    import?: string[]
  }

  export interface VMOptions {
    timeout?: number
    sandbox?: any
    console?: "inherit" | "redirect"
    compiler?: "javascript" | "coffeescript"
    require?: true | VMRequire
    nesting?: boolean
    wrapper?: "commonjs" | "none"
  }

  export class NodeVM {
    constructor(options?: VMOptions)
    run(js: string, path: string): NodeVM
  }
}
