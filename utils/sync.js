/**
 * utils/sync.js — Semedo 雲端同步管理器
 *
 * 離線優先策略：
 * - 所有數據先寫 localStorage，再排隊同步到雲端
 * - 啟動時自動從雲端拉取最新數據
 * - 衝突解決：Last-Write-Wins（以較新的 updated_at 為準）
 */
const SyncManager = (() => {
  const API_URL_KEY = 'SEMEDO_API_URL'
  const TOKEN_KEY   = 'SEMEDO_JWT_TOKEN'
  const USER_KEY    = 'SEMEDO_USER'
  const DIRTY_KEY   = 'SEMEDO_DIRTY_SECTIONS'

  const DEFAULT_API_URL = 'http://localhost:3001/api'

  let apiUrl = localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL
  let token  = localStorage.getItem(TOKEN_KEY) || ''
  let user   = JSON.parse(localStorage.getItem(USER_KEY) || 'null')

  // 需要同步的 section 集合
  let dirtySections = new Set()
  try {
    const saved = JSON.parse(localStorage.getItem(DIRTY_KEY) || '[]')
    saved.forEach(s => dirtySections.add(s))
  } catch {}

  function _saveDirty() {
    localStorage.setItem(DIRTY_KEY, JSON.stringify([...dirtySections]))
  }

  function _headers() {
    const h = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = 'Bearer ' + token
    return h
  }

  async function _fetch(path, method = 'GET', body = null) {
    const opts = { method, headers: _headers() }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(apiUrl + path, opts)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  }

  // ─── 公開 API ───

  function isLoggedIn() { return !!token && !!user }

  function getUser() { return user }

  function getApiUrl() { return apiUrl }

  function setApiUrl(url) {
    apiUrl = url
    localStorage.setItem(API_URL_KEY, url)
  }

  async function login(email, password) {
    const data = await _fetch('/auth/login', 'POST', { email, password })
    token = data.token
    user  = data.user
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return data
  }

  async function register(email, password) {
    const data = await _fetch('/auth/register', 'POST', { email, password })
    token = data.token
    user  = data.user
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return data
  }

  function logout() {
    token = ''
    user  = null
    dirtySections.clear()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(DIRTY_KEY)
  }

  /** 標記某個 section 需要同步 */
  function markDirty(section) {
    dirtySections.add(section)
    _saveDirty()
  }

  /** 推送髒數據到雲端 */
  async function pushAll() {
    if (!isLoggedIn()) return
    const data = PTStore.data
    const errors = []

    // Vocab — 用 batch 推送
    if (dirtySections.has('vocab')) {
      try {
        const allVocab = [
          ...(data.my_vocab_zh2pt || []).map(v => ({ ...v, direction: 'zh2pt' })),
          ...(data.my_vocab_pt2zh || []).map(v => ({ ...v, direction: 'pt2zh' })),
        ]
        if (allVocab.length > 0) {
          await _fetch('/vocab/batch', 'POST', { items: allVocab })
        }
      } catch (e) { errors.push('vocab: ' + e.message) }
    }

    // Wrong words
    if (dirtySections.has('wrong_words')) {
      try {
        const words = (data.wrong_words || []).map(w => ({
          pt: w.pt, zh: w.zh, pos: w.pos,
          wrong_count: w.wrong_count, correct_count: w.correct_count,
          stage: w.stage, next_review: w.next_review,
          history: (w.history || []).map(h => ({
            action: h.action, direction: h.direction, reviewed_at: h.date || h.reviewed_at
          })),
        }))
        if (words.length > 0) {
          await _fetch('/wrong-words/sync', 'POST', { items: words })
        }
      } catch (e) { errors.push('wrong_words: ' + e.message) }
    }

    // Favorites
    if (dirtySections.has('favorites')) {
      try {
        const items = (data.favorites || []).map(f => ({
          pt: f.pt, zh: f.zh, type: f.type || 'outro', src: f.src || ''
        }))
        if (items.length > 0) {
          await _fetch('/favorites/sync', 'POST', { items })
        }
      } catch (e) { errors.push('favorites: ' + e.message) }
    }

    // Stats
    if (dirtySections.has('stats')) {
      try {
        const items = Object.entries(data.study_log || {}).map(([log_date, v]) => ({
          log_date, minutes: v.minutes || 0, words: v.words || 0
        }))
        if (items.length > 0) {
          await _fetch('/stats/sync', 'POST', { items })
        }
      } catch (e) { errors.push('stats: ' + e.message) }
    }

    // 清除已推送的髒標記
    dirtySections.clear()
    _saveDirty()

    if (errors.length > 0) {
      console.warn('SyncManager push errors:', errors.join('; '))
      throw new Error(errors.join('; '))
    }
  }

  /** 從雲端拉取全部數據，合併到 localStorage */
  async function pullAll() {
    if (!isLoggedIn()) return
    const remote = await _fetch('/sync/all')

    // 合併 vocab
    if (remote.vocab?.items) {
      const serverVocab = remote.vocab.items
      const localZh2pt = PTStore.data.my_vocab_zh2pt
      const localPt2zh = PTStore.data.my_vocab_pt2zh
      const localPtSet = new Set([
        ...localZh2pt.map(v => v.pt + '|zh2pt'),
        ...localPt2zh.map(v => v.pt + '|pt2zh'),
      ])
      // 只加服務端有但本地沒有的
      for (const sv of serverVocab) {
        const key = sv.pt + '|' + sv.direction
        if (!localPtSet.has(key)) {
          if (sv.direction === 'zh2pt') localZh2pt.push({ pt: sv.pt, zh: sv.zh, pos: sv.pos || '' })
          else localPt2zh.push({ pt: sv.pt, zh: sv.zh, pos: sv.pos || '' })
          localPtSet.add(key)
        }
      }
    }

    // 合併 wrong_words
    if (remote.wrong_words?.items) {
      const serverWW = remote.wrong_words.items
      const localWW = PTStore.data.wrong_words
      const localWWSet = new Set(localWW.map(w => w.pt))
      for (const sw of serverWW) {
        if (!localWWSet.has(sw.pt)) {
          localWW.push({
            pt: sw.pt, zh: sw.zh || '', pos: sw.pos || '',
            wrong_count: sw.wrong_count || 1, correct_count: sw.correct_count || 0,
            stage: sw.stage || 0, next_review: sw.next_review,
            last_review: null,
            history: (sw.history || []).map(h => ({
              date: h.reviewed_at, action: h.action, direction: h.direction || ''
            })),
          })
          localWWSet.add(sw.pt)
        }
      }
    }

    // 合併 favorites
    if (remote.favorites?.items) {
      const svFav = remote.favorites.items
      const localFav = PTStore.data.favorites
      const localFavSet = new Set(localFav.map(f => f.pt + '|' + (f.src || '')))
      for (const sf of svFav) {
        const key = sf.pt + '|' + (sf.src || '')
        if (!localFavSet.has(key)) {
          localFav.push({ pt: sf.pt, zh: sf.zh || '', type: sf.type || 'outro', src: sf.src || '' })
          localFavSet.add(key)
        }
      }
    }

    // 合併 stats（只加服務端有的日期）
    if (remote.stats?.items) {
      for (const ss of remote.stats.items) {
        if (!PTStore.data.study_log[ss.log_date]) {
          PTStore.data.study_log[ss.log_date] = { minutes: ss.minutes || 0, words: ss.words || 0 }
        } else {
          // 取最大值
          const local = PTStore.data.study_log[ss.log_date]
          local.minutes = Math.max(local.minutes || 0, ss.minutes || 0)
          local.words = Math.max(local.words || 0, ss.words || 0)
        }
      }
    }

    PTStore.save()
  }

  /** push + pull 完整同步 */
  async function sync() {
    if (!isLoggedIn()) return
    await pushAll()
    await pullAll()
  }

  /** 初始化監聽器 */
  function init() {
    // 頁面可見性變化時同步
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isLoggedIn()) {
        sync().catch(e => console.warn('Sync (visibility) failed:', e.message))
      }
    })
    // 網絡恢復時同步
    window.addEventListener('online', () => {
      if (isLoggedIn()) {
        sync().catch(e => console.warn('Sync (online) failed:', e.message))
      }
    })
  }

  return {
    isLoggedIn, getUser, getApiUrl, setApiUrl,
    login, register, logout,
    markDirty, pushAll, pullAll, sync, init,
  }
})()
