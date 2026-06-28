/**
 * utils/diacritics.js — 變音符號正規化
 * PT-PT 專用：處理 á, à, â, ã, ç, é, ê, í, ó, ô, õ, ú
 */
const Diacritics = (() => {
  /** 移除變音符號 → 基礎字母 */
  function strip(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c')   // cedilha → c
  }

  /** 正規化為小寫無變音（用於寬鬆比對） */
  function normalize(str) {
    return strip(str).toLowerCase().trim()
  }

  /** 嚴格比對：忽略大小寫，但保留變音符號 */
  function strict(a, b) {
    return a.trim().toLowerCase() === b.trim().toLowerCase()
  }

  /** 寬鬆比對：忽略大小寫與變音符號 */
  function loose(a, b) {
    return normalize(a) === normalize(b)
  }

  /** 
   * 雙層比對：回傳 { match: 'strict' | 'loose' | 'none', hint: string }
   * strict: 完全正確（含變音符號）
   * loose: 字母正確但變音符號有誤
   * none: 不匹配
   */
  function compare(userInput, correctAnswer) {
    if (strict(userInput, correctAnswer)) {
      return { match: 'strict', hint: '' }
    }
    if (loose(userInput, correctAnswer)) {
      // 找出哪裡的變音符號不對
      const u = strip(userInput).toLowerCase()
      const c = strip(correctAnswer).toLowerCase()
      if (u === c) {
        return { match: 'loose', hint: '⚠️ Atenção aos diacríticos!' }
      }
      return { match: 'none', hint: '' }
    }
    return { match: 'none', hint: '' }
  }

  return { strip, normalize, strict, loose, compare }
})()
