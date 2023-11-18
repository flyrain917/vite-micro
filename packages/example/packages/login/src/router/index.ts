import * as VueRouter from 'vue-router'
import loginRoute from './modules/login'
import type { App } from 'vue'

const createRouter = (base: string) =>
  VueRouter.createRouter({
    mode: 'history',
    history: VueRouter.createWebHistory(base || 'login'),
    routes: loginRoute,
  })

export default createRouter

export async function setupRouter(app: App<Element>, base: string) {
  const router = createRouter(base)
  app.use(router)
  await router.isReady()
  return router
}
