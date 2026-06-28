/**
 * components/AppShell.js — Semedo Vocabulário 主外殼
 * CAPLE Glass 暖色葡式風格
 * Tabs: Praticar | Meu Léxico | Configurações
 */
var AppShell = {
  template: `
    <!-- ═══ LOGIN GATE (CAPLE Glass) ═══ -->
    <div v-if="!loggedIn" class="h-screen h-dvh flex items-center justify-center p-6"
         style="background:radial-gradient(ellipse 80% 60% at 50%40%,rgba(212,168,67,0.10)0%,transparent 60%),linear-gradient(165deg,#e8ddce,#d6dbe3)">
      <div class="glass-strong w-full max-w-sm p-6 text-center" style="border-radius:24px">
        <div class="w-16 h-16 mx-auto mb-3 rounded-[18px] bg-azulejo/10 flex items-center justify-center">
          <i data-lucide="book-open" class="w-8 h-8 text-azulejo"></i>
        </div>
        <h2 class="text-xl font-bold text-slate-800 mb-1">Semedo</h2>
        <p class="text-xs text-slate-400 mb-6">Inicie sessão para sincronizar o seu progresso</p>

        <input type="email" v-model="loginEmail" placeholder="Email"
               class="glass-input w-full px-4 py-3 text-sm mb-3" style="border-radius:14px;min-height:50px"
               @keydown.enter="doLogin">
        <input type="password" v-model="loginPassword" placeholder="Password"
               class="glass-input w-full px-4 py-3 text-sm mb-4" style="border-radius:14px;min-height:50px"
               @keydown.enter="doLogin">

        <div class="flex gap-2.5 mb-2">
          <button @click="doLogin" :disabled="loginLoading"
                  class="btn-primary flex-1 py-3 text-sm font-semibold" style="border-radius:14px;min-height:50px">
            {{ loginLoading ? 'A entrar…' : 'Entrar' }}
          </button>
          <button @click="doRegister" :disabled="loginLoading"
                  class="btn-glass flex-1 py-3 text-sm font-semibold" style="border-radius:14px;min-height:50px">
            Registar
          </button>
        </div>

        <p v-if="loginMsg" class="text-xs mt-2" :class="loginMsgType==='erro'?'text-erro':'text-certo'">{{ loginMsg }}</p>
        <p class="text-[10px] text-slate-400 mt-4">Os dados ficam guardados e sincronizados na nuvem.</p>
      </div>
    </div>

    <!-- ═══ MAIN APP (CAPLE Glass) ═══ -->
    <div v-else class="flex flex-col h-screen h-dvh overflow-hidden"
         style="background:radial-gradient(ellipse 80% 60% at 10% 85%, rgba(212,168,67,0.10) 0%, transparent 60%),radial-gradient(ellipse 60% 50% at 90% 20%, rgba(26,123,181,0.06) 0%, transparent 60%),linear-gradient(165deg, #e8ddce, #d6dbe3, #cdd6e0)">

      <!-- Header -->
      <header class="h-12 flex items-center justify-between px-4 shrink-0 glass-base"
              style="background:rgba(255,255,255,0.65);-webkit-backdrop-filter:blur(28px) saturate(1.15);backdrop-filter:blur(28px) saturate(1.15);border-bottom:0.5px solid rgba(255,255,255,0.6);padding-top:var(--safe-top)">
        <div class="flex items-center gap-2.5">
          <span class="text-sm font-bold text-slate-700">Semedo</span>
          <div class="flex items-center gap-1 cursor-default" :title="syncTooltip">
            <span :class="['inline-block w-1.5 h-1.5 rounded-full transition-colors',
              syncStatus==='syncing'?'bg-amber-400 anim-pulse-soft':syncStatus==='ok'?'bg-certo':'bg-slate-300']"></span>
            <span class="text-[9px] text-slate-400 font-medium hidden sm:inline">{{ syncLabel }}</span>
          </div>
        </div>
        <StudyStats />
      </header>

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto">
        <component :is="currentComponent" :key="currentView" />
      </main>

      <!-- Bottom nav -->
      <nav class="nav-glass shrink-0 pb-safe" style="padding-bottom:calc(var(--safe-bottom) + 2px)">
        <div class="flex items-center justify-around h-14">
          <button v-for="tab in tabs" :key="tab.id" @click="currentView=tab.id"
                  class="nav-tab flex flex-col items-center justify-center flex-1 h-full gap-0.5"
                  :class="currentView===tab.id ? 'active' : ''">
            <div v-if="currentView===tab.id" class="nav-pill"></div>
            <i :data-lucide="tab.icon" class="w-[22px] h-[22px]"></i>
            <span class="text-[9px] font-medium tracking-[0.02em]">{{ tab.label }}</span>
          </button>
        </div>
      </nav>

      <ConfigModal :visible="showConfig" @close="showConfig=false" />
    </div>
  `,

  data() {
    return {
      currentView: 'praticar',
      showConfig: false,
      syncStatus: 'idle', syncLabel: '', syncTooltip: '',
      loggedIn: false,
      loginEmail: '', loginPassword: '', loginMsg: '', loginMsgType: '', loginLoading: false,
    }
  },

  computed: {
    currentComponent() {
      return { praticar:'VocabView', 'meu-lexico':'MeuLexicoView' }[this.currentView] || 'VocabView'
    },
    tabs() {
      return [
        { id:'praticar',     icon:'book-open',     label:'Praticar' },
        { id:'meu-lexico',   icon:'book-marked',   label:'Meu Léxico' },
        { id:'config',       icon:'settings',      label:'Config' },
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
      if(!SyncManager||!SyncManager.isLoggedIn()){this.syncStatus='idle';this.syncLabel='';this.syncTooltip='';return}
      const ls=localStorage.getItem('SEMEDO_LAST_SYNC')
      if(ls){
        const ago=Math.floor((Date.now()-parseInt(ls))/60000)
        this.syncStatus=ago<5?'ok':'idle'
        this.syncLabel=ago<1?'agora':ago+'m'
        this.syncTooltip='Última sincronização: '+(ago<1?'agora mesmo':'há '+ago+' min')
      }else{
        this.syncStatus='idle'
        this.syncLabel='—'
        this.syncTooltip='Clique em Config para sincronizar'
      }
    },
  },

  watch: {
    currentView(viewId) {
      if (viewId === 'config') {
        this.$nextTick(() => { this.showConfig = true })
        const prev = this._prevView || 'praticar'
        this.currentView = prev
      } else {
        this._prevView = viewId
      }
    }
  },

  mounted() {
    this._prevView = 'praticar'
    this.loggedIn = typeof SyncManager !== 'undefined' && SyncManager.isLoggedIn && SyncManager.isLoggedIn()
    this.updateSyncStatus()
    // Check if there's a recent sync from a practice end or other source
    const lastSync = localStorage.getItem('SEMEDO_LAST_SYNC')
    if (lastSync && this.loggedIn) {
      const ago = Math.floor((Date.now() - parseInt(lastSync)) / 60000)
      this.syncStatus = ago < 5 ? 'ok' : 'idle'
      this.syncLabel = ago < 1 ? 'agora' : ago + 'm'
    }
    setInterval(()=>this.updateSyncStatus(),30000)

    if(SyncManager){
      const o=SyncManager.sync.bind(SyncManager)
      SyncManager.sync=async()=>{
        this.syncStatus='syncing';this.syncLabel='…';this.syncTooltip='A sincronizar…'
        try{await o();this.syncStatus='ok';this.syncLabel='OK';localStorage.setItem('SEMEDO_LAST_SYNC',String(Date.now()));this.syncTooltip='Sincronizado!'}
        catch(e){this.syncStatus='idle';this.syncLabel='!';throw e}
      }
    }

    this.$nextTick(()=>{
      if(typeof lucide!=='undefined'&&lucide.createIcons)lucide.createIcons()
    })
  },

  updated() {
    this.$nextTick(()=>{
      if(typeof lucide!=='undefined'&&lucide.createIcons)lucide.createIcons()
    })
  },
}

if (typeof window !== 'undefined') window.AppShell = AppShell
