import * as VueRouter from 'vue-router'
import mainRoute from './modules/app'
import type { App } from 'vue'

const createRouter = (base: string) =>
  VueRouter.createRouter({
    mode: 'history',
    history: VueRouter.createWebHistory(),
    base: '/',
    routes: mainRoute,
  })

export default createRouter

export async function setupRouter(app: App<Element>, base: string) {
  const router = createRouter(base)
  app.use(router)
  await router.isReady()
  return router
}
