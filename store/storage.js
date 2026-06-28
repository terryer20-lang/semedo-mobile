/**
 * store/storage.js — LocalStorage 讀寫 + 全局 reactive PTStore
 */
const Storage = (() => {
  const KEY = 'PT_LEARNING_DATA'

  const DEFAULT_DATA = {
    config: { deepseekKey: '', cefrLevel: 'C1', userName: 'Utilizador' },
    wrong_rewrites: [],
    favorite_connectors: [],
    exam_history: [],
    news_cache: { last_fetch: null, items: {} },
    wrong_words: [],   // 艾賓浩斯錯題本
    my_vocab_zh2pt: [],  /* Vocabulario meu: Chines -> Portugues */
    my_vocab_pt2zh: [],  /* Vocabulario meu: Portugues -> Chines */
    study_log: {},       // { '2026-06-18': { minutes: 12, last_active: ISO } }
    practice_log: [],    // [{ timestamp: ISO, pt, direction }] 逐詞練習記錄
    favorites: [],       // [{ type: 'dicionario'|'expressao', pt, zh, src }]
    dictation_history: [], // [{ id, date, level, audioName, transcript, draft }]
    leitura_history: [],  // [{ id, date, textPreview, notesCount, wordCount }]
  }

  function init() {
    // 清除練習記錄（?reset_pratica=1）
    if (location.search.includes('reset_pratica=1')) {
      const empty = JSON.parse(JSON.stringify(DEFAULT_DATA))
      // Preserve config and exam_history
      const oldRaw = localStorage.getItem(KEY)
      if (oldRaw) {
        try {
          const old = JSON.parse(oldRaw)
          empty.config = old.config || empty.config
          empty.exam_history = old.exam_history || empty.exam_history
          empty.news_cache = old.news_cache || empty.news_cache
          empty.favorite_connectors = old.favorite_connectors || empty.favorite_connectors
        } catch {}
      }
      localStorage.setItem(KEY, JSON.stringify(empty))
      // Clean URL without reload
      if (history.replaceState) history.replaceState(null, '', location.pathname)
      return JSON.parse(JSON.stringify(empty))
    }

    const raw = localStorage.getItem(KEY)
    if (!raw) { localStorage.setItem(KEY, JSON.stringify(DEFAULT_DATA)); return JSON.parse(JSON.stringify(DEFAULT_DATA)) }
    try {
      const data = JSON.parse(raw)
      let changed = false
      for (const k of Object.keys(DEFAULT_DATA)) {
        if (!(k in data)) { data[k] = JSON.parse(JSON.stringify(DEFAULT_DATA[k])); changed = true }
      }
      if (changed) saveRaw(data)
      return data
    } catch (e) {
      localStorage.setItem(KEY, JSON.stringify(DEFAULT_DATA))
      return JSON.parse(JSON.stringify(DEFAULT_DATA))
    }
  }

  function saveRaw(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)) }
    catch (e) {
      if (e.name === 'QuotaExceededError') {
        if (data.exam_history?.length > 5) data.exam_history = data.exam_history.slice(-5)
        if (data.news_cache?.items && typeof data.news_cache.items === 'object') {
          // Trim each source's items to last 20
          for (const k of Object.keys(data.news_cache.items)) {
            if (data.news_cache.items[k].length > 20) data.news_cache.items[k] = data.news_cache.items[k].slice(-20)
          }
        }
        try { localStorage.setItem(KEY, JSON.stringify(data)) } catch (_) {}
      }
    }
  }

  return { KEY, DEFAULT_DATA, init, saveRaw }
})()

// ─── 艾賓浩斯間隔（天） ───
const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30]

