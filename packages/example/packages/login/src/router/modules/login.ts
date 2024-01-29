import LoginPage from '../../views/Login.vue'

const loginRoute = [
  {
    path: '',
    redirect: '/pwd',
  },
  {
    path: '/pwd',
    component: () => {
      return import('../../views/Login.vue')
    },
  },
]

export default loginRoute
