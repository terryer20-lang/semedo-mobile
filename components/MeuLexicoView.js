/**
 * components/MeuLexicoView.js — "Meu Léxico" List View
 * Shows memorized words with search, direction toggle, and full practice round.
 *
 * IIFE global Vue component object. Uses Vue 3 Options API.
 * Dependencies: PTStore (store/storage.js), Diacritics (utils/diacritics.js)
 */
var MeuLexicoView = {
  name: 'MeuLexicoView',
  template: `
    <div class="meu-lexico-view px-4 pt-2 pb-24 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 anim-enter">
        <h2 class="text-lg font-semibold text-[#1a1a2e]">Meu Léxico</h2>
        <span class="text-xs text-[#8a8a9e] bg-white/50 px-2.5 py-1 rounded-full">
          {{ lexiconWords.length }} palavra{{ lexiconWords.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Direction Toggle -->
      <div class="glass-card p-3 mb-3 anim-enter" style="animation-delay:0.03s">
        <div class="flex items-center justify-center gap-4">
          <span class="text-sm font-medium transition-colors duration-200"
            :class="direction === 'zh2pt' ? 'text-[#1a7bb5] font-semibold' : 'text-[#4a4a5e]'">ZH → PT</span>
          <button @click="toggleDirection"
            class="relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none"
            :class="direction === 'pt2zh' ? 'bg-[#1a7bb5]' : 'bg-gray-300'"
            style="min-height:44px;min-width:56px"
            role="switch" :aria-checked="direction === 'pt2zh'">
            <span class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200"
              :class="direction === 'pt2zh' ? 'translate-x-6' : ''"></span>
          </button>
          <span class="text-sm font-medium transition-colors duration-200"
            :class="direction === 'pt2zh' ? 'text-[#1a7bb5] font-semibold' : 'text-[#4a4a5e]'">PT → ZH</span>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="mb-3 anim-enter" style="animation-delay:0.06s">
        <div class="relative">
          <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a9e] pointer-events-none"></i>
          <input v-model="searchQuery"
            type="search"
            placeholder="Pesquisar no léxico…"
            class="glass-input w-full pl-10 pr-4 py-3 text-sm"
            style="min-height:48px"
            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
        </div>
      </div>

      <!-- Empty State (no words at all) -->
      <div v-if="filteredWords.length === 0 && lexiconWords.length === 0" class="anim-enter text-center py-12" style="animation-delay:0.09s">
        <div class="text-5xl mb-4 opacity-50">📖</div>
        <h3 class="text-base font-semibold text-[#1a1a2e] mb-1">Léxico vazio</h3>
        <p class="text-sm text-[#8a8a9e] mb-4">
          As palavras que acertar nas rondas de prática aparecerão aqui.
        </p>
        <button disabled class="btn-primary px-6 py-2.5 text-sm font-semibold opacity-40" style="min-height:44px">
          <i data-lucide="play" class="w-4 h-4 inline mr-1"></i> Iniciar Ronda
        </button>
      </div>

      <!-- No Search Results -->
      <div v-else-if="filteredWords.length === 0" class="anim-enter text-center py-8" style="animation-delay:0.09s">
        <div class="text-3xl mb-3 opacity-40">🔍</div>
        <p class="text-sm text-[#8a8a9e]">Nenhuma palavra encontrada para "{{ searchQuery }}"</p>
      </div>

      <!-- Word List -->
      <div v-else>
        <!-- Practice Button -->
        <div class="mb-3 anim-enter" style="animation-delay:0.09s">
          <button @click="startPracticeRound" :disabled="filteredWords.length === 0"
            class="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style="min-height:48px">
            <i data-lucide="play" class="w-4 h-4"></i>
            Iniciar Ronda ({{ filteredWords.length }} palavra{{ filteredWords.length !== 1 ? 's' : '' }})
          </button>
        </div>

        <!-- Words -->
        <div class="space-y-2 anim-enter" style="animation-delay:0.12s">
          <div v-for="(word, i) in filteredWords" :key="word.pt + '|' + i"
            class="glass-card p-3.5 flex items-center justify-between transition-all duration-150 active:scale-[0.98]"
            style="min-height:56px">
            <div class="flex-1 min-w-0 pr-2">
              <div v-if="direction === 'zh2pt'" class="flex items-baseline gap-2">
                <span class="font-medium text-[#1a1a2e] text-base">{{ word.zh }}</span>
                <span class="text-sm text-[#4a4a5e]">→</span>
                <span class="text-sm text-[#4a4a5e] truncate">{{ word.pt }}</span>
              </div>
              <div v-else class="flex items-baseline gap-2">
                <span class="font-medium text-[#1a1a2e] text-base">{{ word.pt }}</span>
                <span class="text-sm text-[#4a4a5e]">→</span>
                <span class="text-sm text-[#4a4a5e] truncate">{{ word.zh }}</span>
              </div>
              <div v-if="word.pos" class="text-xs text-[#8a8a9e] mt-0.5">
                {{ word.pos }}
                <span v-if="word.added" class="ml-2">• {{ formatDate(word.added) }}</span>
              </div>
            </div>
            <!-- Remove button -->
            <button @click="removeWord(word)"
              class="btn-glass p-2 flex-shrink-0 text-[#8a8a9e] hover:text-[#c1121f] transition-colors"
              style="min-height:40px;min-width:40px"
              title="Remover do léxico">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── PRACTICE POPUP (Bottom Sheet) ─── -->
      <Teleport to="body">
        <div v-if="practiceActive" class="fixed inset-0 z-50 flex flex-col justify-end" @click.self="cancelPractice">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="cancelPractice"></div>
          <div class="relative w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-xl overflow-hidden"
            style="max-height:90vh;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">

            <!-- Handle -->
            <div class="flex justify-center pt-3 pb-1 cursor-grab">
              <div class="w-10 h-1 rounded-full bg-gray-300"></div>
            </div>

            <!-- Progress -->
            <div v-if="!roundCompleted && roundWords.length > 0" class="px-5 pb-2">
              <div class="flex justify-between text-xs text-[#4a4a5e] mb-1">
                <span class="font-medium">{{ currentIndex + 1 }} / {{ roundWords.length }}</span>
                <span class="text-[#2d6a4f]">{{ correctInRound }} ✅</span>
              </div>
              <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full bg-[#1a7bb5] rounded-full transition-all duration-300"
                  :style="{ width: roundWords.length > 0 ? ((currentIndex + 1) / roundWords.length * 100) + '%' : '0%' }"></div>
              </div>
            </div>

            <!-- Content -->
            <div class="px-5 py-4 overflow-y-auto" style="max-height:calc(90vh - 160px)">
              <!-- Completed -->
              <div v-if="roundCompleted" class="text-center py-2">
                <div class="text-5xl mb-3">{{ roundResultsEmoji }}</div>
                <h3 class="text-lg font-bold text-[#1a1a2e] mb-1">Ronda Completa!</h3>
                <div class="glass-card-strong p-4 mb-4">
                  <div class="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div class="text-3xl font-bold text-[#2d6a4f]">{{ roundResults.correct }}</div>
                      <div class="text-xs text-[#4a4a5e] mt-0.5">Correctas</div>
                    </div>
                    <div>
                      <div class="text-3xl font-bold text-[#c1121f]">{{ roundResults.wrong }}</div>
                      <div class="text-xs text-[#4a4a5e] mt-0.5">Erradas</div>
                    </div>
                  </div>
                  <div class="mt-3 pt-3 border-t border-gray-100">
                    <div class="text-lg font-bold" :class="roundResultsColor">{{ roundResults.percent }}%</div>
                    <div class="text-xs text-[#4a4a5e]">Taxa de acerto</div>
                  </div>
                </div>
                <div v-if="roundResults.wrongWords.length > 0" class="glass-card p-2 mb-4 text-left max-h-32 overflow-y-auto">
                  <p class="text-xs font-medium text-[#c1121f] mb-1">Palavras para revisar:</p>
                  <div v-for="w in roundResults.wrongWords" :key="w.pt"
                    class="flex justify-between text-xs py-1 border-b border-gray-50 last:border-b-0">
                    <span>{{ direction === 'zh2pt' ? w.zh : w.pt }}</span>
                    <span class="text-[#8a8a9e]">{{ direction === 'zh2pt' ? w.pt : w.zh }}</span>
                  </div>
                </div>
                <div class="flex gap-3">
                  <button @click="startPracticeRound" class="btn-primary flex-1 py-3 text-sm font-semibold" style="min-height:48px">
                    Nova Ronda
                  </button>
                  <button @click="cancelPractice" class="btn-glass flex-1 py-3 text-sm font-semibold" style="min-height:48px">
                    Fechar
                  </button>
                </div>
              </div>

              <!-- Flashcard -->
              <div v-else-if="currentWord">
                <div class="text-center mb-6">
                  <div class="text-xs text-[#8a8a9e] mb-1">{{ currentWord.pos || '—' }}</div>
                  <div class="text-2xl font-bold text-[#1a1a2e] my-6 py-4 px-2 glass-card-strong inline-block min-w-[60%]">
                    {{ direction === 'zh2pt' ? currentWord.zh : currentWord.pt }}
                  </div>
                  <div class="text-xs text-[#8a8a9e]">{{ direction === 'zh2pt' ? 'Chinês → Português' : 'Português → Chinês' }}</div>
                </div>
                <div class="mb-3">
                  <input ref="answerInput"
                    v-model="userAnswer"
                    @keyup.enter="checkAnswer"
                    :placeholder="direction === 'zh2pt' ? 'Escreva em português…' : 'Escreva em chinês…'"
                    class="glass-input w-full px-4 py-3 text-base text-center"
                    :class="{
                      'border-[#2d6a4f]/50 ring-2 ring-[#2d6a4f]/20': feedbackState === 'correct',
                      'border-[#c1121f]/50 ring-2 ring-[#c1121f]/20': feedbackState === 'wrong'
                    }"
                    style="min-height:50px;font-size:18px"
                    :disabled="feedbackState !== null"
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
                </div>
                <div v-if="feedbackState" class="mb-4">
                  <div v-if="feedbackState === 'correct'" class="glass-card bg-[#2d6a4f]/10 p-3.5 text-center rounded-xl border border-[#2d6a4f]/20">
                    <div class="text-xl mb-1">✅ Correcto!</div>
                    <div class="text-sm text-[#4a4a5e] font-medium">
                      {{ direction === 'zh2pt' ? currentWord.zh + ' = ' + currentWord.pt : currentWord.pt + ' = ' + currentWord.zh }}
                    </div>
                  </div>
                  <div v-else class="glass-card bg-[#c1121f]/10 p-3.5 text-center rounded-xl border border-[#c1121f]/20">
                    <div class="text-xl mb-1">❌ Errado</div>
                    <div class="text-sm text-[#4a4a5e]">Resposta correcta: <strong class="text-[#1a1a2e]">{{ direction === 'zh2pt' ? currentWord.pt : currentWord.zh }}</strong></div>
                  </div>
                </div>
                <div class="flex gap-3">
                  <button v-if="!feedbackState" @click="checkAnswer" class="btn-primary flex-1 py-3 text-base font-semibold" style="min-height:50px">
                    <i data-lucide="check" class="w-5 h-5 inline mr-1"></i> Verificar
                  </button>
                  <button v-if="feedbackState" @click="nextWord" class="btn-primary flex-1 py-3 text-base font-semibold" style="min-height:50px">
                    <i data-lucide="arrow-right" class="w-5 h-5 inline mr-1"></i> Seguinte
                  </button>
                  <button @click="cancelPractice" class="btn-glass w-14 flex items-center justify-center" style="min-height:50px;min-width:50px">
                    <i data-lucide="x" class="w-5 h-5"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  `,
  data() {
    return {
      direction: 'zh2pt',
      searchQuery: '',
      // Practice state
      practiceActive: false,
      currentIndex: 0,
      roundWords: [],
      userAnswer: '',
      feedbackState: null,
      correctInRound: 0,
      roundResults: { correct: 0, wrong: 0, percent: 0, wrongWords: [] },
      roundCompleted: false,
    }
  },
  computed: {
    /** All lexicon words for the selected direction */
    lexiconWords() {
      if (this.direction === 'zh2pt') {
        return PTStore.data.my_vocab_zh2pt || []
      } else {
        return PTStore.data.my_vocab_pt2zh || []
      }
    },
    /** Filtered by search query */
    filteredWords() {
      const q = this.searchQuery.trim().toLowerCase()
      if (!q) return this.lexiconWords
      return this.lexiconWords.filter(w => {
        return (w.pt && w.pt.toLowerCase().includes(q)) ||
               (w.zh && w.zh.toLowerCase().includes(q)) ||
               (w.pos && w.pos.toLowerCase().includes(q))
      })
    },
    currentWord() {
      return this.roundWords[this.currentIndex] || null
    },
    roundResultsEmoji() {
      const p = this.roundResults.percent
      if (p >= 90) return '🏆'
      if (p >= 70) return '🎉'
      if (p >= 50) return '👍'
      return '💪'
    },
    roundResultsColor() {
      const p = this.roundResults.percent
      if (p >= 70) return 'text-[#2d6a4f]'
      if (p >= 50) return 'text-[#d4a843]'
      return 'text-[#c1121f]'
    },
  },
  methods: {
    toggleDirection() {
      this.direction = this.direction === 'zh2pt' ? 'pt2zh' : 'zh2pt'
      this.searchQuery = ''
    },
    formatDate(iso) {
      if (!iso) return ''
      try {
        const d = new Date(iso)
        return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
      } catch (_) { return '' }
    },
    removeWord(word) {
      PTStore.removeFromMyVocab(word.pt, this.direction)
    },

    /** Start practice round with filtered lexicon words */
    startPracticeRound() {
      const words = this.filteredWords
      if (words.length === 0) return
      const shuffled = [...words].sort(() => Math.random() - 0.5)
      this.roundWords = shuffled.slice(0, Math.min(20, shuffled.length))
      this.currentIndex = 0
      this.correctInRound = 0
      this.roundResults = { correct: 0, wrong: 0, percent: 0, wrongWords: [] }
      this.roundCompleted = false
      this.feedbackState = null
      this.userAnswer = ''
      this.practiceActive = true
      this.$nextTick(() => {
        setTimeout(() => {
          const el = this.$refs.answerInput
          if (el) el.focus()
        }, 100)
      })
    },

    checkAnswer() {
      if (!this.currentWord || this.feedbackState) return
      const userAns = this.userAnswer.trim()
      if (!userAns) return
      const correctAns = this.direction === 'zh2pt' ? this.currentWord.pt : this.currentWord.zh
      let match
      if (typeof Diacritics !== 'undefined') {
        match = Diacritics.compare(userAns, correctAns).match
      } else {
        match = userAns.toLowerCase() === correctAns.toLowerCase() ? 'strict' : 'none'
      }
      const dirKey = this.direction === 'zh2pt' ? 'zh2pt' : 'pt2zh'
      if (match === 'strict' || match === 'loose') {
        this.feedbackState = 'correct'
        this.correctInRound++
        this.roundResults.correct++
        if (match === 'loose') {
          PTStore.logWrongWord(this.currentWord.pt, this.currentWord.zh, this.currentWord.pos || '', dirKey)
        }
      } else {
        this.feedbackState = 'wrong'
        this.roundResults.wrong++
        this.roundResults.wrongWords.push({ ...this.currentWord })
        PTStore.logWrongWord(this.currentWord.pt, this.currentWord.zh, this.currentWord.pos || '', dirKey)
      }
    },

    nextWord() {
      if (this.currentIndex < this.roundWords.length - 1) {
        this.currentIndex++
        this.feedbackState = null
        this.userAnswer = ''
        this.$nextTick(() => {
          setTimeout(() => {
            const el = this.$refs.answerInput
            if (el) el.focus()
          }, 100)
        })
      } else {
        this.roundResults.percent = this.roundWords.length > 0
          ? Math.round((this.roundResults.correct / this.roundWords.length) * 100) : 0
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
  },
  mounted() {
    this.$nextTick(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons()
    })
  },
  updated() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons()
  },
}
