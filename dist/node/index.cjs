'use strict';

const federation = require('@originjs/vite-plugin-federation');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const federation__default = /*#__PURE__*/_interopDefaultCompat(federation);
const path__default = /*#__PURE__*/_interopDefaultCompat(path);
const fs__default = /*#__PURE__*/_interopDefaultCompat(fs);
const os__default = /*#__PURE__*/_interopDefaultCompat(os);

function normalizePath(id) {
  return path__default.posix.normalize(id.replace(/\\/g, "/"));
}
function getIPAdress() {
  const interfaces = os__default.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
        return alias.address;
      }
    }
  }
}
const host = `http://${getIPAdress()}:8080`;
function getRemoteEntryFile(options) {
  if (!options.exposes)
    return "";
  const base = options.base.split("/")[1];
  let moduleMap = "";
  Object.keys(options.exposes).forEach((item) => {
    const rootPath = options.isRootService ? `./packages/${base}` : "";
    const exposeFilepath = normalizePath(path__default.resolve(rootPath, options.exposes[item]));
    moduleMap += `
"${item}":()=> import('${exposeFilepath}').then(module => module),`;
  });
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
      }`;
}
function generateCommonRemoteEntryFile(version) {
  return `
    export * from './${version}/remoteEntry.js'
  `;
}
const federationDefaultOption = {
  isRootService: true,
  // 判断启动服务器的模式，是否为按需启动的模式
  filename: "remoteEntry.js"
  //远程模块入口文件，本地模块可通过vite.config.ts的remotes引入
};
function federation1(options) {
  let viteConfig = {};
  options = Object.assign(federationDefaultOption, options);
  if (options.remotes) {
    Object.keys(options.remotes).forEach((remoteName) => {
      let base = remoteName.split("Remote")[0];
      options.remotes[remoteName].url = options.remotes[remoteName].url || `/assets/${base}`;
      options.remotes[remoteName].external = options.remotes[remoteName].url + `/remoteEntrys.js?version=v${Date.now()}`;
      options.remotes[remoteName].from = "vite";
      options.remotes[remoteName].format = "esm";
    });
  }
  if (options.mode !== "development") {
    if (options.exposes) {
      let exposes = {};
      Object.keys(options.exposes).forEach((exposesName) => {
        exposes["./" + exposesName] = options.exposes[exposesName];
      });
      options.exposes = exposes;
    }
    const federationPlugin = federation__default(options);
    const federationConfigFunc = federationPlugin.config;
    federationPlugin.config = function config(config, env) {
      viteConfig = config;
      federationConfigFunc.call(this, config, env);
    };
    federationPlugin.closeBundle = function(value) {
      if (options.exposes) {
        const dirArrs = viteConfig.build.assetsDir.split("/");
        const version = dirArrs[dirArrs.length - 1];
        const commonRemotePath = path__default.resolve(viteConfig.build.outDir + "/" + viteConfig.build.assetsDir, "../remoteEntrys.js");
        fs__default.ensureDir(path__default.resolve(viteConfig.build.outDir + "/" + viteConfig.build.assetsDir), () => {
          fs__default.writeFileSync(commonRemotePath, generateCommonRemoteEntryFile(version));
        });
      }
    };
    return federationPlugin;
  }
  const virtualModuleId = "__remoteEntryHelper__";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  let transformFunc = void 0;
  if (options.remotes) {
    let regstr = Object.keys(options.remotes).join("|");
    const reg = new RegExp(`(${regstr})/[a-zA-Z]+'`, "g");
    transformFunc = (code, id) => {
      return code.replace(reg, (remoteName) => {
        const arr = remoteName.split("/");
        let base = arr[0].split("Remote")[0];
        const remoteUrl = options.isRootService ? `${host}/${base}/@id/__remoteEntryHelper__` : `${options.remotes[arr[0]].devUrl}/@id/__remoteEntryHelper__`;
        return `${remoteUrl}').then(res => res.get('${arr[1]})`;
      });
    };
  }
  return {
    name: options.name + "dev-federation",
    enforce: "pre",
    transform: transformFunc,
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId)
        return getRemoteEntryFile(options);
    }
  };
}

exports.federation = federation1;
