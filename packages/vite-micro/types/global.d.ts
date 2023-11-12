declare module 'fs-extra'

declare module 'path'

declare module 'os'

declare module '__federation__' {
  function __federation_method_ensure()
  function __federation_method_getRemote(remoteName: string, remoteScript: string)
  function __federation_method_wrapDefault()
  function __federation_method_unwrapDefault()

  export { __federation_method_ensure, __federation_method_getRemote, __federation_method_wrapDefault, __federation_method_unwrapDefault }
}

declare interface Window {
  [p: string]: any
}
