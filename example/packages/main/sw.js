self._share_federation_ = {}
//  self.clients.matchAll({type: 'window', includeUncontrolled: true})
// https://www.jianshu.com/p/8c0fc2866b82

self.addEventListener('install', function (e) {
  console.log('[Service Worker] Install')
})

self.addEventListener('message', function (event) {
  if (event.data.type === 'window-unloaded') {
    self._share_federation_ = {}
    console.log('======clients===', self.clients)
  }
})

self.addEventListener('fetch', function (e) {
  // console.log('[Service Worker] Fetched resource ' + e.request.url)
  const url = e.request.url

  if (!url.includes('vue.js')) return

  e.respondWith(
    (async () => {
      self._share_federation_ = self._share_federation_ || {}
      const vuePromise = self._share_federation_.vue
      console.log('=====vuePromise===', vuePromise)
      if (vuePromise) {
        self._share_federation_.vue = vuePromise.clone()
        return vuePromise
      }

      const vueResponse = await fetch(e.request)

      self._share_federation_.vue = vueResponse.clone()

      return vueResponse
    })()
  )
})
