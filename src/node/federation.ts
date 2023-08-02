import federation from '@originjs/vite-plugin-federation'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'

function normalizePath(id: any) {
  return path.posix.normalize(id.replace(/\\/g, '/'))
}

// 获取本机电脑IP
function getIPAdress() {
  const interfaces = os.networkInterfaces()
  for (const devName in interfaces) {
    const iface: any = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        // console.log(alias.address);

        return alias.address
      }
    }
  }
}

const host = `http://${getIPAdress()}:8080` //'http://localhost:8080'

function getRemoteEntryFile(options: any, viteConfig: any) {
  if (!options.exposes) return ''

  let moduleMap = ''

  Object.keys(options.exposes).forEach((item) => {
    const exposeFilepath = normalizePath(path.resolve(viteConfig.root, options.exposes[item]))
    moduleMap += `\n"${item}":()=> import('${exposeFilepath}').then(module => () => module),`
  })

  return `
      const exportSet = new Set(['Module', '__esModule', 'default', '_export_sfc']);
      let moduleMap = {${moduleMap}}
      const seen = {}

      export const get =(module) => {
        return moduleMap[module]();
      };
      export const init =(shareScope) => {
        globalThis.__federation_shared__= globalThis.__federation_shared__|| {};
        Object.entries(shareScope).forEach(([key, value]) => {
          const versionKey = Object.keys(value)[0];
          const versionValue = Object.values(value)[0];
          const scope = versionValue.scope || 'default'
          globalThis.__federation_shared__[scope] = globalThis.__federation_shared__[scope] || {};
          const shared= globalThis.__federation_shared__[scope];
          (shared[key] = shared[key]||{})[versionKey] = versionValue;
        });
      }`
}

function generateCommonRemoteEntryFile(version: any) {
  return `
    export * from './${version}/remoteEntry.js'
  `
}

const virtualModuleId = '__remoteEntryHelper__'
const resolvedVirtualModuleId = '\0' + virtualModuleId

function getDevRemoteFileUrl(options: any, remoteName: string, base: string) {
  const devUrl = options.remotes[remoteName].devUrl
  const remoteUrl = devUrl ? `${devUrl}/@id/__remoteEntryHelper__` : `${host}/${base}/@id/__remoteEntryHelper__`

  return remoteUrl
}

const federationDefaultOption = {
  isRootService: true, // 判断启动服务器的模式，是否为按需启动的模式
  filename: 'remoteEntry.js', //远程模块入口文件，本地模块可通过vite.config.ts的remotes引入
}

export function federation1(options: any): any {
  let viteConfig: any = {}

  options = Object.assign(federationDefaultOption, options)

  if (options.remotes) {
    Object.keys(options.remotes).forEach((remoteName) => {
      let base = remoteName.split('Remote')[0]

      if (options.mode === 'development') {
        options.remotes[remoteName].external = getDevRemoteFileUrl(options, remoteName, base)
      } else {
        options.remotes[remoteName].url = options.remotes[remoteName].url || `/assets/${base}`
        options.remotes[remoteName].external = options.remotes[remoteName].url + `/remoteEntrys.js?version=v${Date.now()}`
      }
      options.remotes[remoteName].from = 'vite'
      options.remotes[remoteName].format = 'esm'
    })
  }

  if (options.exposes) {
    let exposes = {}
    Object.keys(options.exposes).forEach((exposesName) => {
      //@ts-ignore
      exposes['./' + exposesName] = options.exposes[exposesName]
    })
    options.exposes = exposes
  }

  const federationPlugin = federation(options)
  const federationConfigFunc = federationPlugin.config
  federationPlugin.config = function config(config: any, env: any) {
    viteConfig = config
    federationConfigFunc.call(this, config, env)
  }

  if (options.mode !== 'development') {
    federationPlugin.closeBundle = function (value: any) {
      if (options.exposes) {
        const dirArrs = viteConfig.build.assetsDir.split('/')
        const version = dirArrs[dirArrs.length - 1]
        const commonRemotePath = path.resolve(viteConfig.build.outDir + '/' + viteConfig.build.assetsDir, '../remoteEntrys.js')
        fs.ensureDir(path.resolve(viteConfig.build.outDir + '/' + viteConfig.build.assetsDir), () => {
          fs.writeFileSync(commonRemotePath, generateCommonRemoteEntryFile(version))
        })
      }
    }
  }

  if (options.mode === 'development') {
    const resolveIdFunc = federationPlugin.resolveId
    federationPlugin.resolveId = (...args: any) => {
      if (args[0] === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      return resolveIdFunc(...args)
    }

    const loadFunc = federationPlugin.load
    federationPlugin.load = (...args: any) => {
      if (args[0] === resolvedVirtualModuleId) return getRemoteEntryFile(options, viteConfig)

      return loadFunc(args[0])
    }
  }

  return federationPlugin

  // const virtualModuleId = '__remoteEntryHelper__'
  // const resolvedVirtualModuleId = '\0' + virtualModuleId

  // let transformFunc: any = undefined
  // if (options.remotes) {
  //   let regstr = Object.keys(options.remotes).join('|')
  //   // TODO 匹配规则优化，兼容单引号，双引号
  //   const reg = new RegExp(`(${regstr})/[a-zA-Z]+'`, 'g')
  //   transformFunc = (code: any, id: any) => {
  //     return code.replace(reg, (remoteName: any) => {
  //       const arr = remoteName.split('/')
  //       let base = arr[0].split('Remote')[0]
  //       const remoteUrl = options.isRootService
  //         ? `${host}/${base}/@id/__remoteEntryHelper__`
  //         : `${options.remotes[arr[0]].devUrl}/@id/__remoteEntryHelper__`

  //       return `${remoteUrl}').then(res => res.get('${arr[1]})`
  //     })
  //   }
  // }

  // return {
  //   name: options.name + 'dev-federation',
  //   enforce: 'pre',
  //   transform: transformFunc,
  //   resolveId(id: any) {
  //     if (id === virtualModuleId) {
  //       return resolvedVirtualModuleId
  //     }
  //   },
  //   load(id: any) {
  //     if (id === resolvedVirtualModuleId) return getRemoteEntryFile(options)
  //   },
  // }
}
