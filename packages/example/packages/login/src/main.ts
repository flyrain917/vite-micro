import { createApp } from 'vue'
import { setupStore } from './store/index'
import { setupRouter } from './router/index'
import App from './App.vue'

console.log('======createApp.test===', createApp.test)

let app: any = null
export async function mount(name: string, base: string) {
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
