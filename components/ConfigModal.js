/**
 * components/ConfigModal.js — Settings Modal (Full-Screen)
 * iOS 26 dark frosted glass style.
 * Opened from the Config tab in AppShell.
 */
var ConfigModal = {
  name: 'ConfigModal',
  template: `
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="visible" class="fixed inset-0 z-[100] flex flex-col overflow-hidden"
          style="padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)">

          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 shrink-0"
            style="background:rgba(255,255,255,0.7);-webkit-backdrop-filter:blur(28px);backdrop-filter:blur(28px)">
            <h2 class="text-lg font-semibold text-slate-800">Configurações</h2>
            <button @click="close" class="btn-glass p-2.5" style="min-height:44px;min-width:44px;border-radius:12px" aria-label="Fechar">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            style="background:radial-gradient(ellipse 80% 60% at 10%85%,rgba(212,168,67,0.10)0%,transparent 60%),radial-gradient(ellipse 60%50% at 90%20%,rgba(26,123,181,0.06)0%,transparent 60%),linear-gradient(165deg,#e8ddce,#d6dbe3,#cdd6e0)">

            <!-- ═══ SYNC / LOGIN ═══ -->
            <div class="glass-strong p-4" style="border-radius:20px">
              <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <i data-lucide="cloud" class="w-4 h-4 text-azulejo"></i>
                Sincronização
              </h3>

              <!-- Logged in -->
              <div v-if="isLoggedIn" class="mb-3">
                <div class="glass rounded-2xl p-3 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-azulejo/15 flex items-center justify-center text-azulejo font-semibold text-sm flex-shrink-0">
                    {{ userEmail.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-700 truncate">{{ userEmail }}</div>
                    <div class="text-xs text-certo/70">Sincronizado</div>
                  </div>
                  <button @click="handleLogout" class="btn-glass px-3 py-1.5 text-xs font-medium text-erro" style="min-height:36px;border-radius:10px">
                    Sair
                  </button>
                </div>
              </div>

              <!-- Login form -->
              <div v-else>
                <div class="flex mb-3 bg-slate-100/50 rounded-xl p-0.5">
                  <button @click="authMode = 'login'"
                    class="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150"
                    :class="authMode === 'login' ? 'glass text-slate-800' : 'text-slate-400'"
                    style="min-height:40px">Entrar</button>
                  <button @click="authMode = 'register'"
                    class="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150"
                    :class="authMode === 'register' ? 'glass text-slate-800' : 'text-slate-400'"
                    style="min-height:40px">Registar</button>
                </div>

                <div class="mb-2.5">
                  <label class="text-xs font-medium text-slate-500 mb-1 block">Email</label>
                  <input v-model="authEmail" type="email" placeholder="seu@email.com"
                    class="glass-input w-full px-3.5 py-2.5 text-sm" style="min-height:44px;border-radius:12px" />
                </div>
                <div class="mb-3">
                  <label class="text-xs font-medium text-slate-500 mb-1 block">Palavra-passe</label>
                  <input v-model="authPassword" type="password" placeholder="••••••••"
                    class="glass-input w-full px-3.5 py-2.5 text-sm" style="min-height:44px;border-radius:12px" />
                </div>
                <div class="mb-3">
                  <label class="text-xs font-medium text-slate-500 mb-1 block">URL da API</label>
                  <input v-model="apiUrl" type="url" placeholder="https://api.exemplo.com"
                    class="glass-input w-full px-3.5 py-2.5 text-sm" style="min-height:44px;border-radius:12px" />
                </div>

                <button @click="handleAuth"
                  :disabled="!authEmail || !authPassword || authLoading"
                  class="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2" style="min-height:48px;border-radius:14px">
                  <span v-if="authLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span v-else>{{ authMode === 'login' ? 'Entrar' : 'Criar conta' }}</span>
                </button>
                <p v-if="authError" class="text-xs text-erro mt-1.5 text-center">{{ authError }}</p>
                <p v-if="authSuccess" class="text-xs text-certo mt-1.5 text-center">{{ authSuccess }}</p>
              </div>
            </div>

            <!-- ═══ SYNC ═══ -->
            <div v-if="isLoggedIn" class="glass-strong p-4" style="border-radius:20px">
              <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <i data-lucide="refresh-cw" class="w-4 h-4 text-azulejo"></i>
                Sincronizar
              </h3>
              <p v-if="lastSyncTime" class="text-[10px] text-slate-400 mb-3">Última: {{ lastSyncTime }}</p>
              <div class="flex gap-2.5 mb-2">
                <button @click="handleUpload" :disabled="syncLoading"
                  class="btn-primary flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5" style="min-height:48px;border-radius:14px">
                  <i data-lucide="upload-cloud" class="w-4 h-4"></i> Upload
                </button>
                <button @click="handleDownload" :disabled="syncLoading"
                  class="btn-glass flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5" style="min-height:48px;border-radius:14px">
                  <i data-lucide="download-cloud" class="w-4 h-4"></i> Download
                </button>
              </div>
              <p v-if="syncStatus" class="text-xs text-center mt-1.5"
                :class="syncStatus.includes('sucesso') ? 'text-certo' : 'text-erro'">{{ syncStatus }}</p>
            </div>

            <!-- ═══ DATA RESET ═══ -->
            <div class="glass-strong p-4" style="border-radius:20px;border:0.5px solid rgba(193,18,31,0.2)">
              <h3 class="text-sm font-semibold text-erro mb-3 flex items-center gap-1.5">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                Zona de Perigo
              </h3>
              <p class="text-xs text-slate-500 mb-3">Isto irá apagar todos os dados locais: léxico, erros e favoritos.</p>
              <button @click="confirmReset"
                class="w-full py-2.5 text-sm font-semibold transition-all duration-150"
                :class="resetConfirm ? 'bg-erro text-white' : 'bg-erro/10 text-erro border border-erro/25'"
                style="min-height:48px;border-radius:14px">
                {{ resetConfirm ? 'Toque novamente para confirmar' : 'Resetar todos os dados' }}
              </button>
              <p v-if="resetDone" class="text-xs text-center text-certo mt-1.5">Dados resetados com sucesso!</p>
            </div>

            <!-- ═══ FOOTER ═══ -->
            <div class="glass p-3 text-center" style="border-radius:14px">
              <p class="text-xs text-slate-400">Semedo Vocabulário · CAPLE Glass</p>
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
      authMode: 'login',
      authEmail: '',
      authPassword: '',
      apiUrl: '',
      authLoading: false,
      authError: '',
      authSuccess: '',
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
    lastSyncTime() {
      try {
        const ts = localStorage.getItem('SEMEDO_LAST_SYNC')
        if (!ts) return ''
        const d = new Date(parseInt(ts, 10))
        return d.toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
      } catch { return '' }
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.loadSettings()
        this.authError = ''
        this.authSuccess = ''
        this.syncStatus = ''
        this.resetConfirm = false
        this.resetDone = false
      }
    },
  },
  methods: {
    close() { this.$emit('close') },
    loadSettings() {
      if (typeof SyncManager !== 'undefined') this.apiUrl = SyncManager.getApiUrl()
    },
    async handleAuth() {
      if (!this.authEmail || !this.authPassword) return
      this.authLoading = true
      this.authError = ''
      this.authSuccess = ''
      try {
        if (typeof SyncManager === 'undefined') throw new Error('SyncManager não disponível')
        if (this.apiUrl) SyncManager.setApiUrl(this.apiUrl)
        if (this.authMode === 'login') {
          await SyncManager.login(this.authEmail, this.authPassword)
          this.authSuccess = 'Login efectuado com sucesso!'
        } else {
          await SyncManager.register(this.authEmail, this.authPassword)
          this.authSuccess = 'Conta criada com sucesso!'
        }
      } catch (e) {
        this.authError = e.message || 'Erro de autenticação'
      } finally { this.authLoading = false }
    },
    handleLogout() { if (typeof SyncManager !== 'undefined') SyncManager.logout() },
    async handleUpload() {
      this.syncLoading = true; this.syncStatus = ''
      try {
        if (typeof SyncManager === 'undefined') throw new Error('SyncManager não disponível')
        const total = (PTStore.data.my_vocab_zh2pt?.length || 0) + (PTStore.data.my_vocab_pt2zh?.length || 0)
        await SyncManager.pushAll()
        localStorage.setItem('SEMEDO_LAST_SYNC', String(Date.now()))
        this.syncStatus = '✅ Upload: ' + total + ' palavras do Meu Léxico enviadas'
      } catch (e) {
        this.syncStatus = '❌ Erro: ' + (e.message || 'falha no upload')
      } finally { this.syncLoading = false }
    },
    async handleDownload() {
      this.syncLoading = true; this.syncStatus = ''
      try {
        if (typeof SyncManager === 'undefined') throw new Error('SyncManager não disponível')
        const antes = (PTStore.data.my_vocab_zh2pt?.length || 0) + (PTStore.data.my_vocab_pt2zh?.length || 0)
        await SyncManager.pullAll()
        const depois = (PTStore.data.my_vocab_zh2pt?.length || 0) + (PTStore.data.my_vocab_pt2zh?.length || 0)
        const novas = depois - antes
        localStorage.setItem('SEMEDO_LAST_SYNC', String(Date.now()))
        this.syncStatus = '✅ Download: ' + (novas > 0 ? novas + ' novas palavras importadas' : 'já actualizado (' + depois + ' no Meu Léxico)')
      } catch (e) {
        this.syncStatus = '❌ Erro: ' + (e.message || 'falha no download')
      } finally { this.syncLoading = false }
    },
    confirmReset() {
      if (!this.resetConfirm) {
        this.resetConfirm = true
        setTimeout(() => { this.resetConfirm = false }, 3000)
        return
      }
      try {
        localStorage.removeItem('PT_LEARNING_DATA')
        if (typeof PTStore !== 'undefined') {
          PTStore.data = Storage.init()
          PTStore.save()
        }
        this.resetConfirm = false; this.resetDone = true
        setTimeout(() => { this.resetDone = false }, 3000)
      } catch (e) { console.error('Reset failed:', e) }
    },
  },
  mounted() {
    if (this.visible) this.loadSettings()
    this.$nextTick(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons() })
  },
  updated() {
    this.$nextTick(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons() })
  },
}
