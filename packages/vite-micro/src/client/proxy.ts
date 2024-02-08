import { MicroShadowRoot } from 'types'

const document: any = window.document

const shadowMaps: any = {}
const promiseArr: any[] = []

export async function registerShadowProxy(name: string, shadow: MicroShadowRoot) {
  // shadowMaps[name] = shadow

  const curTask: { promise?: Promise<any> | string; resolve?: Function } = {}

  if (promiseArr.length === 0) {
    curTask.promise = 'resolved'
    proxyDocument(shadow)
    console.log('=====proxy11', curTask.promise, name)
  } else {
    curTask.promise = new Promise((reolve: Function) => {
      curTask.resolve = reolve
    }).then(() => {
      proxyDocument(shadow)
    })
    console.log('=====proxy22', curTask.promise, name)
  }

  promiseArr.push(curTask)

  console.log('=====proxy33', curTask.promise, name)

  return curTask.promise
}

export function unRegisterShadowProxy() {
  document.getElementById = document.originGetElementById || document.getElementById
  document.head.appendChild = document.head.originAppendChild || document.head.appendChild
  document.isProxyed = false

  // 任务列表里面的第一个任务永远代表当前的任务，且当前任务已结束
  promiseArr.shift()
  if (promiseArr.length === 0) return
  // 执行下一步任务
  const nextTask = promiseArr[0]
  nextTask.resolve && nextTask.resolve()
}

export function proxyDocument(shadow: MicroShadowRoot) {
  proxyDocumentGetElementById(shadow)
  proxyHeadAppendChild(shadow)
}

/**
 * 在shadow里面 使用document.getElementById，使用shadow的父dom代替
 */
export function proxyDocumentGetElementById(shadow: MicroShadowRoot) {
  document.originGetElementById = document.originGetElementById || document.getElementById
  document.getElementById = function (selector: string) {
    return shadow.getElementById(selector)
  }
  document.isProxyed = true
}

export function proxyDocumentQuerySelector(shadow: MicroShadowRoot) {
  document.originQuerySelector = document.originQuerySelector || document.querySelector
  document.querySelector = function (selector: string) {
    return shadow.getElementById(selector)
  }
  document.isProxyed = true
}

/**
 * 在shadow里面 document.head.appendChild(style) 需要替换为shadow.appendChild(style)
 */
export function proxyHeadAppendChild(shadow: MicroShadowRoot) {
  document.head.originAppendChild = document.head.originAppendChild || document.head.appendChild
  console.log('======proxy-head11', document.head.originAppendChild)
  document.head.appendChild = function (style: HTMLElement) {
    console.log('======proxy-head', style)
    return shadow.head?.appendChild(style)
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
