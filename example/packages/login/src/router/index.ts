import VueRouter from 'vue-router'
import loginRoute from './modules/login'
import type { App } from 'vue';

const createRouter = (base: string) =>
  new VueRouter({
    mode: 'history',
    base: base || '/login',
    routes: loginRoute,
  })

export default createRouter

export async function setupRouter(app: App<Element>, base: string) {
  const router = createRouter(base)
  app.use(router);
  await router.isReady()
  return router
}
