/**
 * components/AppShell.js — Semedo Móvel 主外殼 + 登錄閘門
 */
var AppShell = {
  template: `
    <!-- ═══ LOGIN GATE ═══ -->
    <div v-if="!loggedIn" class="h-screen h-dvh flex items-center justify-center p-6"
         style="background:radial-gradient(ellipse 80% 60% at 50%40%,rgba(212,168,67,0.10)0%,transparent 60%),linear-gradient(165deg,#e8ddce,#d6dbe3)">
      <div class="glass-card-strong w-full max-w-sm p-6 text-center anim-fade-up" style="border-radius:16px">
        <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-azulejo/10 flex items-center justify-center">
          <i data-lucide="book-open" class="w-7 h-7 text-azulejo"></i>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-1">Semedo Móvel</h2>
        <p class="text-xs text-slate-400 mb-5">Inicie sessão para sincronizar o seu progresso</p>

        <input type="email" v-model="loginEmail" placeholder="Email"
               class="w-full px-3 py-2.5 glass-input text-sm mb-2.5" style="border-radius:12px">
        <input type="password" v-model="loginPassword" placeholder="Password"
               class="w-full px-3 py-2.5 glass-input text-sm mb-3" style="border-radius:12px"
               @keydown.enter="doLogin">

        <div class="flex gap-2 mb-2">
          <button @click="doLogin" :disabled="loginLoading"
                  class="flex-1 py-2.5 btn-primary text-sm font-medium disabled:opacity-50">
            {{ loginLoading ? 'A entrar…' : 'Entrar' }}
          </button>
          <button @click="doRegister" :disabled="loginLoading"
                  class="flex-1 py-2.5 btn-glass text-slate-600 text-sm font-medium disabled:opacity-50">
            Registar
          </button>
        </div>

        <p v-if="loginMsg" class="text-xs mt-2" :class="loginMsgType==='erro'?'text-erro':'text-certo'">{{ loginMsg }}</p>
      </div>
    </div>

    <!-- ═══ MAIN APP ═══ -->
    <div v-else class="flex flex-col h-screen h-dvh overflow-hidden">
      <header class="h-12 flex items-center justify-between px-4 shrink-0 glass-base"
              style="padding-top:var(--safe-top)">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-slate-800">Semedo</span>
          <span :class="['inline-block w-1.5 h-1.5 rounded-full transition-colors',
            syncStatus==='syncing'?'bg-amber-400 anim-pulse':syncStatus==='ok'?'bg-certo':'bg-slate-300']"></span>
        </div>
        <StudyStats />
      </header>

      <main class="flex-1 overflow-y-auto px-4 pt-3 pb-2">
        <component :is="currentComponent" :key="currentView" />
      </main>

      <nav class="nav-glass shrink-0 pb-safe" style="padding-bottom:calc(var(--safe-bottom) + 4px)">
        <div class="flex items-center justify-around h-14">
          <button v-for="tab in tabs" :key="tab.id" @click="currentView=tab.id"
                  class="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
                  :class="currentView===tab.id?'nav-active':'text-slate-400'">
            <i :data-lucide="tab.icon" class="w-5 h-5"></i>
            <span class="text-[9px] font-medium">{{ tab.label }}</span>
            <div v-if="currentView===tab.id" class="nav-indicator"></div>
          </button>
          <button @click="showConfig=true"
                  class="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-slate-400">
            <i data-lucide="settings" class="w-5 h-5"></i>
            <span class="text-[9px] font-medium">Config</span>
          </button>
        </div>
      </nav>

      <ConfigModal :show="showConfig" @close="showConfig=false" />
    </div>
  `,
  data() {
    return {
      currentView: 'praticar', showConfig: false, syncStatus: 'idle',
      loggedIn: false,
      loginEmail: '', loginPassword: '', loginMsg: '', loginMsgType: '', loginLoading: false,
    }
  },
  computed: {
    currentComponent() {
      return { praticar:'VocabView','meu-lexico':'MeuLexicoView', erros:'ErrosView' }[this.currentView] || 'VocabView'
    },
    tabs() {
      return [
        { id:'praticar', icon:'book-open', label:'Praticar' },
        { id:'meu-lexico', icon:'book-marked', label:'Meu Léxico' },
        { id:'erros', icon:'alert-triangle', label:'Erros' },
      ]
    },
  },
  methods: {
    async doLogin() {
      if(!this.loginEmail||!this.loginPassword){this.loginMsg='Preencha email e password';this.loginMsgType='erro';return}
      this.loginLoading=true;this.loginMsg=''
      try{await SyncManager.login(this.loginEmail,this.loginPassword);this.loggedIn=true;this.loginPassword=''}
      catch(e){this.loginMsg=e.message;this.loginMsgType='erro';this.loginLoading=false}
    },
    async doRegister() {
      if(!this.loginEmail||!this.loginPassword){this.loginMsg='Preencha email e password';this.loginMsgType='erro';return}
      this.loginLoading=true;this.loginMsg=''
      try{await SyncManager.register(this.loginEmail,this.loginPassword);this.loggedIn=true;this.loginPassword=''}
      catch(e){this.loginMsg=e.message;this.loginMsgType='erro';this.loginLoading=false}
    },
    updateSyncStatus() {
      if(!SyncManager||!SyncManager.isLoggedIn()){this.syncStatus='idle';return}
      const ls=localStorage.getItem('SEMEDO_LAST_SYNC')
      this.syncStatus=ls&&(Date.now()-parseInt(ls))<300000?'ok':'idle'
    },
  },
  mounted() {
    this.loggedIn = typeof SyncManager !== 'undefined' && SyncManager.isLoggedIn && SyncManager.isLoggedIn()
    this.updateSyncStatus()
    setInterval(()=>this.updateSyncStatus(),30000)
    if(SyncManager){const o=SyncManager.sync.bind(SyncManager);SyncManager.sync=async()=>{this.syncStatus='syncing';try{await o();this.syncStatus='ok';localStorage.setItem('SEMEDO_LAST_SYNC',String(Date.now()))}catch(e){this.syncStatus='idle';throw e}}}
    this.$nextTick(()=>lucide.createIcons())
  },
  updated() { this.$nextTick(()=>lucide.createIcons()) },
}
