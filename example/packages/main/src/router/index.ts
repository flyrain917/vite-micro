import VueRouter from 'vue-router'
import mainRoute from './modules/app'
import type { App } from 'vue';

const createRouter = (base: string) =>
  new VueRouter({
    mode: 'history',
    base: '/',
    routes: mainRoute,
  })

export default createRouter

export async function setupRouter(app: App<Element>, base: string) {
  const router = createRouter(base)
  app.use(router);
  await router.isReady()
  return router
}
