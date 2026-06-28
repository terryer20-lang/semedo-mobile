/**
 * app.js — Vue 3 Application Bootstrap for Semedo-Mobile (Vocabulário)
 *
 * Mounts the AppShell component, registers globally-defined IIFE
 * components with the Vue app instance, and initialises the SyncManager.
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
  const GLOBAL_COMPONENTS = [
    'ConfigModal', 'VocabView', 'MeuLexicoView', 'StudyStats',
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

    if (
      typeof SyncManager.isLoggedIn === 'function' &&
      SyncManager.isLoggedIn()
    ) {
      SyncManager.pullAll().catch(function (err) {
        console.warn('[app] Initial sync pull failed:', err.message || err)
      })
    }
  }

  // ─── Register service worker ───
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
