/**
 * components/VocabView.js — 方向選擇 → 級別網格 → 無限背詞
 * CAPLE Glass 暖色葡式風格
 */
var VocabView = {
  name: 'VocabView',
  template: `
    <div class="vocab-view px-4 pt-2 pb-28 min-h-screen">

      <!-- ═══ 步驟1：選擇方向 ═══ -->
      <div v-if="mode === 'dir'">
        <div class="pt-6 text-center mb-2">
          <div class="text-4xl mb-3">📚</div>
          <h2 class="text-xl font-bold text-slate-800 mb-1">Vocabulário</h2>
          <p class="text-xs text-slate-400 mb-8">Escolha a direcção de estudo</p>
        </div>

        <div class="grid grid-cols-2 gap-4 px-2">
          <button @click="pickDirection('cn2pt')" class="dir-card glass-strong p-6 flex flex-col items-center justify-center gap-3 text-center"
            style="border-radius:24px;min-height:160px;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1)"
            :style="{ border: selectedDirTemp === 'cn2pt' ? '2px solid #1a7bb5' : '0.5px solid rgba(255,255,255,0.6)' }">
            <div class="w-14 h-14 rounded-[18px] flex items-center justify-center text-xl font-bold"
              :style="{ background: selectedDirTemp === 'cn2pt' ? 'rgba(26,123,181,0.15)' : 'rgba(255,255,255,0.5)', color: selectedDirTemp === 'cn2pt' ? '#1a7bb5' : '#64748b' }">
              CN
            </div>
            <div>
              <div class="text-base font-bold text-slate-800">CN → PT</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Chinês para Português</div>
            </div>
          </button>

          <button @click="pickDirection('pt2cn')" class="dir-card glass-strong p-6 flex flex-col items-center justify-center gap-3 text-center"
            style="border-radius:24px;min-height:160px;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1)"
            :style="{ border: selectedDirTemp === 'pt2cn' ? '2px solid #1a7bb5' : '0.5px solid rgba(255,255,255,0.6)' }">
            <div class="w-14 h-14 rounded-[18px] flex items-center justify-center text-xl font-bold"
              :style="{ background: selectedDirTemp === 'pt2cn' ? 'rgba(26,123,181,0.15)' : 'rgba(255,255,255,0.5)', color: selectedDirTemp === 'pt2cn' ? '#1a7bb5' : '#64748b' }">
              PT
            </div>
            <div>
              <div class="text-base font-bold text-slate-800">PT → CN</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Português para Chinês</div>
            </div>
          </button>
        </div>

        <div class="mt-6 text-center">
          <p class="text-[10px] text-slate-400">As palavras memorizadas sincronizam automaticamente</p>
        </div>
      </div>

      <!-- ═══ 步驟2：級別網格 ═══ -->
      <div v-else-if="mode === 'grid'">
        <!-- Header with direction indicator -->
        <div class="flex items-center justify-between mb-1 pt-1">
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-slate-800">Vocabulário</h2>
          </div>
          <span class="text-[11px] text-slate-400 bg-white/50 px-2.5 py-1 rounded-full">
            {{ totalWords }} palavras
          </span>
        </div>

        <!-- Active direction pill (tappable to go back) -->
        <div class="flex items-center gap-2 mb-5">
          <button @click="mode = 'dir'"
            class="glass rounded-xl px-3.5 py-2 text-sm font-semibold flex items-center gap-1.5"
            style="min-height:40px;transition:all 0.15s ease">
            <i data-lucide="arrow-left" class="w-4 h-4 text-slate-400"></i>
            <span :class="direction === 'cn2pt' ? 'text-azulejo' : 'text-slate-500'">
              {{ direction === 'cn2pt' ? 'CN → PT' : 'PT → CN' }}
            </span>
          </button>
          <span class="text-xs text-slate-400">Escolha o nível</span>
        </div>

        <!-- 2×3 級別卡片 -->
        <div class="grid grid-cols-2 gap-3">
          <div v-for="(lvl, i) in cefrLevels" :key="lvl.id"
            @click="startPractice(lvl)"
            class="level-card p-4 flex flex-col items-center justify-center gap-2"
            :style="{ animation: 'fade-up 0.4s cubic-bezier(0.16,1,0.3,1) ' + (i*0.06) + 's both' }">
            <div class="level-badge" :style="{ background: lvl.color + '18', color: lvl.color }">
              {{ lvl.id }}
            </div>
            <div class="level-label">{{ lvl.label }}</div>
            <div class="level-count">{{ lvl.count }} palavras</div>
          </div>
        </div>
      </div>

      <!-- ═══ 無限練習模式 ═══ -->
      <div v-else-if="mode === 'practice'" class="flex flex-col min-h-[calc(100vh-160px)]">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-xs text-slate-400 font-medium">{{ activeLevel?.id }}</span>
            <span class="text-slate-300 mx-1.5">·</span>
            <span class="text-xs text-slate-400">{{ answeredCount }} respondidas</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs" :class="correctInRound > 0 ? 'text-certo/70' : 'text-slate-300'">
              ✅ {{ correctInRound }}
            </span>
            <button @click="endPractice" class="btn-danger px-4 py-2 text-sm font-semibold flex items-center gap-1.5"
              style="min-height:40px">
              <i data-lucide="square" class="w-4 h-4 fill-current"></i> Terminar
            </button>
          </div>
        </div>

        <div class="w-full h-1 bg-slate-200/60 rounded-full overflow-hidden mb-8">
          <div class="h-full rounded-full transition-all duration-500 ease-out"
            :style="{ width: progressPercent + '%', background: progressColor }"></div>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center -mt-8">
          <div class="w-full max-w-sm">
            <div class="text-center mb-2">
              <div class="flex items-center justify-center gap-2 mb-3">
                <span class="text-[10px] text-slate-400 bg-white/50 px-2 py-0.5 rounded-full">
                  {{ currentWord?.pos || '—' }}
                </span>
                <span class="text-[10px] text-slate-400 bg-white/50 px-2 py-0.5 rounded-full">
                  {{ direction === 'cn2pt' ? 'CN→PT' : 'PT→CN' }}
                </span>
              </div>
              <div class="flashcard-word mb-1" :key="'w' + wordIndex">
                {{ direction === 'cn2pt' ? currentWord?.zh : currentWord?.pt }}
              </div>
              <div v-if="currentWord?.example" class="text-xs text-slate-400 italic mt-1">
                {{ currentWord.example }}
              </div>
            </div>

            <div class="mt-6 mb-3">
              <input ref="answerInput"
                v-model="userAnswer"
                @keyup.enter="checkAnswer"
                :placeholder="direction === 'cn2pt' ? 'Escreva em português…' : 'Escreva em chinês…'"
                class="glass-input w-full px-5 py-4 text-base text-center rounded-2xl"
                :class="{
                  '!border-certo/30 !ring-2 !ring-certo/10 !bg-certo/5': feedbackState === 'correct',
                  '!border-erro/30 !ring-2 !ring-erro/10 !bg-erro/5': feedbackState === 'wrong'
                }"
                style="min-height:56px;font-size:19px"
                :disabled="feedbackState !== null"
                autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
            </div>

            <div class="flex gap-2">
              <button v-if="!feedbackState" @click="checkAnswer" :disabled="!userAnswer.trim()"
                class="btn-primary flex-1 py-3.5 text-base font-semibold flex items-center justify-center gap-2"
                style="min-height:54px;border-radius:16px">
                <i data-lucide="check" class="w-5 h-5"></i> Verificar
              </button>
              <button v-else @click="nextWord" @keyup.enter="nextWord"
                class="btn-primary flex-1 py-3.5 text-base font-semibold flex items-center justify-center gap-2"
                style="min-height:54px;border-radius:16px">
                <i data-lucide="arrow-right" class="w-5 h-5"></i>
                {{ wordIndex < practiceWords.length - 1 ? 'Seguinte' : 'Próxima' }}
              </button>
              <button @click="endPractice"
                class="btn-glass w-14 flex items-center justify-center"
                style="min-height:54px;min-width:54px;border-radius:16px">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <div v-if="feedbackState" class="mt-3 transition-all duration-200"
              :class="{ 'anim-pop': feedbackState === 'correct', 'anim-shake': feedbackState === 'wrong' }">
              <div v-if="feedbackState === 'correct'"
                class="feedback-correct rounded-2xl p-3.5 text-center">
                <div class="text-base mb-0.5 font-semibold text-certo">✅ Correcto!</div>
                <div class="text-sm text-slate-500 font-medium">
                  {{ direction === 'cn2pt' ? currentWord?.zh + ' = ' + currentWord?.pt : currentWord?.pt + ' = ' + currentWord?.zh }}
                </div>
              </div>
              <div v-else class="feedback-wrong rounded-2xl p-3.5 text-center">
                <div class="text-base mb-0.5 font-semibold text-erro">❌ {{ wrongCount }}º erro</div>
                <div class="text-sm text-slate-500">
                  Resposta correcta:
                  <strong class="text-slate-800 font-semibold">
                    {{ direction === 'cn2pt' ? currentWord?.pt : currentWord?.zh }}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center pb-2">
          <span class="text-[10px] text-slate-400">Enter para verificar · Enter novamente para continuar</span>
        </div>
      </div>

      <!-- ═══ 結果頁 ═══ -->
      <div v-else-if="mode === 'results'" class="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4">
        <div class="w-full max-w-sm text-center anim-scale-in">
          <div class="text-6xl mb-4 anim-bounce-in">{{ resultsEmoji }}</div>

          <h3 class="text-2xl font-bold text-slate-800 mb-1">Ronda Completa!</h3>
          <p class="text-sm text-slate-400 mb-6">{{ direction === 'cn2pt' ? 'CN→PT' : 'PT→CN' }} · {{ activeLevel?.id }} · {{ answeredCount }} palavras</p>

          <div class="relative w-28 h-28 mx-auto mb-6">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="6"/>
              <circle cx="50" cy="50" r="42" fill="none"
                :stroke="resultsColor" stroke-width="6" stroke-linecap="round"
                :stroke-dasharray="264" :stroke-dashoffset="264 - (results.percent/100)*264"
                class="transition-all duration-1000 ease-out" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-3xl font-bold" :style="{ color: resultsColor }">{{ results.percent }}%</span>
            </div>
          </div>

          <div class="glass-strong rounded-2xl p-4 mb-6">
            <div class="flex justify-around">
              <div class="text-center">
                <div class="text-2xl font-bold text-certo">{{ results.correct }}</div>
                <div class="text-xs text-slate-400 mt-0.5">Correctas</div>
              </div>
              <div class="w-px bg-slate-200"></div>
              <div class="text-center">
                <div class="text-2xl font-bold text-erro">{{ results.wrong }}</div>
                <div class="text-xs text-slate-400 mt-0.5">Erradas</div>
              </div>
            </div>
          </div>

          <div v-if="results.wrongWords.length > 0" class="glass rounded-2xl p-3 mb-6 w-full max-h-40 overflow-y-auto">
            <p class="text-xs font-medium text-erro/70 mb-2 flex items-center gap-1">
              <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
              Palavras para revisar ({{ results.wrongWords.length }})
            </p>
            <div v-for="(w, i) in results.wrongWords" :key="i"
              class="flex justify-between items-center py-1.5 px-1 border-b border-slate-100 last:border-b-0">
              <span class="text-sm text-slate-700 font-medium">{{ direction === 'cn2pt' ? w.zh : w.pt }}</span>
              <span class="text-xs text-slate-400">→ {{ direction === 'cn2pt' ? w.pt : w.zh }}</span>
            </div>
          </div>

          <div class="flex items-center justify-center gap-1.5 mb-4">
            <span :class="['w-2 h-2 rounded-full', syncDone ? 'bg-certo' : 'bg-amber-400 anim-pulse-soft']"></span>
            <span class="text-xs text-slate-400">{{ syncDone ? 'Sincronizado!' : 'A sincronizar…' }}</span>
          </div>

          <div class="flex gap-3 w-full">
            <button @click="startPractice(activeLevel)"
              class="btn-primary flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-1.5"
              style="min-height:50px;border-radius:16px">
              <i data-lucide="rotate-cw" class="w-4 h-4"></i> Nova Ronda
            </button>
            <button @click="mode = 'dir'"
              class="btn-glass flex-1 py-3.5 text-sm font-semibold"
              style="min-height:50px;border-radius:16px">
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      mode: 'dir',          // 'dir' | 'grid' | 'practice' | 'results'
      direction: null,      // null until user picks
      selectedDirTemp: null, // for visual highlight during direction pick
      cefrLevels: [
        { id: 'A1', label: 'Iniciação',   color: '#2d6a4f' },
        { id: 'A2', label: 'Elementar',    color: '#1a7bb5' },
        { id: 'B1', label: 'Limiar',       color: '#d4a843' },
        { id: 'B2', label: 'Vantagem',     color: '#c07a2a' },
        { id: 'C1', label: 'Autonomia',    color: '#8b2252' },
        { id: 'C2', label: 'Mestria',      color: '#6b21a8' },
      ],
      activeLevel: null,
      practiceWords: [],
      wordIndex: 0,
      userAnswer: '',
      feedbackState: null,
      answeredCount: 0,
      correctInRound: 0,
      wrongCount: 0,
      results: { correct: 0, wrong: 0, percent: 0, wrongWords: [] },
      syncDone: false,
    }
  },

  computed: {
    totalWords() { return this.allQecrWords.length },
    currentWord() { return this.practiceWords[this.wordIndex] || null },
    progressPercent() {
      if (this.practiceWords.length === 0) return 0
      return Math.min(100, Math.round((this.wordIndex / Math.max(this.practiceWords.length - 1, 1)) * 100))
    },
    progressColor() {
      const p = this.correctInRound / Math.max(this.answeredCount, 1)
      if (p >= 0.7) return '#2d6a4f'
      if (p >= 0.4) return '#d4a843'
      return '#c1121f'
    },
    resultsEmoji() {
      const p = this.results.percent
      if (p >= 90) return '🏆'
      if (p >= 70) return '🎉'
      if (p >= 50) return '👍'
      return '💪'
    },
    resultsColor() {
      const p = this.results.percent
      if (p >= 70) return '#2d6a4f'
      if (p >= 50) return '#d4a843'
      return '#c1121f'
    },
    allQecrWords() {
      if (typeof UPLOADED_QECR_DATA !== 'undefined' && Array.isArray(UPLOADED_QECR_DATA)) {
        return UPLOADED_QECR_DATA
      }
      if (typeof DICT_VOCAB_DATA !== 'undefined' && Array.isArray(DICT_VOCAB_DATA)) {
        return DICT_VOCAB_DATA.map(w => ({ ...w, lv: '' }))
      }
      return []
    },
  },

  methods: {
    pickDirection(dir) {
      this.selectedDirTemp = dir
      // Brief delay for visual feedback, then transition
      setTimeout(() => {
        this.direction = dir
        this.mode = 'grid'
      }, 120)
    },

    getLevelWords(lvlId) { return this.allQecrWords.filter(w => w.lv && w.lv.toUpperCase() === lvlId.toUpperCase()) },

    startPractice(lvl) {
      const words = this.getLevelWords(lvl.id)
      if (words.length === 0) return
      this.activeLevel = lvl
      this.practiceWords = [...words].sort(() => Math.random() - 0.5)
      this.wordIndex = 0
      this.answeredCount = 0
      this.correctInRound = 0
      this.wrongCount = 0
      this.results = { correct: 0, wrong: 0, percent: 0, wrongWords: [] }
      this.feedbackState = null
      this.userAnswer = ''
      this.syncDone = false
      this.mode = 'practice'
      this.$nextTick(() => { setTimeout(() => { const el = this.$refs.answerInput; if (el) el.focus() }, 150) })
    },

    checkAnswer() {
      if (!this.currentWord || this.feedbackState) return
      const userAns = this.userAnswer.trim()
      if (!userAns) return
      const correctAnswer = this.direction === 'cn2pt' ? this.currentWord.pt : this.currentWord.zh
      let matchResult
      if (typeof Diacritics !== 'undefined' && typeof Diacritics.compare === 'function') {
        matchResult = Diacritics.compare(userAns, correctAnswer)
      } else {
        matchResult = { match: userAns.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ? 'strict' : 'none', hint: '' }
      }
      const directionKey = this.direction === 'cn2pt' ? 'zh2pt' : 'pt2zh'
      this.answeredCount++
      if (matchResult.match === 'strict' || matchResult.match === 'loose') {
        this.feedbackState = 'correct'
        this.correctInRound++
        this.results.correct++
        PTStore.addToMyVocab(this.currentWord.pt, this.currentWord.zh, this.currentWord.pos || '', directionKey)
        PTStore.logWordPractice(this.currentWord.pt, directionKey)
        if (matchResult.match === 'loose') {
          this.wrongCount++
          PTStore.logWrongWord(this.currentWord.pt, this.currentWord.zh, this.currentWord.pos || '', directionKey)
        } else {
          PTStore.correctReview(this.currentWord.pt, directionKey)
        }
      } else {
        this.feedbackState = 'wrong'
        this.wrongCount++
        this.results.wrong++
        this.results.wrongWords.push({ ...this.currentWord })
        PTStore.logWrongWord(this.currentWord.pt, this.currentWord.zh, this.currentWord.pos || '', directionKey)
        PTStore.logWordPractice(this.currentWord.pt, directionKey)
      }
    },

    nextWord() {
      this.wordIndex++
      this.feedbackState = null
      this.userAnswer = ''
      if (this.wordIndex >= this.practiceWords.length) {
        this.practiceWords = [...this.practiceWords].sort(() => Math.random() - 0.5)
        this.wordIndex = 0
      }
      this.$nextTick(() => { setTimeout(() => { const el = this.$refs.answerInput; if (el) el.focus() }, 100) })
    },

    async endPractice() {
      if (this.answeredCount === 0) { this.mode = 'dir'; return }
      this.mode = 'results'
      this.results.percent = Math.round((this.results.correct / this.answeredCount) * 100)
      this.syncDone = false
      try {
        if (typeof SyncManager !== 'undefined' && SyncManager.isLoggedIn && SyncManager.isLoggedIn()) {
          await SyncManager.sync()
        }
        this.syncDone = true
      } catch (e) {
        console.warn('[VocabView] Sync failed:', e.message)
        this.syncDone = true
      }
    },
  },

  mounted() {
    for (const lvl of this.cefrLevels) { lvl.count = this.getLevelWords(lvl.id).length }
    this.$nextTick(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons() })
  },
  updated() {
    this.$nextTick(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons() })
  },
}

if (typeof window !== 'undefined') window.VocabView = VocabView
