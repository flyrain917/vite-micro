/**
 * https://cloud.tencent.com/developer/article/1761306
 * webcomponent & css shadow
 * 
 * 

1.  shadow dom 里面的样式不会影响到外面
2.  外面的样式会影响到shadow dom里面的
3. 下面如何防止外面的样式影响里面的
:host {
  all: initial !important;
} 

 */

const shadowMaps: any = {}

export function registerShadowProxy(remote: string, shadow: ShadowRoot | undefined) {
  shadowMaps[remote] = shadow
  if (!!document.isProxyed) {
    proxyDocument()
  }
}

/**
 * 在shadow里面 使用document.getElementById，使用shadow的父dom代替
 */
export function proxyDocument() {
  const originGetElementById = document.getElementById
  document.getElementById = function (selector: string) {
    const currentScriptUrl = getCurrentFileUrl()
    if (!currentScriptUrl) return originGetElementById(selector)

    const currentRemote: string | undefined = Object.keys(shadowMaps).find((remote) => currentScriptUrl.startsWith(remote))
    if (!currentRemote) return originGetElementById(selector)

    const currentShadow = shadowMaps[currentRemote]
    return currentShadow.getElementById(selector)
  }
  document.originGetElementById = originGetElementById
  document.isProxyed = true
}

export function getCurrentFileUrl() {
  let url = ''
  try {
    url = import.meta.url || document.currentScript?.src
  } catch (e) {
    url = document.currentScript?.src
  }

  console.log('getCurrentFileUrl====', url)

  try {
    throw new Error()
  } catch (e: Error | any) {
    url = e?.sourceURL
    console.log('e.sourceURL====', e?.sourceURL)
  }

  return url
}
