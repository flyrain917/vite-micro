import type { ImportCompConfig } from '../../types/client'
import { MicroShadowRoot } from 'types'

function createHead(shadow) {
  const div = document.createElement('div')
  div.classList.add('head')
  shadow.appendChild(div)
  shadow.head = div
}

function createBody(shadow) {
  const div = document.createElement('div')
  div.classList.add('body')
  shadow.appendChild(div)
  shadow.body = div
}

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

export function createShadow(appname: string, config: ImportCompConfig) {
  const appWrapper = document.getElementById(appname)
  const shadow: MicroShadowRoot | undefined = appWrapper?.attachShadow({ mode: 'open' })

  createHead(shadow)
  createBody(shadow)

  // 阻止父元素的影响
  if (config.strictShadow) {
    const style = document.createElement('style')
    style.innerText = ':host {all: initial !important;}'
    shadow?.head?.appendChild(style)
  }

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
