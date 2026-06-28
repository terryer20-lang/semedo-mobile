const CACHE = 'semedo-vocab-v1'
const ASSETS = [
  'index.html', 'manifest.json',
  'app.js', 'store/storage.js',
  'data/uploaded_qecr_data.js',
  'utils/diacritics.js', 'utils/sync.js', 'utils/animation.js',
  'components/AppShell.js', 'components/ConfigModal.js',
  'components/VocabView.js', 'components/MeuLexicoView.js',
  'components/StudyStats.js',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url)
  if (u.hostname.includes('unpkg.com') || u.hostname.includes('cdn.')) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return r }).catch(() => caches.match(e.request)))
  } else {
    e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)))
  }
})
