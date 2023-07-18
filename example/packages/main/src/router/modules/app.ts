const mainRoute = [
    {
        path: '',
        redirect: '/home'
    },
    {
        path: '/home',
        component: () => import("../../views/Home.vue"),
    }
]

export default mainRoute