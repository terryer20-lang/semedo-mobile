/**
 * components/ErrosView.js — 錯題本（手機版）
 */
const ErrosView = {
  template: `
    <div class="anim-fade-up pb-4">

      <div v-if="total === 0" class="glass-card-strong p-8 text-center">
        <i data-lucide="check-circle" class="w-12 h-12 mx-auto text-certo mb-3"></i>
        <p class="text-base font-bold text-slate-800 mb-1">Nenhum erro!</p>
        <p class="text-xs text-slate-500 mb-4">Os erros aparecerão após as rondas de vocabulário.</p>
        <button @click="goToPraticar" class="py-2.5 px-5 btn-primary text-sm font-medium">Ir para Praticar</button>
      </div>

      <div v-if="total > 0">
        <!-- Stats -->
        <div class="glass-card p-3.5 text-center mb-3">
          <p class="text-2xl font-bold text-slate-800">{{ total }}</p>
          <p class="text-xs text-slate-500">Palavras erradas</p>
        </div>

        <!-- Mode -->
        <div class="glass-card p-3.5 mb-3">
          <label class="text-xs text-slate-500 font-medium mb-2 block">Direção</label>
          <div class="flex gap-2">
            <button @click="mode='zh2pt'"
                    :class="['flex-1 py-2.5 rounded-lg text-xs font-medium transition border',
                      mode==='zh2pt' ? 'bg-azulejo/8 border-azulejo/25 text-azulejo' : 'btn-glass text-slate-500']">
              Chinês → Português
            </button>
            <button @click="mode='pt2zh'"
                    :class="['flex-1 py-2.5 rounded-lg text-xs font-medium transition border',
                      mode==='pt2zh' ? 'bg-azulejo/8 border-azulejo/25 text-azulejo' : 'btn-glass text-slate-500']">
              Português → Chinês
            </button>
          </div>
        </div>

        <button @click="startReview" :disabled="due===0"
                class="w-full py-3 btn-primary text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40">
          <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
          Rever ({{ due }} palavra{{ due!==1?'s':'' }})
        </button>
        <p v-if="due===0 && total>0" class="text-xs text-slate-400 mt-2 text-center">Todas revistas. Volte mais tarde.</p>
      </div>
    </div>
  `,
  data() { return { mode: 'pt2zh' } },
  computed: {
    total() { return PTStore.data.wrong_words.length },
    due() { return PTStore.getDueWrongWords().length },
  },
  methods: {
    startReview() {
      const due = PTStore.getDueWrongWords()
      if (!due.length) return
      PTStore.logActivity()
      const data = { words: due, mode: this.mode, timestamp: Date.now() }
      localStorage.setItem('ERROS_CURRENT_ROUND', JSON.stringify(data))
      window.open('erros_exam.html', '_blank')
    },
    goToPraticar() { if (window.__NAV__) window.__NAV__('praticar') },
  },
  mounted() { this.$nextTick(() => lucide.createIcons()) },
  updated() { this.$nextTick(() => lucide.createIcons()) },
}
