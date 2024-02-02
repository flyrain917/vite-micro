const document: any = window.document

const shadowMaps: any = {}

export function registerShadowProxy(remote: string, shadow: ShadowRoot | undefined) {
  shadowMaps[remote] = shadow
  if (!document.isProxyed) {
    proxyDocumentGetElementById()
    proxyHeadAppendChild()
  }
}

export function unRegisterShadowProxy(remote: string, shadow: ShadowRoot | undefined) {
  shadowMaps[remote] = null
}

/**
 * 在shadow里面 使用document.getElementById，使用shadow的父dom代替
 */
export function proxyDocumentGetElementById() {
  document.originGetElementById = document.originGetElementById || document.getElementById
  document.getElementById = function (selector: string) {
    const currentScriptUrl = getCurrentFileUrl()
    if (!currentScriptUrl) return document.originGetElementById(selector)

    const currentRemote: string | undefined = Object.keys(shadowMaps).find((remote) => currentScriptUrl.startsWith(remote))
    if (!currentRemote) return document.originGetElementById(selector)

    const currentShadow = shadowMaps[currentRemote]
    return currentShadow.getElementById(selector)
  }
  document.isProxyed = true
}

/**
 * 在shadow里面 document.head.appendChild(style) 需要替换为shadow.appendChild(style)
 */
export function proxyHeadAppendChild() {
  document.head.originAppendChild = document.head.originAppendChild || document.head.appendChild
  document.head.appendChild = function (style: HTMLElement) {
    const currentScriptUrl = getCurrentFileUrl()
    if (!currentScriptUrl) return document.head.originAppendChild(style)

    const currentRemote: string | undefined = Object.keys(shadowMaps).find((remote) => currentScriptUrl.startsWith(remote))
    if (!currentRemote) return document.head.originAppendChild(style)

    const currentShadow = shadowMaps[currentRemote]
    return currentShadow.appendChild(style)
  }
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

  if (!url) {
    try {
      throw new Error()
    } catch (e: Error | any) {
      url = e?.sourceURL
      console.log('e.sourceURL====', e?.sourceURL)
    }
  }

  return url
}
