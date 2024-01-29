import { satisfy } from './semver/satisfy'

interface moduleMapType {
  [index: string]: {
    requiredVersion: string
    get: Function
  }
}

export async function importSharedMicro(name: string, moduleMap: moduleMapType, shareScope = 'default') {
  return (await getSharedFromRuntime(name, moduleMap, shareScope)) || getSharedFromLocal(name, moduleMap, shareScope)
}

async function getSharedFromRuntime(name: string, moduleMap: moduleMapType, shareScope = 'default'): Promise<any> {
  let module: any = null
  window.__federation_shared__ = window.__federation_shared__ || { [shareScope]: {} }
  if (window?.__federation_shared__?.[shareScope]?.[name]) {
    const sharedModule = window.__federation_shared__[shareScope][name]

    if (moduleMap[name]?.requiredVersion) {
      if (sharedModule.version && satisfy(sharedModule.version, moduleMap[name].requiredVersion)) {
        module = await sharedModule.module
      } else {
        console.error(`${name} requiredVersion error`)
      }
    } else {
      module = await sharedModule.module
    }
  }

  if (module) {
    if (module.default && Object.keys(module).length < 2) module = module.default
    return module
  }
}

async function getSharedFromLocal(name: string, moduleMap: moduleMapType, shareScope = 'default') {
  if (moduleMap[name]) {
    let module = await moduleMap[name].get()
    if (module.default && Object.keys(module).length < 2) module = module.default
    window.__federation_shared__ = window.__federation_shared__ || { [shareScope]: {} }
    window.__federation_shared__[shareScope][name] = {
      module,
      version: module.version || moduleMap[name].requiredVersion,
    }

    return module
  } else {
    console.error(`${name} shared module from local error`)
  }
}
