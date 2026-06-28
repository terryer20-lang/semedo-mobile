/**
 * components/VocabView.js — 背單詞核心視圖（手機版）
 */
const VocabView = {
  template: `
    <div class="anim-fade-up pb-4">

      <!-- ═══ IDLE ═══ -->
      <template v-if="!flowActive && !roundComplete">

        <!-- CEFR Level Selector -->
        <div class="glass-card p-3.5 mb-3">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-medium text-slate-500">Nível</label>
            <div class="flex glass-panel rounded-lg p-0.5">
              <button @click="mode='zh2pt'" :class="mode==='zh2pt'?'glass-card text-azulejo shadow-sm':'text-slate-400'"
                      class="px-2.5 py-1 text-[10px] font-medium rounded-md transition">CN→PT</button>
              <button @click="mode='pt2zh'" :class="mode==='pt2zh'?'glass-card text-azulejo shadow-sm':'text-slate-400'"
                      class="px-2.5 py-1 text-[10px] font-medium rounded-md transition">PT→CN</button>
            </div>
          </div>
          <div class="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5" style="-webkit-overflow-scrolling:touch">
            <button v-for="lv in levels" :key="lv.id" @click="selectedLevel=lv.id"
                    :class="['shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition border',
                      selectedLevel===lv.id
                        ? lv.id==='A1'?'bg-emerald-50 border-emerald-400 text-emerald-700'
                          :lv.id==='A2'?'bg-teal-50 border-teal-400 text-teal-700'
                          :lv.id==='B1'?'bg-sky-50 border-sky-400 text-sky-700'
                          :lv.id==='B2'?'bg-indigo-50 border-indigo-400 text-indigo-700'
                          :lv.id==='C1'?'bg-violet-50 border-violet-400 text-violet-700'
                          :lv.id==='C2'?'bg-rose-50 border-rose-400 text-rose-700'
                          : 'bg-amber-50 border-amber-400 text-amber-700'
                        : 'btn-glass text-slate-500'
                    ]">
              <span class="font-bold">{{ lv.id }}</span>
              <span class="text-[9px] opacity-70 ml-0.5">({{ lv.count }}/{{ lv.total }})</span>
            </button>
          </div>
        </div>

        <!-- Start -->
        <div v-if="selectedLevel" class="glass-card-strong p-5 text-center">
          <i data-lucide="book-open" class="w-8 h-8 mx-auto text-slate-200 mb-2"></i>
          <p class="text-sm text-slate-600 font-medium mb-1">{{ poolSize > 0 ? 'Pronto para praticar' : 'Sem palavras' }}</p>
          <p v-if="poolSize > 0" class="text-xs text-slate-400 mb-3">{{ poolSize }} palavras disponíveis</p>

          <!-- Round size -->
          <div class="flex justify-center gap-1.5 mb-3">
            <button v-for="n in [10,20,30]" :key="n" @click="roundSize=n"
                    :class="['px-3 py-1.5 rounded text-xs font-medium transition border',
                      roundSize===n ? 'btn-primary' : 'btn-glass text-slate-500']">{{ n }}</button>
            <button @click="roundSize=-1"
                    :class="['px-3 py-1.5 rounded text-xs font-medium transition border',
                      roundSize===-1 ? 'bg-rose-500 text-white' : 'btn-glass text-slate-500']">∞</button>
          </div>

          <button v-if="poolSize>0" @click="startRound"
                  class="w-full py-3 btn-primary text-sm font-medium flex items-center justify-center gap-1.5">
            <i data-lucide="play" class="w-4 h-4"></i>Iniciar Ronda
          </button>
        </div>

        <!-- Upload CSV -->
        <div class="mt-3">
          <button @click="showUpload=true"
                  class="w-full py-2.5 btn-glass text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <i data-lucide="upload" class="w-3.5 h-3.5"></i>Upload CSV
          </button>
        </div>
      </template>

      <!-- ═══ PRACTICE FLOW ═══ -->
      <template v-if="flowActive">
        <div class="glass-card-strong p-5 text-center anim-fade-up">
          <p class="text-xs text-slate-400 mb-3">{{ currentIdx+1 }} / {{ roundWords.length }}</p>

          <!-- Word display -->
          <div v-if="currentWord" class="mb-4">
            <p v-if="mode==='pt2zh'" class="text-xl font-bold text-slate-800">{{ currentWord.pt }}</p>
            <p v-else class="text-xl font-bold text-slate-800">{{ currentWord.zh }}</p>
            <p class="text-xs text-slate-400 mt-1" v-if="mode==='pt2zh'">{{ currentWord.pos }}</p>
          </div>

          <!-- Input -->
          <input type="text" v-model="userInput" ref="inputRef"
                 :placeholder="mode==='pt2zh'?'Tradução em chinês…':'Tradução em português…'"
                 class="w-full px-3 py-2.5 glass-input text-sm text-center mb-3"
                 @keydown.enter="checkAnswer"
                 :disabled="!!feedback">

          <!-- Feedback -->
          <div v-if="feedback" class="mb-3 anim-pop">
            <p :class="feedback.correct ? 'text-certo font-medium text-sm' : 'text-erro font-medium text-sm'">
              {{ feedback.correct ? '✓ Correto!' : '✗ ' + (mode==='pt2zh' ? currentWord.zh : currentWord.pt) }}
            </p>
          </div>

          <div class="flex gap-2">
            <button v-if="!feedback" @click="checkAnswer" class="flex-1 py-2.5 btn-primary text-sm font-medium">Verificar</button>
            <button v-if="feedback" @click="nextWord" class="flex-1 py-2.5 btn-primary text-sm font-medium">
              {{ currentIdx < roundWords.length-1 ? 'Seguinte →' : 'Ver resultados' }}
            </button>
          </div>
        </div>
      </template>

      <!-- ═══ RESULTS ═══ -->
      <template v-if="roundComplete">
        <div class="glass-card-strong p-5 text-center anim-fade-up">
          <i data-lucide="check-circle" class="w-10 h-10 mx-auto text-certo mb-2"></i>
          <p class="text-base font-bold text-slate-800 mb-1">Ronda completa!</p>
          <p class="text-sm text-slate-500 mb-3">{{ results.filter(r=>r.correct).length }}/{{ results.length }} acertos</p>
          <div class="text-xs text-slate-400 space-y-1 mb-4 max-h-40 overflow-y-auto text-left">
            <div v-for="(r,i) in results" :key="i"
                 class="flex justify-between py-1 px-2 rounded" :class="r.correct?'bg-emerald-50':'bg-rose-50'">
              <span>{{ r.pt }} <span class="text-slate-400">—</span> {{ r.zh }}</span>
              <span :class="r.correct?'text-certo':'text-erro'">{{ r.correct ? '✓' : '✗' }}</span>
            </div>
          </div>
          <button @click="resetRound" class="w-full py-2.5 btn-primary text-sm font-medium">Nova Ronda</button>
        </div>
      </template>

      <!-- ═══ UPLOAD MODAL ═══ -->
      <transition name="fade">
        <div v-if="showUpload" class="fixed inset-0 z-50 flex items-end justify-center p-4"
             style="background:rgba(0,0,0,0.15);backdrop-filter:blur(8px)"
             @click.self="showUpload=false">
          <div class="glass-card-strong w-full max-w-md p-5" @click.stop style="border-radius:16px">
            <h3 class="text-base font-bold text-slate-800 mb-3">Upload CSV</h3>
            <div @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="onDrop"
                 @click="$refs.fileInput.click()"
                 :class="['border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition mb-3',
                   dragOver ? 'border-azulejo bg-azulejo/5' : 'border-slate-200']">
              <input ref="fileInput" type="file" accept=".csv" @change="onFileChange" class="hidden">
              <i data-lucide="file-text" class="w-6 h-6 mx-auto mb-1" :class="fileName?'text-azulejo':'text-slate-300'"></i>
              <p class="text-xs text-slate-500">{{ fileName || 'Toque para escolher ficheiro' }}</p>
              <p v-if="parsedCount>0" class="text-[10px] text-slate-400">{{ parsedCount }} palavras</p>
            </div>
            <div class="flex gap-2 mb-3">
              <select v-model="uploadLevel" class="flex-1 px-3 py-2 glass-input text-xs">
                <option value="">Nível</option>
                <option v-for="lv in ['A1','A2','B1','B2','C1','C2']" :key="lv" :value="lv">{{ lv }}</option>
              </select>
              <input type="text" v-model="uploadLabel" class="flex-1 px-3 py-2 glass-input text-xs" placeholder="Coleção">
            </div>
            <button @click="confirmUpload" :disabled="parsedData.length===0"
                    class="w-full py-2.5 btn-primary text-sm font-medium disabled:opacity-40">Confirmar</button>
          </div>
        </div>
      </transition>
    </div>
  `,

  data() {
    return {
      mode: 'zh2pt',
      selectedLevel: null,
      roundSize: 10,
      roundWords: [],
      currentIdx: 0,
      userInput: '',
      feedback: null,
      flowActive: false,
      roundComplete: false,
      results: [],
      showUpload: false, dragOver: false,
      fileName: '', parsedData: [], parsedCount: 0, parseError: '',
      uploadLevel: '', uploadLabel: '',
      dictEntries: [],
    }
  },
  computed: {
    levels() {
      const counts = {}
      for (const e of this.dictEntries) {
        const lv = e.lv || '—'
        counts[lv] = (counts[lv] || 0) + 1
      }
      const myPts = new Set(PTStore.getMyVocabForDirection(this.mode).map(v => v.pt.toLowerCase()))
      const myCounts = {}
      for (const e of this.dictEntries) {
        const lv = e.lv || '—'
        if (myPts.has(e.pt.toLowerCase())) myCounts[lv] = (myCounts[lv] || 0) + 1
      }
      return ['A1','A2','B1','B2','C1','C2'].map(id => ({
        id, count: (counts[id]||0) - (myCounts[id]||0), total: counts[id]||0,
      })).filter(l => l.total > 0)
    },
    poolSize() {
      if (!this.selectedLevel) return 0
      const myPts = new Set(PTStore.getMyVocabForDirection(this.mode).map(v => v.pt.toLowerCase()))
      return this.dictEntries.filter(e => (e.lv||'—')===this.selectedLevel && !myPts.has(e.pt.toLowerCase())).length
    },
    currentWord() { return this.currentIdx < this.roundWords.length ? this.roundWords[this.currentIdx] : null },
  },
  methods: {
    loadDict() {
      const KEY = 'UPLOADED_VOCAB_DATA'
      try {
        const raw = localStorage.getItem(KEY)
        if (raw) this.dictEntries = JSON.parse(raw)
        else this.dictEntries = []
      } catch { this.dictEntries = [] }
    },
    startRound() {
      if (!this.selectedLevel) return
      PTStore.logActivity()
      const pool = this.dictEntries.filter(e => (e.lv||'—')===this.selectedLevel)
      if (!pool.length) return
      const count = this.roundSize === -1 ? pool.length : Math.min(this.roundSize, pool.length)
      const copy = [...pool.sort(() => Math.random()-0.5)]
      this.roundWords = copy.slice(0, count)
      this.currentIdx = 0
      this.userInput = ''
      this.feedback = null
      this.results = []
      this.flowActive = true
      this.roundComplete = false
      this.$nextTick(() => { if (this.$refs.inputRef) this.$refs.inputRef.focus() })
    },
    checkAnswer() {
      if (!this.currentWord || !this.userInput.trim()) return
      const w = this.currentWord
      const answer = this.userInput.trim()
      const expected = this.mode === 'pt2zh' ? w.zh : w.pt
      const correct = answer.toLowerCase() === expected.toLowerCase()
      this.feedback = { correct }
      this.results.push({ pt: w.pt, zh: w.zh, correct })
      if (correct) {
        PTStore.addToMyVocab(w.pt, w.zh, w.pos || '', this.mode)
      } else {
        PTStore.logWrongWord(w.pt, w.zh, w.pos || '', this.mode)
      }
    },
    nextWord() {
      if (this.currentIdx < this.roundWords.length - 1) {
        this.currentIdx++
        this.userInput = ''
        this.feedback = null
        this.$nextTick(() => { if (this.$refs.inputRef) this.$refs.inputRef.focus() })
      } else {
        this.flowActive = false
        this.roundComplete = true
      }
    },
    resetRound() {
      this.flowActive = false
      this.roundComplete = false
      this.roundWords = []
      this.currentIdx = 0
      this.userInput = ''
      this.feedback = null
      this.results = []
    },
    onDrop(e) { this.dragOver=false; const f=e.dataTransfer?.files?.[0]; if(f) this._readCSV(f) },
    onFileChange(e) { const f=e.target?.files?.[0]; if(f) this._readCSV(f) },
    _readCSV(file) {
      if (!file.name.endsWith('.csv')) return
      this.fileName = file.name
      const r = new FileReader()
      r.onload = (e) => {
        const lines = e.target.result.split(/\r?\n/).filter(l => l.trim())
        this.parsedData = []
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(';')
          if (parts.length >= 2 && parts[0].trim() && parts[1].trim())
            this.parsedData.push({ pt: parts[0].trim(), zh: parts[1].trim(), pos: parts[2]?.trim()||'' })
        }
        this.parsedCount = this.parsedData.length
      }
      r.readAsText(file, 'UTF-8')
    },
    confirmUpload() {
      if (!this.parsedData.length) return
      const lv = this.uploadLevel || this.uploadLabel || '—'
      const entries = this.parsedData.map(d => ({ ...d, lv, label: this.uploadLabel || lv }))
      const KEY = 'UPLOADED_VOCAB_DATA'
      let existing = []
      try { const r=localStorage.getItem(KEY); if(r) existing=JSON.parse(r) } catch {}
      existing.push(...entries)
      localStorage.setItem(KEY, JSON.stringify(existing))
      this.loadDict()
      this.showUpload = false
      this.fileName = ''
      this.parsedData = []
      this.parsedCount = 0
    },
  },
  mounted() {
    this.loadDict()
    this.$nextTick(() => lucide.createIcons())
  },
  updated() { this.$nextTick(() => lucide.createIcons()) },
}
