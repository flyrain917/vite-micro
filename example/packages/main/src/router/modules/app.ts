import { entryImportVue } from 'vite-micro/client'

const mainRoute = [
  {
    path: '',
    redirect: '/home',
  },
  {
    path: '/home',
    component: () => import('../../views/Home.vue'),
  },
  {
    path: '/login',
    component: () => entryImportVue('loginRemote/entry'),
  },
  {
    path: '/user',
    component: () => entryImportVue('userRemote/entry'),
  },
]

export default mainRoute
