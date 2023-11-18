import { createApp } from 'vue'
import { setupStore } from './store/index'
import { setupRouter } from './router/index'
import App from './App.vue'

console.log('======createApp.test===', createApp.test)

let app: any = null
export async function mount(name: string, base: string) {
  /**
   * 这个方法里面可以创建标识：window.isMicro = true 来判断是否是微应用启动
   * 或者直接使用window.__federation_shared__来判断也可
   *  */
  console.log('=======base======', base)
  app = createApp(App)

  // 配置store
  setupStore(app)

  // 配置router
  setupRouter(app, base)

  app.mount(name)

  console.log('start mount!!!', name)

  return app
}

export function unMount() {
  console.log('start unmount --->')
  app && app.$destroy()
}
