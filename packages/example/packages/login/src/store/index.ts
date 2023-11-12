import { createPinia } from 'pinia'

const store = createPinia()

export function setupStore(app: any) {
  app.use(store)
}

export { store }
