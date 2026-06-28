/**
 * utils/animation.js — GSAP 動畫工具
 *
 * 功能：
 * - 視圖進場交錯動畫
 * - 數字滾動動畫（count-up）
 * - 卡片交錯彈出
 */
const Anim = (() => {
  // ─── 默認 GSAP 設定 ───
  function setup() {
    if (typeof gsap === 'undefined') return
    gsap.defaults({
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  // ─── 視圖進場：fade + slide up，交錯 ───
  function enterView(container, stagger = 0.05) {
    if (typeof gsap === 'undefined') return
    const el = typeof container === 'string' ? document.querySelector(container) : container
    if (!el) return
    // 找到所有需要動畫的子元素
    const items = el.querySelectorAll('.anim-enter, .glass-card, .glass-card-strong, [class*="anim-enter"]')
    if (items.length === 0) {
      // 整個容器淡入
      gsap.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3 })
      return
    }
    // 先隱藏所有項
    gsap.set(items, { autoAlpha: 0, y: 16 })
    // 交錯彈入
    gsap.to(items, {
      autoAlpha: 1,
      y: 0,
      duration: 0.35,
      stagger,
      ease: 'power2.out',
    })
  }

  // ─── 數字滾動（count-up） ───
  function countUp(el, target, suffix = '', duration = 0.8) {
    if (typeof gsap === 'undefined') return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val) + suffix
      },
    })
  }

  // ─── 按鈕點擊彈性反饋 ───
  function pressFeedback(el) {
    if (typeof gsap === 'undefined') return
    gsap.fromTo(el, { scale: 0.93 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' })
  }

  // ─── 卡片懸浮效果（滑入時） ───
  function cardStagger(containerSelector, delayBetween = 0.04) {
    if (typeof gsap === 'undefined') return
    const cards = document.querySelectorAll(containerSelector + ' .glass-card, ' + containerSelector + ' .glass-card-strong')
    if (cards.length === 0) return
    gsap.set(cards, { autoAlpha: 0, y: 20 })
    gsap.to(cards, {
      autoAlpha: 1,
      y: 0,
      duration: 0.35,
      stagger: delayBetween,
      ease: 'power2.out',
    })
  }

  // ─── 初始化 ───
  setup()

  // ─── 全局按鈕點擊反饋 ───
  function initGlobal() {
    if (typeof gsap === 'undefined') return
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-click, .btn-glow')
      if (btn) {
        gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.2, ease: 'back.out(2)', overwrite: 'auto' })
      }
    })
  }
  initGlobal()

  return { setup, enterView, countUp, pressFeedback, cardStagger }
})()
