/**
 * components/MeuLexicoView.js — 我的詞庫（手機版）
 */
const MeuLexicoView = {
  template: `
    <div class="anim-fade-up pb-4">
      <div class="glass-card p-3.5">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="text-sm font-bold text-slate-700">Palavras memorizadas</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ filteredList.length }} palavra{{ filteredList.length!==1?'s':'' }}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button @click="startRound" :disabled="filteredList.length===0"
                    class="py-2 px-3 btn-primary text-xs font-medium flex items-center gap-1 disabled:opacity-40">
              <i data-lucide="play" class="w-3 h-3"></i>Ronda
            </button>
            <div class="flex glass-panel rounded-lg p-0.5">
              <button @click="mode='zh2pt'" :class="mode==='zh2pt'?'glass-card text-azulejo shadow-sm':'text-slate-400'"
                      class="px-2 py-1 text-[10px] font-medium rounded-md transition">CN→PT</button>
              <button @click="mode='pt2zh'" :class="mode==='pt2zh'?'glass-card text-azulejo shadow-sm':'text-slate-400'"
                      class="px-2 py-1 text-[10px] font-medium rounded-md transition">PT→CN</button>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="relative mb-3">
          <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"></i>
          <input type="text" v-model="query" placeholder="Pesquisar…"
                 class="w-full pl-8 pr-3 py-2 glass-input text-xs">
        </div>

        <!-- List -->
        <div v-if="filteredList.length > 0" class="space-y-1 max-h-[60vh] overflow-y-auto">
          <div v-for="(w,i) in filteredList" :key="w.pt+i"
               class="flex items-center justify-between p-2.5 rounded-lg glass-panel">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ w.pt }}</p>
              <p class="text-xs text-slate-500 truncate">{{ w.zh }}<span v-if="w.pos" class="ml-1 text-[10px] text-slate-400">({{ w.pos }})</span></p>
            </div>
            <button @click="removeWord(w)" class="ml-2 p-1.5 text-slate-300 hover:text-erro">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
        <div v-else class="text-center py-10">
          <i data-lucide="book-open" class="w-8 h-8 mx-auto text-slate-200 mb-2"></i>
          <p class="text-sm text-slate-500">{{ query ? 'Sem resultados' : 'Nenhuma palavra memorizada' }}</p>
          <p v-if="!query" class="text-xs text-slate-400 mt-1">Pratique no separador "Praticar" para adicionar palavras.</p>
        </div>
      </div>
    </div>
  `,
  data() {
    return { mode: 'zh2pt', query: '' }
  },
  computed: {
    list() { return PTStore.getMyVocabForDirection(this.mode) },
    filteredList() {
      if (!this.query) return this.list
      const q = this.query.toLowerCase()
      return this.list.filter(w => w.pt.toLowerCase().includes(q) || (w.zh||'').toLowerCase().includes(q))
    },
    allWords() {
      const s = new Set()
      PTStore.getMyVocabForDirection('zh2pt').forEach(v => s.add(v.pt.toLowerCase()))
      PTStore.getMyVocabForDirection('pt2zh').forEach(v => s.add(v.pt.toLowerCase()))
      return s.size
    },
  },
  methods: {
    removeWord(w) { PTStore.removeFromMyVocab(w.pt, this.mode); this.$nextTick(() => lucide.createIcons()) },
    startRound() {
      const words = this.filteredList
      if (!words.length) return
      PTStore.logActivity()
      const data = { words:[...words.sort(()=>Math.random()-0.5)], mode:this.mode, source:'meu-lexico', timestamp:Date.now() }
      localStorage.setItem('LEXICO_CURRENT_ROUND', JSON.stringify(data))
      window.open('lexico_exam.html', '_blank')
    },
  },
  mounted() { this.$nextTick(() => lucide.createIcons()) },
  updated() { this.$nextTick(() => lucide.createIcons()) },
}