// ─── Global Reactive Store ───
const PTStore = Vue.reactive({
  data: Storage.init(),

  save() {
    Storage.saveRaw(this.data)
    // 同步標記（SyncManager 加載後生效）
    if (typeof SyncManager !== 'undefined' && SyncManager.markDirty) {
      SyncManager.markDirty('vocab')
      SyncManager.markDirty('wrong_words')
      SyncManager.markDirty('favorites')
      SyncManager.markDirty('stats')
    }
  },

  /* ─── 艾賓浩斯錯題本 ─── */
  /** 記錄一條錯題 */
  logWrongWord(pt, zh, pos, direction) {
    const now = new Date().toISOString()
    const existing = this.data.wrong_words.find(w => w.pt === pt)
    const entry = {
      pt, zh, pos: pos || '',
      wrong_count: 1,
      correct_count: 0,
      stage: 0,
      last_review: now,
      next_review: now,
      history: [{ date: now, direction, action: 'wrong' }],
    }
    if (existing) {
      existing.wrong_count++
      existing.stage = 0
      existing.last_review = now
      existing.next_review = now
      existing.history.push({ date: now, direction, action: 'wrong' })
      // Keep only last 20 history entries
      if (existing.history.length > 20) existing.history = existing.history.slice(-20)
    } else {
      this.data.wrong_words.unshift(entry)
    }
    this.save()
  },

  /** 錯題本中正確複習（推進階段） */
  correctReview(pt, direction) {
    const w = this.data.wrong_words.find(x => x.pt === pt)
    if (!w) return
    const now = new Date().toISOString()
    w.correct_count++
    w.stage = Math.min(w.stage + 1, EBBINGHAUS_INTERVALS.length - 1)
    w.last_review = now
    w.next_review = this._ebbinghausDate(w.stage)
    w.history.push({ date: now, direction, action: 'correct' })
    if (w.history.length > 20) w.history = w.history.slice(-20)
    this.save()
  },

  /** 錯題本中錯誤複習（重置階段） */
  wrongReview(pt, direction) {
    const w = this.data.wrong_words.find(x => x.pt === pt)
    if (!w) return
    const now = new Date().toISOString()
    w.wrong_count++
    w.stage = 0
    w.last_review = now
    w.next_review = this._ebbinghausDate(0)
    w.history.push({ date: now, direction, action: 'wrong' })
    if (w.history.length > 20) w.history = w.history.slice(-20)
    this.save()
  },

  /** 取得今日待複習的錯題 */
  getDueWrongWords() {
    const now = new Date()
    return this.data.wrong_words.filter(w => {
      if (!w.next_review) return true
      // 若最後一次動作為 'wrong'（新標記或複習時又錯），立即待複習
      const lastAction = w.history?.[w.history.length - 1]?.action
      if (lastAction === 'wrong') return true
      return new Date(w.next_review) <= now
    })
  },

  /** 取得總錯題數 */
  getWrongWordCount() {
    return this.data.wrong_words.length
  },

  _ebbinghausDate(stage) {
    const d = new Date()
    d.setDate(d.getDate() + EBBINGHAUS_INTERVALS[Math.min(stage, EBBINGHAUS_INTERVALS.length - 1)])
    return d.toISOString()
  },

  /* ─── 我的詞庫（分方向） ─── */
  /** 加入已記住的詞（zh2pt / pt2zh） */
  addToMyVocab(pt, zh, pos, direction) {
    const key = direction === 'pt2zh' ? 'my_vocab_pt2zh' : 'my_vocab_zh2pt'
    const exists = this.data[key].find(v => v.pt === pt)
    if (!exists) {
      this.data[key].push({ pt, zh, pos: pos || '', added: new Date().toISOString() })
      this.save()
    }
  },
  /** 從指定方向詞庫移除（忘記時） */
  removeFromMyVocab(pt, direction) {
    const key = direction === 'pt2zh' ? 'my_vocab_pt2zh' : 'my_vocab_zh2pt'
    const idx = this.data[key].findIndex(v => v.pt === pt)
    if (idx >= 0) { this.data[key].splice(idx, 1); this.save() }
  },
  /** 是否在任一詞庫 */
  isInMyVocab(pt) {
    return this.data.my_vocab_zh2pt.some(v => v.pt === pt) || this.data.my_vocab_pt2zh.some(v => v.pt === pt)
  },
  /** 在指定方向詞庫中 */
  isInMyVocabDir(pt, direction) {
    const key = direction === 'pt2zh' ? 'my_vocab_pt2zh' : 'my_vocab_zh2pt'
    return this.data[key].some(v => v.pt === pt)
  },
  /** 詞庫總數（兩方向聯集） */
  getMyVocabCount() {
    const all = new Set()
    this.data.my_vocab_zh2pt.forEach(v => all.add(v.pt))
    this.data.my_vocab_pt2zh.forEach(v => all.add(v.pt))
    return all.size
  },
  /** 取得指定方向的詞庫聯集（附標記） */
  getMyVocabForDirection(direction) {
    const key = direction === 'pt2zh' ? 'my_vocab_pt2zh' : 'my_vocab_zh2pt'
    return this.data[key]
  },
  /** 取得兩方向聯集 */
  getMyVocabUnion() {
    const map = new Map()
    this.data.my_vocab_zh2pt.forEach(v => map.set(v.pt, { ...v, dir: 'zh2pt' }))
    this.data.my_vocab_pt2zh.forEach(v => {
      if (!map.has(v.pt)) map.set(v.pt, { ...v, dir: 'pt2zh' })
    })
    return Array.from(map.values())
  },

  /* ─── Exam History ─── */
  saveExamResult(exam) {
    this.data.exam_history.unshift({
      id: 'ex_' + Date.now(),
      date: new Date().toISOString(),
      ...exam,
    })
    // Keep max 10 full exams (with questions)
    if (this.data.exam_history.length > 10) this.data.exam_history = this.data.exam_history.slice(0, 10)
    this.save()
  },
  getExamHistory() { return this.data.exam_history },
  getExamById(id) { return this.data.exam_history.find(e => e.id === id) },

  /* ─── Conectores ─── */
  toggleFavConnector(word) {
    const idx = this.data.favorite_connectors.indexOf(word)
    if (idx >= 0) this.data.favorite_connectors.splice(idx, 1)
    else this.data.favorite_connectors.push(word)
    this.save()
  },
  isFavConnector(word) {
    return this.data.favorite_connectors.includes(word)
  },

  /* ─── Config ─── */
  updateConfig(patch) { Object.assign(this.data.config, patch); this.save() },

  /* ─── Favoritos ─── */
  toggleFavorite(item) {
    // item: { type: 'dicionario'|'expressao', pt, zh, src }
    const key = item.pt + '|' + (item.src || '')
    const idx = this.data.favorites.findIndex(f => (f.pt + '|' + (f.src || '')) === key)
    if (idx >= 0) { this.data.favorites.splice(idx, 1); this.save(); return false }
    else { this.data.favorites.push({ ...item }); this.save(); return true }
  },
  isFavorite(item) {
    const key = item.pt + '|' + (item.src || '')
    return this.data.favorites.some(f => (f.pt + '|' + (f.src || '')) === key)
  },
  getFavorites() { return this.data.favorites },

  /* ─── Ditados ─── */
  saveDictation(entry) {
    // entry: { id, level, audioName, transcript, draft }
    const existing = this.data.dictation_history.findIndex(e => e.id === entry.id)
    if (existing >= 0) {
      this.data.dictation_history[existing] = { ...this.data.dictation_history[existing], ...entry }
    } else {
      this.data.dictation_history.unshift(entry)
    }
    this.save()
  },
  getDictationHistory() { return this.data.dictation_history },
  getDictationById(id) { return this.data.dictation_history.find(e => e.id === id) },
  deleteDictation(id) {
    this.data.dictation_history = this.data.dictation_history.filter(e => e.id !== id)
    this.save()
  },

  /* ─── Leitura History ─── */
  saveLeituraHistory(entry) {
    if (!this.data.leitura_history) this.data.leitura_history = []
    this.data.leitura_history.unshift({
      id: 'lei_' + Date.now(),
      date: new Date().toISOString(),
      ...entry,
    })
    if (this.data.leitura_history.length > 20) this.data.leitura_history = this.data.leitura_history.slice(0, 20)
    this.save()
  },
  getLeituraHistory() {
    return this.data.leitura_history || []
  },

  /* ─── 學習統計 ─── */
  _todayKey() {
    const d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
  },
  logActivity() {
    const key = this._todayKey()
    if (!this.data.study_log[key]) {
      this.data.study_log[key] = { minutes: 0, last_active: new Date().toISOString() }
    }
    const entry = this.data.study_log[key]
    const now = new Date()
    const last = entry.last_active ? new Date(entry.last_active) : new Date(0)
    const diffSeconds = (now - last) / 1000
    // 每 30 秒以上無操作才計 1 分鐘（避免 spam）
    if (diffSeconds >= 30) {
      entry.minutes = (entry.minutes || 0) + 1
      entry.last_active = now.toISOString()
      this.save()
    }
  },
  /** 記錄今日背誦單詞數（同一字詞每日只計一次），並記錄逐詞時間戳 */
  logWordPractice(pt, direction, count = 1) {
    const key = this._todayKey()
    if (!this.data.study_log[key]) {
      this.data.study_log[key] = { minutes: 0, words: 0, last_active: new Date().toISOString() }
    }
    // 每日去重：同一字詞（pt+direction）只計一次
    const dedupKey = pt + '|' + (direction || '')
    if (!this.data.study_log[key]._seen) this.data.study_log[key]._seen = {}
    if (!this.data.study_log[key]._seen[dedupKey]) {
      this.data.study_log[key]._seen[dedupKey] = true
      this.data.study_log[key].words = (this.data.study_log[key].words || 0) + count
    }
    // 逐詞練習記錄（保留所有提交記錄用於近一小時查詢）
    if (pt) {
      this.data.practice_log.push({ timestamp: new Date().toISOString(), pt, direction })
    }
    // 保留最近 2000 條以防膨脹
    if (this.data.practice_log.length > 2000) {
      this.data.practice_log = this.data.practice_log.slice(-2000)
    }
    this.save()
  },
  /** 取得今日背誦單詞數 */
  getTodayWords() {
    const key = this._todayKey()
    return this.data.study_log[key]?.words || 0
  },
  /** 取得近一小時練習單詞數 */
  getLastHourWords() {
    const cutoff = Date.now() - 3600000
    return this.data.practice_log.filter(e => new Date(e.timestamp).getTime() >= cutoff).length
  },
  getTodayMinutes() {
    const key = this._todayKey()
    return this.data.study_log[key]?.minutes || 0
  },
  getStreakDays() {
    const today = new Date()
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
      if (this.data.study_log[key]) { streak++ }
      else { break }
    }
    return streak
  },
})
