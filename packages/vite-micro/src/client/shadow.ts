import type { ImportCompConfig } from '../../types/client'
import { registerShadowProxy } from './proxy'

export function createShadow(appname: string, config: ImportCompConfig) {
  const appWrapper = document.getElementById(appname)
  const shadow = appWrapper?.attachShadow({ mode: 'open' })

  // 阻止父元素的影响
  if (config.strictShadow) {
    const style = document.createElement('style')
    style.innerText = ':host {all: initial !important;}'
    shadow?.appendChild(style)
  }

  // if (config.shadow) registerShadowProxy(remoteUrl, shadow)

  return shadow
}

export function deleteShadow(appname: string, config: ImportCompConfig) {
  try {
    const appWrapper = document.getElementById(appname)
    if (!appWrapper || !appWrapper.shadowRoot) return

    const cloneDom = appWrapper.cloneNode()
    const parentDom = appWrapper.parentNode

    parentDom?.removeChild(appWrapper)

    parentDom?.appendChild(cloneDom)
  } catch (e) {
    console.error(e)
  }
}
