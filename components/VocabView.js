/**
 * components/VocabView.js — Vocabulário (Main Practice View)
 * Mobile-optimized: CEFR level selector, practice rounds, flashcard interaction, CSV upload
 *
 * IIFE global Vue component object. Uses Vue 3 Options API.
 * Dependencies: PTStore (store/storage.js), Diacritics (utils/diacritics.js),
 *   DICT_VOCAB_DATA (data/dict_vocab_data.js, global), localStorage 'UPLOADED_VOCAB_DATA'
 */
var VocabView = {
  name: 'VocabView',
  template: `
    <div class="vocab-view px-4 pt-2 pb-24 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 anim-enter">
        <h2 class="text-lg font-semibold text-[#1a1a2e]">Vocabulário</h2>
        <button @click="showUpload = true" class="btn-glass flex items-center gap-1.5 px-3 py-2 text-sm font-medium" style="min-height:44px">
          <i data-lucide="upload" class="w-4 h-4"></i>
          <span>CSV</span>
        </button>
      </div>

      <!-- CEFR Level Selector — Horizontal Scroll -->
      <div class="mb-3 anim-enter" style="animation-delay:0.03s">
        <label class="text-xs font-medium text-[#4a4a5e] mb-1.5 block">Nível CEFR</label>
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar scrollable-x">
          <button v-for="lvl in cefrLevels" :key="lvl"
            @click="selectedLevel = lvl"
            class="flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-150"
            :class="selectedLevel === lvl ? 'bg-[#1a7bb5] text-white shadow-md' : 'bg-white/60 text-[#4a4a5e] border border-white/40'"
            style="min-height:44px;min-width:52px">
            {{ lvl }}
          </button>
        </div>
      </div>

      <!-- Direction Toggle -->
      <div class="glass-card p-3 mb-3 anim-enter" style="animation-delay:0.06s">
        <div class="flex items-center justify-center gap-4">
          <span class="text-sm font-medium transition-colors duration-200" :class="direction === 'cn2pt' ? 'text-[#1a7bb5] font-semibold' : 'text-[#4a4a5e]'">CN → PT</span>
          <button @click="toggleDirection" class="relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none"
            :class="direction === 'pt2cn' ? 'bg-[#1a7bb5]' : 'bg-gray-300'" style="min-height:44px;min-width:56px"
            role="switch" :aria-checked="direction === 'pt2cn'">
            <span class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200"
              :class="direction === 'pt2cn' ? 'translate-x-6' : ''"></span>
          </button>
          <span class="text-sm font-medium transition-colors duration-200" :class="direction === 'pt2cn' ? 'text-[#1a7bb5] font-semibold' : 'text-[#4a4a5e]'">PT → CN</span>
        </div>
      </div>

      <!-- Practice Round Setup -->
      <div class="glass-card-strong p-4 mb-4 anim-enter" style="animation-delay:0.09s">
        <label class="text-xs font-medium text-[#4a4a5e] mb-2 block">Quantidade</label>
        <div class="flex gap-2 mb-3">
          <button v-for="opt in countOptions" :key="opt.value"
            @click="selectedCount = opt.value"
            class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            :class="selectedCount === opt.value ? 'bg-[#1a7bb5] text-white shadow-md' : 'bg-white/60 text-[#4a4a5e] border border-white/40'"
            style="min-height:44px">
            {{ opt.label }}
          </button>
        </div>
        <button @click="startRound" :disabled="!hasWords"
          class="btn-primary w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
          style="min-height:50px">
          <i data-lucide="play" class="w-5 h-5"></i>
          Iniciar Ronda
        </button>
        <p v-if="!hasWords" class="text-xs text-center text-[#8a8a9e] mt-2">
          Nenhuma palavra disponível para este nível
        </p>
      </div>

      <!-- Stats Summary -->
      <div class="glass-card p-3 mb-4 anim-enter" style="animation-delay:0.12s">
        <div class="flex justify-between items-center text-sm">
          <span class="text-[#4a4a5e]">Palavras disponíveis:</span>
          <span class="font-semibold text-[#1a1a2e]">{{ filteredWords.length }}</span>
        </div>
        <div class="flex justify-between items-center text-sm mt-1.5">
          <span class="text-[#4a4a5e]">No meu léxico:</span>
          <span class="font-semibold text-[#1a1a2e]">{{ PTStore.getMyVocabCount() }}</span>
        </div>
      </div>

      <!-- ─── PRACTICE POPUP (Bottom Sheet) ─── -->
      <Teleport to="body">
        <div v-if="practiceActive" class="fixed inset-0 z-50 flex flex-col justify-end" @click.self="cancelPractice">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="cancelPractice"></div>
          <!-- Sheet -->
          <div class="relative w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-xl overflow-hidden animate-slide-up"
            style="max-height:90vh;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">
            
            <!-- Drag Handle -->
            <div class="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div class="w-10 h-1 rounded-full bg-gray-300"></div>
            </div>

            <!-- Progress Bar -->
            <div v-if="!roundCompleted && roundWords.length > 0" class="px-5 pb-2">
              <div class="flex justify-between items-center text-xs text-[#4a4a5e] mb-1">
                <span class="font-medium">{{ currentIndex + 1 }} / {{ roundWords.length }}</span>
                <span class="text-[#2d6a4f]">{{ correctInRound }} ✅</span>
              </div>
              <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full bg-[#1a7bb5] rounded-full transition-all duration-300 ease-out"
                  :style="{ width: roundWords.length > 0 ? ((currentIndex + 1) / roundWords.length * 100) + '%' : '0%' }"></div>
              </div>
            </div>

            <!-- Scrollable Content -->
            <div class="px-5 py-4 overflow-y-auto" style="max-height:calc(90vh - 160px)">
              <!-- ═══ ROUND COMPLETED ═══ -->
              <div v-if="roundCompleted" class="text-center py-2">
                <div class="text-5xl mb-3 anim-pop">{{ resultsEmoji }}</div>
                <h3 class="text-lg font-bold text-[#1a1a2e] mb-1">Ronda Completa!</h3>
                <p class="text-xs text-[#8a8a9e] mb-4">{{ roundWords.length }} palavras praticadas</p>

                <div class="glass-card-strong p-4 mb-4">
                  <div class="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div class="text-3xl font-bold text-[#2d6a4f]">{{ results.correct }}</div>
                      <div class="text-xs text-[#4a4a5e] mt-0.5">Correctas</div>
                    </div>
                    <div>
                      <div class="text-3xl font-bold text-[#c1121f]">{{ results.wrong }}</div>
                      <div class="text-xs text-[#4a4a5e] mt-0.5">Erradas</div>
                    </div>
                  </div>
                  <div class="mt-3 pt-3 border-t border-gray-100">
                    <div class="text-lg font-bold" :class="resultsColor">{{ results.percent }}%</div>
                    <div class="text-xs text-[#4a4a5e]">Taxa de acerto</div>
                  </div>
                </div>

                <!-- Wrong Words Review List -->
                <div v-if="results.wrongWords.length > 0" class="mb-4 text-left">
                  <h4 class="text-sm font-medium text-[#4a4a5e] mb-2 flex items-center gap-1">
                    <i data-lucide="alert-circle" class="w-4 h-4 text-[#c1121f]"></i>
                    Palavras para revisar ({{ results.wrongWords.length }})
                  </h4>
                  <div class="glass-card p-2 max-h-40 overflow-y-auto">
                    <div v-for="(w, i) in results.wrongWords" :key="i"
                      class="flex justify-between items-center py-1.5 px-2 border-b border-gray-50 last:border-b-0 text-sm">
                      <span class="font-medium text-[#1a1a2e]">{{ direction === 'cn2pt' ? w.zh : w.pt }}</span>
                      <span class="text-[#8a8a9e] text-xs">→ {{ direction === 'cn2pt' ? w.pt : w.zh }}</span>
                    </div>
                  </div>
                </div>

                <div v-else class="mb-4 glass-card bg-[#2d6a4f]/5 p-3 text-center">
                  <div class="text-sm text-[#2d6a4f] font-medium">🌟 Todas as respostas correctas!</div>
                </div>

                <div class="flex gap-3">
                  <button @click="startRound" class="btn-primary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5" style="min-height:48px">
                    <i data-lucide="rotate-cw" class="w-4 h-4"></i> Nova Ronda
                  </button>
                  <button @click="cancelPractice" class="btn-glass flex-1 py-3 text-sm font-semibold" style="min-height:48px">
                    Fechar
                  </button>
                </div>
              </div>

              <!-- ═══ ACTIVE FLASHCARD ═══ -->
              <div v-else-if="currentWord" class="flashcard-area">
                <!-- Word Display -->
                <div class="text-center mb-6">
                  <div class="text-xs font-medium text-[#8a8a9e] mb-1 flex items-center justify-center gap-2">
                    <span class="bg-white/60 px-2 py-0.5 rounded-full">{{ currentWord.cefr || '—' }}</span>
                    <span class="bg-white/60 px-2 py-0.5 rounded-full">{{ currentWord.pos || '—' }}</span>
                  </div>
                  <div class="text-2xl font-bold text-[#1a1a2e] my-6 py-4 px-2 glass-card-strong inline-block min-w-[60%]">
                    {{ direction === 'cn2pt' ? currentWord.zh : currentWord.pt }}
                  </div>
                  <div class="text-xs text-[#8a8a9e]">
                    {{ direction === 'cn2pt' ? 'Chinês → Português' : 'Português → Chinês' }}
                  </div>
                </div>

                <!-- Answer Input -->
                <div class="mb-3">
                  <input ref="answerInput"
                    v-model="userAnswer"
                    @keyup.enter="checkAnswer"
                    :placeholder="direction === 'cn2pt' ? 'Escreva em português…' : 'Escreva em chinês…'"
                    class="glass-input w-full px-4 py-3 text-base text-center transition-all duration-200"
                    :class="{
                      'border-[#2d6a4f]/50 ring-2 ring-[#2d6a4f]/20 bg-[#2d6a4f]/5': feedbackState === 'correct',
                      'border-[#c1121f]/50 ring-2 ring-[#c1121f]/20 bg-[#c1121f]/5': feedbackState === 'wrong'
                    }"
                    style="min-height:50px;font-size:18px"
                    :disabled="feedbackState !== null"
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
                </div>

                <!-- Feedback Display -->
                <div v-if="feedbackState" class="mb-4 transition-all duration-200">
                  <div v-if="feedbackState === 'correct'" class="glass-card bg-[#2d6a4f]/10 border border-[#2d6a4f]/20 p-3.5 text-center rounded-xl">
                    <div class="text-xl mb-1">✅ Correcto!</div>
                    <div class="text-sm text-[#4a4a5e] font-medium">
                      {{ direction === 'cn2pt' ? currentWord.zh + ' = ' + currentWord.pt : currentWord.pt + ' = ' + currentWord.zh }}
                    </div>
                    <div v-if="feedbackHint" class="text-xs text-[#d4a843] mt-1">{{ feedbackHint }}</div>
                  </div>
                  <div v-else class="glass-card bg-[#c1121f]/10 border border-[#c1121f]/20 p-3.5 text-center rounded-xl">
                    <div class="text-xl mb-1">❌ Errado</div>
                    <div class="text-sm text-[#4a4a5e]">
                      Resposta correcta:
                    </div>
                    <div class="text-base font-bold text-[#1a1a2e] mt-0.5">
                      <strong>{{ direction === 'cn2pt' ? currentWord.pt : currentWord.zh }}</strong>
                    </div>
                    <div v-if="feedbackHint" class="text-xs text-[#d4a843] mt-1">{{ feedbackHint }}</div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3">
                  <button v-if="!feedbackState" @click="checkAnswer" class="btn-primary flex-1 py-3 text-base font-semibold flex items-center justify-center gap-1.5" style="min-height:50px">
                    <i data-lucide="check" class="w-5 h-5"></i> Verificar
                  </button>
                  <button v-if="feedbackState" @click="nextWord" class="btn-primary flex-1 py-3 text-base font-semibold flex items-center justify-center gap-1.5" style="min-height:50px">
                    <i data-lucide="arrow-right" class="w-5 h-5"></i> Seguinte
                  </button>
                  <button @click="cancelPractice" class="btn-glass w-14 flex items-center justify-center" style="min-height:50px;min-width:50px">
                    <i data-lucide="x" class="w-5 h-5"></i>
                  </button>
                </div>
              </div>

              <!-- Fallback -->
              <div v-else class="text-center py-8">
                <p class="text-sm text-[#8a8a9e]">Nenhuma palavra carregada.</p>
                <button @click="cancelPractice" class="btn-primary mt-3 px-6 py-2 text-sm">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ─── UPLOAD CSV BOTTOM SHEET ─── -->
      <Teleport to="body">
        <div v-if="showUpload" class="fixed inset-0 z-50 flex flex-col justify-end" @click.self="showUpload = false">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="showUpload = false"></div>
          <!-- Sheet -->
          <div class="relative w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-xl overflow-hidden"
            style="max-height:85vh;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">
            
            <!-- Handle -->
            <div class="flex justify-center pt-3 pb-1">
              <div class="w-10 h-1 rounded-full bg-gray-300"></div>
            </div>

            <div class="px-5 py-3 overflow-y-auto" style="max-height:calc(85vh - 40px)">
              <h3 class="text-lg font-bold text-[#1a1a2e] mb-1">Importar CSV</h3>
              <p class="text-xs text-[#8a8a9e] mb-4">
                Formato: <code class="bg-white/60 px-1 rounded text-[#1a7bb5]">chinês,português,pos</code> (uma palavra por linha)
              </p>

              <!-- Drag & Drop Zone -->
              <div @click="$refs.fileInputRef?.click()"
                @dragover.prevent="dragOver = true"
                @dragleave="dragOver = false"
                @drop.prevent="handleDrop"
                class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 mb-4"
                :class="dragOver ? 'border-[#1a7bb5] bg-[#1a7bb5]/8' : 'border-gray-200 bg-white/40'">
                <i data-lucide="upload" class="w-10 h-10 mx-auto mb-2 transition-colors duration-150" :class="dragOver ? 'text-[#1a7bb5]' : 'text-gray-300'"></i>
                <p class="text-sm text-[#4a4a5e]">
                  Arraste o ficheiro CSV aqui ou
                  <span class="text-[#1a7bb5] font-medium">clique para seleccionar</span>
                </p>
                <input ref="fileInputRef" type="file" accept=".csv,.txt" @change="handleFileSelect" class="hidden" />
              </div>

              <!-- Parsed Preview -->
              <div v-if="parsedCSV.length > 0" class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-[#1a1a2e]">
                    {{ parsedCSV.length }} palavra{{ parsedCSV.length !== 1 ? 's' : '' }} detectada{{ parsedCSV.length !== 1 ? 's' : '' }}
                  </span>
                  <button @click="confirmUpload" class="btn-primary px-4 py-2 text-sm font-semibold flex items-center gap-1.5" style="min-height:40px">
                    <i data-lucide="check" class="w-4 h-4"></i> Confirmar
                  </button>
                </div>
                <div class="glass-card p-2 max-h-40 overflow-y-auto">
                  <div v-for="(item, i) in parsedCSV.slice(0, 30)" :key="i"
                    class="text-xs py-0.5 px-1 border-b border-gray-50 last:border-b-0 text-[#4a4a5e]">
                    <span class="font-medium">{{ item.zh }}</span> → <span>{{ item.pt }}</span>
                    <span v-if="item.pos" class="text-[#8a8a9e]">({{ item.pos }})</span>
                  </div>
                  <div v-if="parsedCSV.length > 30" class="text-xs text-[#8a8a9e] pt-1 px-1">
                    …e mais {{ parsedCSV.length - 30 }} palavra{{ parsedCSV.length - 30 !== 1 ? 's' : '' }}
                  </div>
                </div>
              </div>

              <!-- Close -->
              <div class="flex gap-3">
                <button @click="showUpload = false; parsedCSV = []" class="btn-glass flex-1 py-3 text-sm font-semibold" style="min-height:48px">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  `,
  emits: [],
  data() {
    return {
      selectedLevel: 'A1',
      direction: 'cn2pt',
      selectedCount: 10,
      cefrLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      countOptions: [
        { value: 10, label: '10' },
        { value: 20, label: '20' },
        { value: 30, label: '30' },
        { value: Infinity, label: '∞' },
      ],
      // Practice state
      practiceActive: false,
      currentIndex: 0,
      roundWords: [],
      userAnswer: '',
      feedbackState: null, // null | 'correct' | 'wrong'
      feedbackHint: '',
      correctInRound: 0,
      results: { correct: 0, wrong: 0, percent: 0, wrongWords: [] },
      roundCompleted: false,
      // Upload state
      showUpload: false,
      dragOver: false,
      parsedCSV: [],
    }
  },
  computed: {
    /** All vocab data from all sources */
    allVocabData() {
      const words = []
      // 1. Global DICT_VOCAB_DATA (embedded vocab)
      if (typeof DICT_VOCAB_DATA !== 'undefined' && Array.isArray(DICT_VOCAB_DATA)) {
        for (const w of DICT_VOCAB_DATA) words.push(w)
      }
      // 2. Uploaded CSV data in localStorage
      try {
        const stored = localStorage.getItem('UPLOADED_VOCAB_DATA')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            for (const w of parsed) words.push(w)
          }
        }
      } catch (_) { /* ignore parse errors */ }
      return words
    },
    /** Words filtered by selected CEFR level */
    filteredWords() {
      const words = this.allVocabData
      if (!this.selectedLevel) return words
      const level = this.selectedLevel.toLowerCase()
      const matched = words.filter(w => {
        if (!w.cefr) return false
        return String(w.cefr).toLowerCase() === level
      })
      return matched.length > 0 ? matched : words
    },
    hasWords() {
      return this.filteredWords.length > 0
    },
    currentWord() {
      return this.roundWords[this.currentIndex] || null
    },
    resultsEmoji() {
      const p = this.results.percent
      if (p >= 90) return '🏆'
      if (p >= 70) return '🎉'
      if (p >= 50) return '👍'
      if (p >= 30) return '💪'
      return '📚'
    },
    resultsColor() {
      const p = this.results.percent
      if (p >= 70) return 'text-[#2d6a4f]'
      if (p >= 50) return 'text-[#d4a843]'
      return 'text-[#c1121f]'
    },
  },
  methods: {
    toggleDirection() {
      this.direction = this.direction === 'cn2pt' ? 'pt2cn' : 'cn2pt'
    },

    /** Start a new practice round */
    startRound() {
      if (!this.hasWords) return
      const shuffled = [...this.filteredWords].sort(() => Math.random() - 0.5)
      this.roundWords = this.selectedCount === Infinity
        ? shuffled
        : shuffled.slice(0, Math.min(this.selectedCount, shuffled.length))
      this.currentIndex = 0
      this.correctInRound = 0
      this.results = { correct: 0, wrong: 0, percent: 0, wrongWords: [] }
      this.roundCompleted = false
      this.feedbackState = null
      this.userAnswer = ''
      this.practiceActive = true
      this.$nextTick(() => this.focusInput())
    },

    focusInput() {
      const el = this.$refs.answerInput
      if (el && typeof el.focus === 'function') {
        setTimeout(() => el.focus(), 100)
      }
    },

    /** Check the user's answer */
    checkAnswer() {
      if (!this.currentWord || this.feedbackState) return
      const userAns = this.userAnswer.trim()
      if (!userAns) return

      const correctAnswer = this.direction === 'cn2pt'
        ? this.currentWord.pt
        : this.currentWord.zh

      let matchResult
      if (typeof Diacritics !== 'undefined' && typeof Diacritics.compare === 'function') {
        matchResult = Diacritics.compare(userAns, correctAnswer)
      } else {
        matchResult = {
          match: userAns.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ? 'strict' : 'none',
          hint: '',
        }
      }

      const directionKey = this.direction === 'cn2pt' ? 'zh2pt' : 'pt2zh'

      if (matchResult.match === 'strict' || matchResult.match === 'loose') {
        this.feedbackState = 'correct'
        this.feedbackHint = matchResult.hint || ''
        this.correctInRound++
        this.results.correct++
        PTStore.addToMyVocab(this.currentWord.pt, this.currentWord.zh, this.currentWord.pos || '', directionKey)
        PTStore.logWordPractice(this.currentWord.pt, directionKey)
        if (matchResult.match === 'loose') {
          PTStore.logWrongWord(this.currentWord.pt, this.currentWord.zh, this.currentWord.pos || '', directionKey)
        } else {
          PTStore.correctReview(this.currentWord.pt, directionKey)
        }
      } else {
        this.feedbackState = 'wrong'
        this.feedbackHint = ''
        this.results.wrong++
        this.results.wrongWords.push({ ...this.currentWord })
        PTStore.logWrongWord(this.currentWord.pt, this.currentWord.zh, this.currentWord.pos || '', directionKey)
        PTStore.logWordPractice(this.currentWord.pt, directionKey)
      }
    },

    /** Move to next word or complete round */
    nextWord() {
      if (this.currentIndex < this.roundWords.length - 1) {
        this.currentIndex++
        this.feedbackState = null
        this.userAnswer = ''
        this.feedbackHint = ''
        this.$nextTick(() => this.focusInput())
      } else {
        this.results.percent = this.roundWords.length > 0
          ? Math.round((this.results.correct / this.roundWords.length) * 100)
          : 0
        this.roundCompleted = true
      }
    },

    cancelPractice() {
      this.practiceActive = false
      this.roundCompleted = false
      this.feedbackState = null
      this.userAnswer = ''
      this.roundWords = []
    },

    // ─── CSV Upload ───
    handleDrop(e) {
      this.dragOver = false
      const file = e.dataTransfer.files[0]
      if (file) this.parseCSVFile(file)
    },
    handleFileSelect(e) {
      const file = e.target.files[0]
      if (file) this.parseCSVFile(file)
    },
    parseCSVFile(file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const text = evt.target.result
        const lines = text.split('\n').filter(l => l.trim())
        const items = []
        for (let line of lines) {
          line = line.trim()
          if (/^(chin[eê]s|zh|chinese|pt|portugu[eê]s)/i.test(line) && !line.includes(',')) continue
          const parts = line.split(',')
          if (parts.length >= 2) {
            const zh = parts[0].trim().replace(/^["']|["']$/g, '')
            const pt = parts[1].trim().replace(/^["']|["']$/g, '')
            const pos = parts[2] ? parts[2].trim().replace(/^["']|["']$/g, '') : ''
            if (zh && pt) {
              items.push({ zh, pt, pos, cefr: this.selectedLevel, source: 'uploaded' })
            }
          }
        }
        this.parsedCSV = items
      }
      reader.readAsText(file)
    },
    confirmUpload() {
      let existing = []
      try {
        const stored = localStorage.getItem('UPLOADED_VOCAB_DATA')
        if (stored) existing = JSON.parse(stored)
      } catch (_) {}
      const existingKeys = new Set(existing.map(w => w.zh + '|' + w.pt))
      for (const item of this.parsedCSV) {
        const key = item.zh + '|' + item.pt
        if (!existingKeys.has(key)) {
          existing.push(item)
          existingKeys.add(key)
        }
      }
      localStorage.setItem('UPLOADED_VOCAB_DATA', JSON.stringify(existing))
      this.parsedCSV = []
      this.showUpload = false
    },
  },
  mounted() {
    this.$nextTick(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons()
      }
    })
  },
  updated() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons()
    }
  },
}
