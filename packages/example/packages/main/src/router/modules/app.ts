import { entryImportVue, remoteImport } from 'vite-micro/client'

const mainRoute = [
  {
    path: '',
    redirect: '/home',
  },
  {
    path: '/test',
    component: () => import('../../views/test'),
  },
  {
    path: '/home',
    component: () => import('../../views/Home.vue'),
  },
  {
    path: '/login/:chapters*',
    component: () => entryImportVue('loginRemote/entry'),
  },
  {
    path: '/user',
    component: () => import('../../views/User.vue'),
    children: [
      {
        path: '/user/:chapters*',
        component: () => entryImportVue('userRemote/entry', { shadow: true }),
      },
    ],
  },
  {
    path: '/button',
    component: () => remoteImport('loginRemote/Button'),
  },
]

export default mainRoute
