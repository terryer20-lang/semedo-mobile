/**
 * app.js — Vue 3 Application Bootstrap for Semedo-Mobile
 *
 * Mounts the AppShell component, registers globally-defined IIFE
 * components with the Vue app instance, and initialises the SyncManager.
 *
 * Scripts must be loaded in this order (already in index.html):
 *   vue@3 → lucide → gsap → storage.js → diacritics.js → sync.js →
 *   animation.js → AppShell.js → ConfigModal.js → VocabView.js →
 *   MeuLexicoView.js → ErrosView.js → StudyStats.js → app.js
 *
 * All components are IIFE globals (not ES modules).
 */

;(function () {
  'use strict'

  const { createApp } = Vue

  // ─── Create the Vue application ───
  const app = createApp({
    template: '<AppShell />',
    components: { AppShell },
  })

  // ─── Register globally-defined IIFE components ───
  // These are defined as `const XxxView = { ... }` in separate script tags
  // and assigned to `window` in each file for cross-file accessibility.
  const GLOBAL_COMPONENTS = [
    'ConfigModal', 'VocabView', 'MeuLexicoView', 'ErrosView', 'StudyStats',
  ]

  GLOBAL_COMPONENTS.forEach(function (name) {
    try {
      var comp = eval(name)
      if (comp) {
        app.component(name, comp)
      } else {
        console.warn('[app] Component "' + name + '" not found.')
      }
    } catch(e) {
      console.warn('[app] Failed to register "' + name + '":', e.message)
    }
  })

  // ─── Mount the app to #app container ───
  app.mount('#app')

  // ─── Initialise SyncManager ───
  if (typeof SyncManager !== 'undefined' && SyncManager.init) {
    SyncManager.init()

    // Perform an initial pull if the user is already logged in
    // (so fresh page loads show the latest cloud data without waiting)
    if (
      typeof SyncManager.isLoggedIn === 'function' &&
      SyncManager.isLoggedIn()
    ) {
      SyncManager.pullAll().catch(function (err) {
        console.warn('[app] Initial sync pull failed:', err.message || err)
      })
    }
  }

  // ─── Register service worker (if not already registered) ───
  // The inline script in index.html also tries; this guards against
  // race conditions on re-entrant loads.
  if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('service-worker.js')
        .catch(function (e) {
          console.warn('[app] SW registration:', e.message || e)
        })
    })
  }
})()
