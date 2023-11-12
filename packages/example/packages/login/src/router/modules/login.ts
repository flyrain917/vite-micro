const loginRoute = [
    {
        path: '',
        redirect: '/pwd'
    },
    {
        path: '/pwd',
        component: () => import("../../views/Login.vue"),
    }
]

export default loginRoute