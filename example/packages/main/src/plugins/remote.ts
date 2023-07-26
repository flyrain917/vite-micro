import { registerRemote } from 'vite-micro'

registerRemote({
  login: '/login',
  user: '/user'  
})