/**
 * 加载远程脚本
 * @param remoteMap
 * @param shareScope
 * @returns
 */

export default function remoteFederationTemplate(remoteMap: string) {
  return `
    ${remoteMap}
    const loadJS = async (url, fn) => {
      const resolvedUrl = typeof url === 'function' ? await url() : url;
      const script = document.createElement('script')
      script.type = 'text/javascript';
      script.onload = fn;
      script.src = resolvedUrl;
      document.getElementsByTagName('head')[0].appendChild(script);
    }
    function get(name){
      return import(/* @vite-ignore */ name).then(module => ()=> {
        return module
      })
    }
    const wrapShareScope = () => {
      return {
        __shareScope__
      }
    }
    const initMap = Object.create(null);
    async function __federation_method_ensure(remoteId) {
      const remote = remotesMap[remoteId];
      console.log('======remote', remoteId, remote)
      if (!remote.inited) {
        if ('var' === remote.format) {
          // loading js with script tag
          return new Promise(resolve => {
            const callback = () => {
              if (!remote.inited) {
                remote.lib = window[remoteId];
                remote.lib.init(wrapShareScope(remote.from))
                remote.inited = true;
              }
              resolve(remote.lib);
            }
            return loadJS(remote.url, callback);
          });
        } else if (['esm', 'systemjs'].includes(remote.format)) {
          // loading js with import(...)
          return new Promise((resolve, reject) => {
            const getUrl = typeof remote.url === 'function' ? remote.url : () => Promise.resolve(remote.url);
            getUrl().then(url => {
              import(/* @vite-ignore */ url).then(lib => {
                if (!remote.inited) {
                  const shareScope = wrapShareScope(remote.from)
                  lib.init(shareScope);
                  remote.lib = lib;
                  remote.lib.init(shareScope);
                  remote.inited = true;
                }
                resolve(remote.lib);
              }).catch(reject)
            })
          })
        }
      } else {
        return remote.lib;
      }
    }
    
    function __federation_method_unwrapDefault(module) {
      return (module?.__esModule || module?.[Symbol.toStringTag] === 'Module')?module.default:module
    }
    
    function __federation_method_wrapDefault(module ,need){
      if (!module?.default && need) {
        let obj = Object.create(null);
        obj.default = module;
        obj.__esModule = true;
        return obj;
      }
      return module; 
    }
    
    function __federation_method_getRemote(remoteName,  componentName){
      return __federation_method_ensure(remoteName).then((remote) => remote.get(componentName).then(factory => factory()));
    }
    export {__federation_method_ensure, __federation_method_getRemote , __federation_method_unwrapDefault , __federation_method_wrapDefault}
    ;`
}
