import {
  __federation_method_ensure,
  __federation_method_getRemote,
  __federation_method_wrapDefault,
  __federation_method_unwrapDefault,
} from '__federation__'

export function splitName(name: string) {
  return name.split('/')
}

export const remoteImport: Function = async (name: string) => {
  const [remoteName, remoteScript] = splitName(name)
  // 加载脚步
  return __federation_method_getRemote(remoteName, './' + remoteScript)
}
