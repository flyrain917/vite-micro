const userRoute = [
    {
        path: '',
        redirect: '/base'
    },
    {
        path: '/base',
        component: () => import("../..views/Base.vue"),
    }
]

export default userRoute