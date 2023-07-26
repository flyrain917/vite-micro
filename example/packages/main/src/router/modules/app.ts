import { entryImportVue } from 'vite-micro'

const mainRoute = [
    {
        path: '',
        redirect: '/home'
    },
    {
        path: '/home',
        component: () => import("../../views/Home.vue"),
    },
    {
        path: '/login',
        component: () => entryImportVue('login/entry'),
    },
    {
        path: '/user',
        component: () => entryImportVue('user/entry'),
    }
]

export default mainRoute