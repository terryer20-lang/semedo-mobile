/**
 * components/ErrosView.js — Wrong Words Review View
 * Shows wrong word count, spaced repetition due words, and review practice.
 *
 * Uses PTStore Ebbinghaus system: PTStore.getDueWrongWords(), PTStore.correctReview(), PTStore.wrongReview()
 * IIFE global Vue component object. Uses Vue 3 Options API.
 */
const ErrosView = {
  name: 'ErrosView',
  template: `
    <div class="erros-view px-4 pt-2 pb-24 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 anim-enter">
        <h2 class="text-lg font-semibold text-[#1a1a2e]">Erros</h2>
        <span class="text-xs text-[#8a8a9e] bg-white/50 px-2.5 py-1 rounded-full">
          {{ totalWrongCount }} no total
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

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="glass-card p-3.5 text-center anim-enter" style="animation-delay:0.06s">
          <div class="text-2xl font-bold text-[#c1121f]">{{ dueWords.length }}</div>
          <div class="text-xs text-[#4a4a5e] mt-0.5">Por revisar hoje</div>
        </div>
        <div class="glass-card p-3.5 text-center anim-enter" style="animation-delay:0.08s">
          <div class="text-2xl font-bold text-[#1a1a2e]">{{ totalWrongCount }}</div>
          <div class="text-xs text-[#4a4a5e] mt-0.5">Total de erros</div>
        </div>
      </div>

      <!-- Practice Button -->
      <div v-if="dueWords.length > 0" class="anim-enter mb-4" style="animation-delay:0.1s">
        <button @click="startReview"
          class="btn-primary w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
          style="min-height:50px">
          <i data-lucide="refresh-cw" class="w-5 h-5"></i>
          Iniciar revisão ({{ dueWords.length }})
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="totalWrongCount === 0" class="anim-enter text-center py-12" style="animation-delay:0.1s">
        <div class="text-5xl mb-4 opacity-50">🎯</div>
        <h3 class="text-base font-semibold text-[#1a1a2e] mb-1">Sem erros!</h3>
        <p class="text-sm text-[#8a8a9e]">Nenhuma palavra errada registada. Continue a praticar!</p>
      </div>

      <!-- All Clear (due words = 0 but total > 0) -->
      <div v-else-if="dueWords.length === 0" class="anim-enter text-center py-8" style="animation-delay:0.1s">
        <div class="text-4xl mb-3">✅</div>
        <p class="text-sm text-[#2d6a4f] font-medium">Todas as palavras revistas! Volte amanhã.</p>
        <p class="text-xs text-[#8a8a9e] mt-1">{{ totalWrongCount }} palavras no arquivo de erros</p>
      </div>

      <!-- Due Words List (preview) -->
      <div v-if="dueWords.length > 0" class="space-y-2 anim-enter" style="animation-delay:0.14s">
        <div v-for="(w, i) in dueWords" :key="w.pt + '|' + i"
          class="glass-card p-3 flex items-center justify-between transition-all duration-150"
          style="min-height:52px">
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-1.5">
              <span class="font-medium text-[#1a1a2e] text-sm">{{ w.pt }}</span>
              <span class="text-xs text-[#8a8a9e]">·</span>
              <span class="text-xs text-[#4a4a5e]">{{ w.zh }}</span>
            </div>
            <div class="flex items-center gap-2 mt-0.5">
              <span v-if="w.pos" class="text-[10px] text-[#8a8a9e] bg-white/40 px-1.5 py-0.5 rounded">{{ w.pos }}</span>
              <span class="text-[10px] text-[#c1121f]">Erros: {{ w.wrong_count }}</span>
              <span v-if="w.correct_count > 0" class="text-[10px] text-[#2d6a4f]">Acertos: {{ w.correct_count }}</span>
              <span class="text-[10px] text-[#8a8a9e]">Estágio {{ w.stage }}/5</span>
            </div>
          </div>
          <!-- Stage indicator dots -->
          <div class="flex gap-0.5 ml-2 flex-shrink-0">
            <span v-for="s in 5" :key="s"
              class="w-1.5 h-1.5 rounded-full"
              :class="s <= w.stage ? 'bg-[#2d6a4f]' : 'bg-gray-200'"></span>
          </div>
        </div>
      </div>

      <!-- ─── REVIEW PRACTICE POPUP (Bottom Sheet) ─── -->
      <Teleport to="body">
        <div v-if="practiceActive" class="fixed inset-0 z-50 flex flex-col justify-end" @click.self="cancelPractice">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="cancelPractice"></div>
          <div class="relative w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-xl overflow-hidden"
            style="max-height:90vh;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">

            <div class="flex justify-center pt-3 pb-1 cursor-grab">
              <div class="w-10 h-1 rounded-full bg-gray-300"></div>
            </div>

            <!-- Progress -->
            <div v-if="!roundCompleted && reviewWords.length > 0" class="px-5 pb-2">
              <div class="flex justify-between text-xs text-[#4a4a5e] mb-1">
                <span class="font-medium">{{ currentIndex + 1 }} / {{ reviewWords.length }}</span>
                <span class="text-[#2d6a4f]">{{ correctInRound }} ✅</span>
              </div>
              <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full bg-[#c1121f] rounded-full transition-all duration-300"
                  :style="{ width: reviewWords.length > 0 ? ((currentIndex + 1) / reviewWords.length * 100) + '%' : '0%' }"></div>
              </div>
            </div>

            <div class="px-5 py-4 overflow-y-auto" style="max-height:calc(90vh - 160px)">
              <!-- Completed -->
              <div v-if="roundCompleted" class="text-center py-2">
                <div class="text-5xl mb-3">{{ reviewResultsEmoji }}</div>
                <h3 class="text-lg font-bold text-[#1a1a2e] mb-1">Revisão Completa!</h3>
                <div class="glass-card-strong p-4 mb-4">
                  <div class="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div class="text-3xl font-bold text-[#2d6a4f]">{{ reviewResults.correct }}</div>
                      <div class="text-xs text-[#4a4a5e] mt-0.5">Correctas</div>
                    </div>
                    <div>
                      <div class="text-3xl font-bold text-[#c1121f]">{{ reviewResults.wrong }}</div>
                      <div class="text-xs text-[#4a4a5e] mt-0.5">Ainda erradas</div>
                    </div>
                  </div>
                  <div class="mt-3 pt-3 border-t border-gray-100">
                    <div class="text-lg font-bold" :class="reviewResultsColor">{{ reviewResults.percent }}%</div>
                    <div class="text-xs text-[#4a4a5e]">Taxa de acerto</div>
                  </div>
                </div>
                <div class="flex gap-3">
                  <button @click="startReview" class="btn-primary flex-1 py-3 text-sm font-semibold" style="min-height:48px">
                    <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-1"></i> Nova Revisão
                  </button>
                  <button @click="cancelPractice" class="btn-glass flex-1 py-3 text-sm font-semibold" style="min-height:48px">
                    Fechar
                  </button>
                </div>
              </div>

              <!-- Flashcard -->
              <div v-else-if="currentReviewWord" class="flashcard-area">
                <div class="text-center mb-6">
                  <div class="text-xs text-[#8a8a9e] mb-1 flex items-center justify-center gap-2">
                    <span class="bg-[#c1121f]/10 text-[#c1121f] px-2 py-0.5 rounded-full text-[10px] font-medium">
                      Erros: {{ currentReviewWord.wrong_count }}
                    </span>
                    <span class="bg-white/60 px-2 py-0.5 rounded-full text-[10px]">{{ currentReviewWord.pos || '—' }}</span>
                    <span class="bg-white/60 px-2 py-0.5 rounded-full text-[10px]">Estágio {{ currentReviewWord.stage }}/5</span>
                  </div>
                  <div class="text-2xl font-bold text-[#1a1a2e] my-6 py-4 px-2 glass-card-strong inline-block min-w-[60%]">
                    {{ direction === 'zh2pt' ? currentReviewWord.zh : currentReviewWord.pt }}
                  </div>
                  <div class="text-xs text-[#8a8a9e]">
                    {{ direction === 'zh2pt' ? 'Chinês → Português' : 'Português → Chinês' }}
                  </div>
                </div>

                <div class="mb-3">
                  <input ref="answerInput"
                    v-model="userAnswer"
                    @keyup.enter="checkReviewAnswer"
                    :placeholder="direction === 'zh2pt' ? 'Escreva em português…' : 'Escreva em chinês…'"
                    class="glass-input w-full px-4 py-3 text-base text-center"
                    :class="{
                      'border-[#2d6a4f]/50 ring-2 ring-[#2d6a4f]/20 bg-[#2d6a4f]/5': feedbackState === 'correct',
                      'border-[#c1121f]/50 ring-2 ring-[#c1121f]/20 bg-[#c1121f]/5': feedbackState === 'wrong'
                    }"
                    style="min-height:50px;font-size:18px"
                    :disabled="feedbackState !== null"
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
                </div>

                <div v-if="feedbackState" class="mb-4">
                  <div v-if="feedbackState === 'correct'" class="glass-card bg-[#2d6a4f]/10 p-3.5 text-center rounded-xl border border-[#2d6a4f]/20">
                    <div class="text-xl mb-1">✅ Correcto!</div>
                    <div class="text-sm text-[#4a4a5e] font-medium">
                      {{ direction === 'zh2pt' ? currentReviewWord.zh + ' = ' + currentReviewWord.pt : currentReviewWord.pt + ' = ' + currentReviewWord.zh }}
                    </div>
                    <div class="text-xs text-[#2d6a4f] mt-1">Estágio {{ Math.min(currentReviewWord.stage + 1, 5) }}/5 na próxima</div>
                  </div>
                  <div v-else class="glass-card bg-[#c1121f]/10 p-3.5 text-center rounded-xl border border-[#c1121f]/20">
                    <div class="text-xl mb-1">❌ Ainda errado</div>
                    <div class="text-sm text-[#4a4a5e]">
                      Resposta correcta: <strong class="text-[#1a1a2e]">{{ direction === 'zh2pt' ? currentReviewWord.pt : currentReviewWord.zh }}</strong>
                    </div>
                    <div class="text-xs text-[#c1121f] mt-1">Estágio reiniciado para 0</div>
                  </div>
                </div>

                <div class="flex gap-3">
                  <button v-if="!feedbackState" @click="checkReviewAnswer" class="btn-primary flex-1 py-3 text-base font-semibold" style="min-height:50px">
                    <i data-lucide="check" class="w-5 h-5 inline mr-1"></i> Verificar
                  </button>
                  <button v-if="feedbackState" @click="nextReviewWord" class="btn-primary flex-1 py-3 text-base font-semibold" style="min-height:50px">
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
      // Review practice state
      practiceActive: false,
      currentIndex: 0,
      reviewWords: [],
      userAnswer: '',
      feedbackState: null,
      correctInRound: 0,
      reviewResults: { correct: 0, wrong: 0, percent: 0 },
      roundCompleted: false,
    }
  },
  computed: {
    /** All wrong words in PTStore */
    allWrongWords() {
      return PTStore.data.wrong_words || []
    },
    /** Due wrong words (Ebbinghaus spaced repetition) */
    dueWords() {
      return PTStore.getDueWrongWords()
    },
    /** Total count of distinct wrong words */
    totalWrongCount() {
      return PTStore.getWrongWordCount()
    },
    /** Current review word */
    currentReviewWord() {
      return this.reviewWords[this.currentIndex] || null
    },
    reviewResultsEmoji() {
      const p = this.reviewResults.percent
      if (p >= 90) return '🏆'
      if (p >= 70) return '🎉'
      if (p >= 50) return '👍'
      return '💪'
    },
    reviewResultsColor() {
      const p = this.reviewResults.percent
      if (p >= 70) return 'text-[#2d6a4f]'
      if (p >= 50) return 'text-[#d4a843]'
      return 'text-[#c1121f]'
    },
  },
  methods: {
    toggleDirection() {
      this.direction = this.direction === 'zh2pt' ? 'pt2zh' : 'zh2pt'
    },

    /** Start a review session with due words */
    startReview() {
      const due = this.dueWords
      if (due.length === 0) return
      const shuffled = [...due].sort(() => Math.random() - 0.5)
      this.reviewWords = shuffled.slice(0, Math.min(20, shuffled.length))
      this.currentIndex = 0
      this.correctInRound = 0
      this.reviewResults = { correct: 0, wrong: 0, percent: 0 }
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

    /** Check the current review answer */
    checkReviewAnswer() {
      if (!this.currentReviewWord || this.feedbackState) return
      const userAns = this.userAnswer.trim()
      if (!userAns) return
      const correctAns = this.direction === 'zh2pt' ? this.currentReviewWord.pt : this.currentReviewWord.zh
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
        this.reviewResults.correct++
        // Advance Ebbinghaus stage
        PTStore.correctReview(this.currentReviewWord.pt, dirKey)
      } else {
        this.feedbackState = 'wrong'
        this.reviewResults.wrong++
        // Reset Ebbinghaus stage
        PTStore.wrongReview(this.currentReviewWord.pt, dirKey)
      }
    },

    nextReviewWord() {
      if (this.currentIndex < this.reviewWords.length - 1) {
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
        this.reviewResults.percent = this.reviewWords.length > 0
          ? Math.round((this.reviewResults.correct / this.reviewWords.length) * 100) : 0
        this.roundCompleted = true
      }
    },

    cancelPractice() {
      this.practiceActive = false
      this.roundCompleted = false
      this.feedbackState = null
      this.userAnswer = ''
      this.reviewWords = []
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
