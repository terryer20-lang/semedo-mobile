/**
 * components/AppShell.js — Main application shell for Semedo-Mobile
 *
 * Layout:
 *  - Fixed glass header with app title + StudyStats + sync indicator
 *  - Main content area with <Transition> for tab view switching
 *  - Fixed bottom tab navigation bar (glass, safe-area aware)
 *  - ConfigModal overlay (triggered by gear button)
 *
 * Tabs:
 *  - Praticar  (VocabView)   — book-open icon
 *  - Meu Léxico (MeuLexicoView) — book-marked icon
 *  - Erros     (ErrosView)   — alert-triangle icon
 *  - Config    (separate gear button → opens ConfigModal, not a tab)
 *
 * Dependencies:
 *  - Vue 3 (global)
 *  - PTStore from store/storage.js
 *  - SyncManager from utils/sync.js
 *  - Lucide icons (lucide.createIcons() called after each render)
 *  - Anim from utils/animation.js (used indirectly via StudyStats)
 *
 * The view components (VocabView, MeuLexicoView, ErrosView) and ConfigModal
 * are expected to be globally registered by app.js.
 */

const AppShell = {
  name: 'AppShell',

  components: {
    StudyStats,
  },

  template: `
    <div class="AppShell relative min-h-screen bg-transparent flex flex-col">

      <!-- ======== Fixed Header ======== -->
      <header
        class="fixed top-0 left-0 right-0 z-30 glass-card-strong rounded-none"
        style="padding-top: calc(0.625rem + var(--safe-top)); padding-bottom: 0.5rem; padding-left: 1rem; padding-right: 1rem;"
      >
        <div class="flex items-center justify-between" style="min-height: 40px;">
          <!-- App title -->
          <h1 class="text-lg font-bold text-gray-800 tracking-tight leading-none">
            Semedo
          </h1>

          <!-- Right side: stats + sync dot -->
          <div class="flex items-center gap-2.5">
            <StudyStats />

            <!-- Sync status dot -->
            <span
              class="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300"
              :class="syncDotClass"
              :title="syncStatus.connected ? 'Sincronizado' : 'Offline'"
            ></span>
          </div>
        </div>
      </header>

      <!-- ======== Main Content ======== -->
      <main
        class="flex-1 px-4 overflow-y-auto"
        style="padding-top: calc(4.5rem + var(--safe-top)); padding-bottom: calc(6.5rem + var(--safe-bottom));"
      >
        <Transition name="view" mode="out-in">
          <component :is="currentView" :key="activeTab" />
        </Transition>
      </main>

      <!-- ======== Bottom Tab Navigation ======== -->
      <nav
        class="fixed bottom-0 left-0 right-0 z-30 nav-glass"
        style="padding-bottom: calc(0.375rem + var(--safe-bottom));"
      >
        <div class="flex items-center justify-around px-1 pt-1">
          <!-- Tab buttons (v-for) -->
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="switchTab(tab.id)"
            class="flex flex-col items-center justify-center py-1.5 px-2 min-w-[64px] rounded-xl transition-colors duration-150 active:scale-95"
            :class="activeTab === tab.id ? 'text-azulejo' : 'text-gray-400'"
            :aria-label="tab.label"
          >
            <i :data-lucide="tab.icon" class="w-5 h-5 pointer-events-none"></i>
            <span class="text-[10px] mt-0.5 font-medium leading-tight pointer-events-none">
              {{ tab.label }}
            </span>
            <span v-if="activeTab === tab.id" class="nav-indicator"></span>
          </button>

          <!-- Config gear (separate — opens modal, not a tab) -->
          <button
            @click="openConfig"
            class="flex flex-col items-center justify-center py-1.5 px-2 min-w-[64px] rounded-xl text-gray-400 transition-colors duration-150 active:scale-95 hover:text-gray-600"
            aria-label="Configurações"
          >
            <i data-lucide="settings" class="w-5 h-5 pointer-events-none"></i>
            <span class="text-[10px] mt-0.5 font-medium leading-tight pointer-events-none">
              Config
            </span>
          </button>
        </div>
      </nav>

      <!-- ======== Config Modal ======== -->
      <ConfigModal
        :show="showConfigModal"
        @close="closeConfig"
      />

    </div>
  `,

  data() {
    return {
      /** Currently active tab ID: 'praticar' | 'meu-lexico' | 'erros' */
      activeTab: 'praticar',

      /** Whether the Config settings modal is visible */
      showConfigModal: false,

      /** Sync status object (polled) */
      syncStatus: {
        connected: false,
        syncing: false,
      },

      /** Tab definitions */
      tabs: [
        { id: 'praticar',   label: 'Praticar',   icon: 'book-open' },
        { id: 'meu-lexico', label: 'Meu Léxico',  icon: 'book-marked' },
        { id: 'erros',      label: 'Erros',       icon: 'alert-triangle' },
      ],

      /** Sync status polling timer handle */
      _syncTimer: null,
    }
  },

  computed: {
    /**
     * Returns the CSS class for the sync indicator dot.
     * - Green pulsing = connected
     * - Gray solid    = offline
     */
    syncDotClass() {
      if (this.syncStatus.connected) {
        return 'bg-green-500 anim-pulse'
      }
      return 'bg-gray-300'
    },

    /**
     * Resolves the current tab name to a globally-registered Vue component.
     * Components must be registered by app.js before mounting.
     */
    currentView() {
      switch (this.activeTab) {
        case 'praticar':   return 'VocabView'
        case 'meu-lexico': return 'MeuLexicoView'
        case 'erros':      return 'ErrosView'
        default:           return null
      }
    },
  },

  methods: {
    /** Switch to a different tab */
    switchTab(tabId) {
      this.activeTab = tabId
    },

    /** Open the settings/config modal */
    openConfig() {
      this.showConfigModal = true
    },

    /** Close the settings/config modal */
    closeConfig() {
      this.showConfigModal = false
    },

    /** Poll SyncManager connection status */
    _pollSyncStatus() {
      if (typeof SyncManager !== 'undefined' && SyncManager.isLoggedIn) {
        this.syncStatus.connected = SyncManager.isLoggedIn()
      } else {
        this.syncStatus.connected = false
      }
    },

    /** (Re)render Lucide icons in the DOM */
    _renderIcons() {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        try {
          lucide.createIcons()
        } catch (_) {
          // Silently ignore if Lucide isn't ready
        }
      }
    },
  },

  mounted() {
    // Initial sync status
    this._pollSyncStatus()

    // Poll sync status every 5 seconds
    this._syncTimer = setInterval(() => this._pollSyncStatus(), 5000)

    // Render Lucide icons after mount
    this.$nextTick(() => this._renderIcons())
  },

  updated() {
    // Re-render Lucide icons after every DOM update (new tab content, etc.)
    this.$nextTick(() => this._renderIcons())
  },

  beforeUnmount() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer)
      this._syncTimer = null
    }
  },
}

// Make available globally for app.js
if (typeof window !== 'undefined') window.AppShell = AppShell
