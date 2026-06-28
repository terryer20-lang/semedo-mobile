/**
 * components/ConfigModal.js — 設定/登錄（手機全屏 Modal）
 */
const ConfigModal = {
  template: `
    <transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
           style="background:rgba(0,0,0,0.15);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)"
           @click.self="$emit('close')">
        <div class="glass-card-strong w-full max-w-md mx-4 mb-4 sm:mb-0 p-5 max-h-[85vh] overflow-y-auto"
             @click.stop style="border-radius:16px">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-slate-800">Configurações</h3>
            <button @click="$emit('close')" class="text-slate-400 p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <!-- User name -->
          <div class="mb-4">
            <label class="block text-xs text-slate-500 mb-1.5 font-medium">Nome</label>
            <input type="text" v-model="local.userName" class="w-full px-3 py-2.5 glass-input text-sm">
          </div>

          <!-- DeepSeek Key -->
          <div class="mb-4">
            <label class="block text-xs text-slate-500 mb-1.5 font-medium">Chave DeepSeek</label>
            <input type="password" v-model="local.deepseekKey" class="w-full px-3 py-2.5 glass-input text-sm" placeholder="sk-...">
          </div>

          <!-- ═══ Sync ═══ -->
          <div class="mb-4 p-3.5 rounded-lg border border-blue-200 bg-blue-50/40">
            <p class="text-xs font-bold text-azulejo uppercase tracking-wider mb-2">Sincronização</p>
            <template v-if="!syncLoggedIn">
              <input type="email" v-model="syncEmail" placeholder="Email" class="w-full px-3 py-2.5 glass-input text-sm mb-2">
              <input type="password" v-model="syncPassword" placeholder="Password" class="w-full px-3 py-2.5 glass-input text-sm mb-2"
                     @keydown.enter="doLogin">
              <input type="url" v-model="syncApiUrl" placeholder="API URL" class="w-full px-3 py-2.5 glass-input text-sm mb-2">
              <div class="flex gap-2">
                <button @click="doLogin" class="flex-1 py-2.5 btn-primary text-sm font-medium">Entrar</button>
                <button @click="doRegister" class="flex-1 py-2.5 btn-glass text-sm font-medium">Registar</button>
              </div>
              <p v-if="syncMsg" class="text-xs mt-2" :class="syncMsgType==='erro'?'text-erro':'text-certo'">{{ syncMsg }}</p>
            </template>
            <template v-else>
              <p class="text-xs text-slate-600 mb-2"><i data-lucide="check-circle" class="w-3.5 h-3.5 inline text-certo mr-1"></i>{{ syncUser?.email }}</p>
              <div class="flex gap-2">
                <button @click="doSync" class="flex-1 py-2.5 btn-primary text-sm font-medium flex items-center justify-center gap-1">
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>Sincronizar
                </button>
                <button @click="doLogout" class="py-2.5 px-4 btn-glass text-sm font-medium">Sair</button>
              </div>
              <p v-if="syncMsg" class="text-xs mt-2" :class="syncMsgType==='erro'?'text-erro':'text-certo'">{{ syncMsg }}</p>
            </template>
          </div>

          <!-- Danger -->
          <div class="mb-4 p-3.5 rounded-lg border border-rose-200 bg-rose-50/40">
            <p class="text-xs font-bold text-erro uppercase tracking-wider mb-1">Danger Zone</p>
            <p class="text-[10px] text-rose-600 mb-2">Apaga todos os dados locais.</p>
            <button @click="resetData" class="py-2 px-4 bg-erro text-white text-xs font-medium rounded-lg">Apagar dados</button>
          </div>

          <button @click="guardar" class="w-full py-2.5 btn-primary text-sm font-medium">Guardar</button>
        </div>
      </div>
    </transition>
  `,
  props: { show: Boolean },
  emits: ['close'],
  data() {
    return {
      local: { ...(PTStore.data?.config || { deepseekKey:'', userName:'Utilizador' }) },
      syncEmail: '', syncPassword: '', syncApiUrl: SyncManager ? SyncManager.getApiUrl() : '',
      syncMsg: '', syncMsgType: '',
    }
  },
  computed: {
    syncLoggedIn() { return SyncManager && SyncManager.isLoggedIn() },
    syncUser() { return SyncManager && SyncManager.getUser() },
  },
  methods: {
    guardar() {
      PTStore.updateConfig(this.local)
      this.$emit('close')
    },
    async doLogin() {
      this.syncMsg = ''
      if (!this.syncEmail||!this.syncPassword) { this.syncMsg='Campos obrigatórios'; this.syncMsgType='erro'; return }
      try {
        if (this.syncApiUrl) SyncManager.setApiUrl(this.syncApiUrl)
        await SyncManager.login(this.syncEmail, this.syncPassword)
        this.syncMsg = 'Login OK!'; this.syncMsgType = 'ok'
        this.syncPassword = ''
        await SyncManager.pullAll()
        this.syncMsg = 'Dados sincronizados!'
      } catch(e) { this.syncMsg = e.message; this.syncMsgType = 'erro' }
    },
    async doRegister() {
      this.syncMsg = ''
      if (!this.syncEmail||!this.syncPassword) { this.syncMsg='Campos obrigatórios'; this.syncMsgType='erro'; return }
      try {
        if (this.syncApiUrl) SyncManager.setApiUrl(this.syncApiUrl)
        await SyncManager.register(this.syncEmail, this.syncPassword)
        this.syncMsg = 'Conta criada!'; this.syncMsgType = 'ok'
        this.syncPassword = ''
      } catch(e) { this.syncMsg = e.message; this.syncMsgType = 'erro' }
    },
    doLogout() { SyncManager.logout(); this.syncMsg='Sessão terminada.'; this.syncMsgType='ok' },
    async doSync() {
      this.syncMsg = 'A sincronizar...'; this.syncMsgType = ''
      try { await SyncManager.sync(); this.syncMsg='OK!'; this.syncMsgType='ok' }
      catch(e) { this.syncMsg=e.message; this.syncMsgType='erro' }
    },
    resetData() {
      if (confirm('Tem a certeza?')) {
        localStorage.removeItem('PT_LEARNING_DATA')
        location.reload()
      }
    },
  },
  mounted() { this.$nextTick(() => lucide.createIcons()) },
  updated() { this.$nextTick(() => lucide.createIcons()) },
}
