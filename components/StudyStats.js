/**
 * components/StudyStats.js — Compact stats bar for header
 *
 * Displays:
 *  - Today's study minutes (timer icon, GSAP countUp)
 *  - Streak days (flame icon, GSAP countUp)
 *  - Current clock time (HH:MM)
 *
 * Reads from the global PTStore reactive store.
 * Uses Anim.countUp for number animations.
 *
 * Usage:  <StudyStats />
 *         (registers as global Vue component via app.component)
 */

var StudyStats = {
  name: 'StudyStats',
  template: `
    <div class="StudyStats flex items-center gap-2.5 text-xs select-none">
      <!-- Today's minutes -->
      <span class="flex items-center gap-1" title="Minutos hoje">
        <i data-lucide="timer" class="w-3.5 h-3.5 text-azulejo"></i>
        <span ref="minutesEl" class="font-semibold tabular-nums text-gray-700 min-w-[1.2em] text-right">
          {{ todayMinutes }}
        </span>
        <span class="text-gray-400 hidden sm:inline">min</span>
      </span>

      <!-- Streak -->
      <span class="flex items-center gap-1" title="Sequência de dias">
        <i data-lucide="flame" class="w-3.5 h-3.5 text-amber-500"></i>
        <span ref="streakEl" class="font-semibold tabular-nums text-gray-700 min-w-[1.2em] text-right">
          {{ streakDays }}
        </span>
      </span>

      <!-- Clock -->
      <span
        ref="clockEl"
        class="text-gray-500 font-medium tabular-nums border-l border-gray-200/60 pl-2"
      >{{ clockTime }}</span>
    </div>
  `,

  data() {
    return {
      clockTime: '',
      _clockTimer: null,
      _visHandler: null,
    }
  },

  /**
   * Computed properties read from the global PTStore reactive object.
   * Vue tracks the reactive reads automatically, so these re-compute
   * whenever PTStore.data.study_log changes (e.g. after logActivity).
   */
  computed: {
    todayMinutes() {
      return typeof PTStore !== 'undefined' ? PTStore.getTodayMinutes() : 0
    },
    streakDays() {
      return typeof PTStore !== 'undefined' ? PTStore.getStreakDays() : 0
    },
  },

  watch: {
    todayMinutes(n) {
      this._animateNumber(this.$refs.minutesEl, n)
    },
    streakDays(n) {
      this._animateNumber(this.$refs.streakEl, n)
    },
  },

  mounted() {
    this.updateClock()
    this._clockTimer = setInterval(() => this.updateClock(), 30000)

    // Re-sync clock immediately on visibility change (user returns to tab)
    this._visHandler = () => {
      if (document.visibilityState === 'visible') this.updateClock()
    }
    document.addEventListener('visibilitychange', this._visHandler)

    // Animate initial values on mount
    this.$nextTick(() => {
      if (this.$refs.minutesEl) this._animateNumber(this.$refs.minutesEl, this.todayMinutes)
      if (this.$refs.streakEl) this._animateNumber(this.$refs.streakEl, this.streakDays)
      // Render Lucide icons inside this component
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons()
    })
  },

  updated() {
    this.$nextTick(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons()
    })
  },

  beforeUnmount() {
    clearInterval(this._clockTimer)
    if (this._visHandler) {
      document.removeEventListener('visibilitychange', this._visHandler)
    }
  },

  methods: {
    /** Update the HH:MM clock display */
    updateClock() {
      const d = new Date()
      this.clockTime =
        String(d.getHours()).padStart(2, '0') +
        ':' +
        String(d.getMinutes()).padStart(2, '0')
    },

    /** GSAP countUp animation (safe no-op if Anim unavailable) */
    _animateNumber(el, target) {
      if (!el) return
      if (typeof Anim !== 'undefined' && Anim.countUp) {
        Anim.countUp(el, target)
      } else {
        el.textContent = target
      }
    },
  },
}

// Make available globally for the parent component
if (typeof window !== 'undefined') window.StudyStats = StudyStats
