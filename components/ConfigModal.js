/**
 * components/ConfigModal.js — Settings / Login Modal (Mobile Full-Screen)
 *
 * Full-screen modal with: login/register, DeepSeek API key, sync, data reset.
 * Mobile-optimized with large touch targets and safe-area padding.
 *
 * IIFE global Vue component object. Uses Vue 3 Options API.
 * Dependencies: PTStore (store/storage.js), SyncManager (utils/sync.js)
 */
var ConfigModal = {
  name: 'ConfigModal',
  template: `
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="visible" class="fixed inset-0 z-[100] flex flex-col bg-[#e8ddce] overflow-hidden"
          style="padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)">

          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-white/30 flex-shrink-0">
            <h2 class="text-lg font-semibold text-[#1a1a2e]">Configurações</h2>
            <button @click="close" class="btn-glass p-2.5" style="min-height:44px;min-width:44px" aria-label="Fechar">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Scrollable Content -->
          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            <!-- ═══ SYNC / LOGIN SECTION ═══ -->
            <div class="glass-card-strong p-4">
              <h3 class="text-sm font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
                <i data-lucide="cloud" class="w-4 h-4 text-[#1a7bb5]"></i>
                Sincronização na Nuvem
              </h3>

              <!-- Logged in state -->
              <div v-if="isLoggedIn" class="mb-3">
                <div class="glass-card bg-[#2d6a4f]/8 border border-[#2d6a4f]/15 p-3 rounded-xl flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-[#1a7bb5] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {{ userEmail.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-[#1a1a2e] truncate">{{ userEmail }}</div>
                    <div class="text-xs text-[#2d6a4f]">Sincronizado</div>
                  </div>
                  <button @click="handleLogout" class="btn-glass px-3 py-1.5 text-xs font-medium text-[#c1121f]" style="min-height:36px">
                    Sair
                  </button>
                </div>
              </div>

              <!-- Login form -->
              <div v-else>
                <!-- Toggle login/register -->
                <div class="flex mb-3 bg-white/50 rounded-lg p-0.5">
                  <button @click="authMode = 'login'"
                    class="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150"
                    :class="authMode === 'login' ? 'bg-white text-[#1a7bb5] shadow-sm' : 'text-[#4a4a5e]'"
                    style="min-height:40px">Entrar</button>
                  <button @click="authMode = 'register'"
                    class="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150"
                    :class="authMode === 'register' ? 'bg-white text-[#1a7bb5] shadow-sm' : 'text-[#4a4a5e]'"
                    style="min-height:40px">Registar</button>
                </div>

                <!-- Email -->
                <div class="mb-2.5">
                  <label class="text-xs font-medium text-[#4a4a5e] mb-1 block">Email</label>
                  <input v-model="authEmail" type="email" placeholder="seu@email.com"
                    class="glass-input w-full px-3.5 py-2.5 text-sm" style="min-height:44px" />
                </div>
                <!-- Password -->
                <div class="mb-3">
                  <label class="text-xs font-medium text-[#4a4a5e] mb-1 block">Palavra-passe</label>
                  <input v-model="authPassword" type="password" placeholder="••••••••"
                    class="glass-input w-full px-3.5 py-2.5 text-sm" style="min-height:44px" />
                </div>
                <!-- API URL -->
                <div class="mb-3">
                  <label class="text-xs font-medium text-[#4a4a5e] mb-1 block">URL da API</label>
                  <input v-model="apiUrl" type="url" placeholder="https://api.exemplo.com"
                    class="glass-input w-full px-3.5 py-2.5 text-sm" style="min-height:44px" />
                </div>

                <!-- Submit -->
                <button @click="handleAuth"
                  :disabled="!authEmail || !authPassword || authLoading"
                  class="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                  style="min-height:48px">
                  <span v-if="authLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span v-else>{{ authMode === 'login' ? 'Entrar' : 'Criar conta' }}</span>
                </button>
                <p v-if="authError" class="text-xs text-[#c1121f] mt-1.5 text-center">{{ authError }}</p>
                <p v-if="authSuccess" class="text-xs text-[#2d6a4f] mt-1.5 text-center">{{ authSuccess }}</p>
              </div>
            </div>

            <!-- ═══ DEEPSEEK API KEY ═══ -->
            <div class="glass-card-strong p-4">
              <h3 class="text-sm font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
                <i data-lucide="key" class="w-4 h-4 text-[#d4a843]"></i>
                DeepSeek API
              </h3>
              <div class="mb-2">
                <label class="text-xs font-medium text-[#4a4a5e] mb-1 block">Chave da API</label>
                <div class="flex gap-2">
                  <input v-model="deepseekKey" type="password" placeholder="sk-…"
                    class="glass-input flex-1 px-3.5 py-2.5 text-sm" style="min-height:44px" />
                </div>
                <p class="text-[10px] text-[#8a8a9e] mt-1">Usada para funções de IA no desktop. Opcional no móvel.</p>
              </div>
              <button @click="saveKey"
                class="btn-primary w-full py-2.5 text-sm font-semibold"
                style="min-height:44px">
                <i data-lucide="save" class="w-4 h-4 inline mr-1"></i> Guardar
              </button>
            </div>

            <!-- ═══ SYNC NOW ═══ -->
            <div v-if="isLoggedIn" class="glass-card-strong p-4">
              <h3 class="text-sm font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
                <i data-lucide="refresh-cw" class="w-4 h-4 text-[#1a7bb5]"></i>
                Sincronizar
              </h3>
              <button @click="handleSync"
                :disabled="syncLoading"
                class="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                style="min-height:48px">
                <span v-if="syncLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span v-else><i data-lucide="cloud" class="w-4 h-4 inline mr-1"></i> Sincronizar agora</span>
              </button>
              <p v-if="syncStatus" class="text-xs text-center mt-1.5"
                :class="syncStatus.includes('sucesso') || syncStatus.includes('Sucesso') ? 'text-[#2d6a4f]' : 'text-[#c1121f]'">
                {{ syncStatus }}
              </p>
            </div>

            <!-- ═══ DATA RESET ═══ -->
            <div class="glass-card-strong p-4 border border-[#c1121f]/20">
              <h3 class="text-sm font-semibold text-[#c1121f] mb-3 flex items-center gap-1.5">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                Zona de Perigo
              </h3>
              <p class="text-xs text-[#4a4a5e] mb-3">Isto irá apagar todos os dados locais: léxico, erros, favoritos e histórico.</p>
              <button @click="confirmReset"
                class="w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-150"
                :class="resetConfirm
                  ? 'bg-[#c1121f] text-white'
                  : 'bg-[#c1121f]/10 text-[#c1121f] border border-[#c1121f]/30'"
                style="min-height:48px">
                {{ resetConfirm ? 'Toque novamente para confirmar' : 'Resetar todos os dados' }}
              </button>
              <p v-if="resetDone" class="text-xs text-center text-[#2d6a4f] mt-1.5">Dados resetados com sucesso!</p>
            </div>

            <!-- ═══ USER INFO ═══ -->
            <div class="glass-card p-3 text-center">
              <p class="text-xs text-[#8a8a9e]">
                Semedo Móvel · CAPLE Glass
              </p>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>
  `,
  props: {
    visible: { type: Boolean, default: false },
  },
  emits: ['close'],
  data() {
    return {
      authMode: 'login', // 'login' | 'register'
      authEmail: '',
      authPassword: '',
      apiUrl: '',
      authLoading: false,
      authError: '',
      authSuccess: '',
      deepseekKey: '',
      syncLoading: false,
      syncStatus: '',
      resetConfirm: false,
      resetDone: false,
    }
  },
  computed: {
    isLoggedIn() {
      return typeof SyncManager !== 'undefined' && SyncManager.isLoggedIn()
    },
    userEmail() {
      if (typeof SyncManager !== 'undefined' && SyncManager.isLoggedIn()) {
        const user = SyncManager.getUser()
        return user?.email || 'Utilizador'
      }
      return ''
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.loadSettings()
        // Reset ephemeral state
        this.authError = ''
        this.authSuccess = ''
        this.syncStatus = ''
        this.resetConfirm = false
        this.resetDone = false
      }
    },
  },
  methods: {
    close() {
      this.$emit('close')
    },

    /** Load saved settings */
    loadSettings() {
      // API URL
      if (typeof SyncManager !== 'undefined') {
        this.apiUrl = SyncManager.getApiUrl()
      }
      // DeepSeek key from PTStore config
      if (PTStore.data?.config?.deepseekKey) {
        this.deepseekKey = PTStore.data.config.deepseekKey
      }
    },

    /** Handle login or register */
    async handleAuth() {
      if (!this.authEmail || !this.authPassword) return
      this.authLoading = true
      this.authError = ''
      this.authSuccess = ''
      try {
        if (typeof SyncManager === 'undefined') {
          throw new Error('SyncManager não disponível')
        }
        // Save API URL first
        if (this.apiUrl) {
          SyncManager.setApiUrl(this.apiUrl)
        }
        if (this.authMode === 'login') {
          await SyncManager.login(this.authEmail, this.authPassword)
          this.authSuccess = 'Login efectuado com sucesso!'
        } else {
          await SyncManager.register(this.authEmail, this.authPassword)
          this.authSuccess = 'Conta criada com sucesso!'
        }
      } catch (e) {
        this.authError = e.message || 'Erro de autenticação'
      } finally {
        this.authLoading = false
      }
    },

    /** Logout */
    handleLogout() {
      if (typeof SyncManager !== 'undefined') {
        SyncManager.logout()
      }
    },

    /** Save DeepSeek API key */
    saveKey() {
      PTStore.updateConfig({ deepseekKey: this.deepseekKey })
    },

    /** Trigger sync */
    async handleSync() {
      this.syncLoading = true
      this.syncStatus = ''
      try {
        if (typeof SyncManager === 'undefined') {
          throw new Error('SyncManager não disponível')
        }
        await SyncManager.sync()
        this.syncStatus = '✅ Sincronizado com sucesso!'
      } catch (e) {
        this.syncStatus = '❌ Erro: ' + (e.message || 'falha na sincronização')
      } finally {
        this.syncLoading = false
      }
    },

    /** Two-tap confirm data reset */
    confirmReset() {
      if (!this.resetConfirm) {
        this.resetConfirm = true
        setTimeout(() => { this.resetConfirm = false }, 3000)
        return
      }
      // Confirmed — reset
      try {
        localStorage.removeItem('PT_LEARNING_DATA')
        // Re-initialize
        if (typeof PTStore !== 'undefined') {
          PTStore.data = Storage.init()
          PTStore.save()
        }
        this.resetConfirm = false
        this.resetDone = true
        setTimeout(() => { this.resetDone = false }, 3000)
      } catch (e) {
        console.error('Reset failed:', e)
      }
    },
  },
  mounted() {
    if (this.visible) this.loadSettings()
    this.$nextTick(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons()
    })
  },
  updated() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons()
  },
}
