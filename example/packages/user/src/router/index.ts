import VueRouter from 'vue-router'
import userRoute from './modules/user'
import type { App } from 'vue';

const createRouter = (base: string) =>
  new VueRouter({
    mode: 'history',
    base: base || '/login',
    routes: userRoute,
  })

export default createRouter

export async function setupRouter(app: App<Element>, base: string) {
  const router = createRouter(base)
  app.use(router);
  await router.isReady()
  return router
}
