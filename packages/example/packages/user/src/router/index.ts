import * as VueRouter from 'vue-router'
import userRoute from './modules/user'
import type { App } from 'vue'

const createRouter = (base: string) =>
  VueRouter.createRouter({
    mode: 'history',
    history: VueRouter.createWebHistory(),
    base: base || '/user',
    routes: userRoute,
  })

export default createRouter

export async function setupRouter(app: App<Element>, base: string) {
  const router = createRouter(base)
  app.use(router)
  await router.isReady()
  return router
}
