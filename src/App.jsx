import { useState, useEffect, useRef } from 'react'
import colloquia from './data/colloquia.json'
import { lookupLS } from './lookup'

const BOOKMARK_KEY = 'erasmus-bookmark'
const SCROLL_KEY = 'erasmus-scroll-'
const FONT_KEY = 'erasmus-fontsize'

function loadBookmark() {
  try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) } catch { return null }
}

export default function App() {
  const [selected, setSelected] = useState(null)
  const [popup, setPopup] = useState(null)
  const [search, setSearch] = useState('')
  const [fontSize, setFontSize] = useState(() =>
    parseInt(localStorage.getItem(FONT_KEY)) || 20
  )
  const containerRef = useRef(null)
  const popupRef = useRef(null)
  const bookmark = loadBookmark()

  // Close popup on outside tap
  useEffect(() => {
    function handler(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setPopup(null)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  // Restore scroll on open
  useEffect(() => {
    if (!selected) return
    const saved = sessionStorage.getItem(SCROLL_KEY + selected.id)
    if (saved && containerRef.current) containerRef.current.scrollTop = parseInt(saved)
    return () => {
      if (containerRef.current)
        sessionStorage.setItem(SCROLL_KEY + selected.id, containerRef.current.scrollTop)
    }
  }, [selected])

  useEffect(() => { localStorage.setItem(FONT_KEY, fontSize) }, [fontSize])

  function open(c) { setSelected(c); setPopup(null); setSearch('') }

  function handleWordTap(e, word) {
    e.stopPropagation()
    const clean = word.replace(/[.,;:!?"""''()[\]{}<>«»—–\-\/\\0-9]/g, '')
    if (!clean) return
    const ls = lookupLS(clean)
    const rect = e.currentTarget.getBoundingClientRect()
    const cr = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
    setPopup({
      clean,
      ls,
      x: rect.left - cr.left + rect.width / 2,
      y: rect.bottom - cr.top + 8,
    })
  }

  function handleLSWordTap(word) {
    const clean = word.replace(/[.,;:!?"""''()[\]{}<>«»—–\-\/\\0-9]/g, '')
    if (!clean) return
    const ls = lookupLS(clean)
    setPopup(prev => prev ? { ...prev, clean, ls } : prev)
  }

  function saveBookmark() {
    if (!selected) return
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify({
      id: selected.id, title: selected.title,
      scroll: containerRef.current?.scrollTop || 0,
    }))
  }

  function goToBookmark() {
    if (!bookmark) return
    const c = colloquia.find(x => x.id === bookmark.id)
    if (!c) return
    setSelected(c); setPopup(null)
    setTimeout(() => {
      if (containerRef.current) containerRef.current.scrollTop = bookmark.scroll || 0
    }, 50)
  }

  const filtered = search
    ? colloquia.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : colloquia

  // ── Table of Contents ─────────────────────────────────
  if (!selected) {
    return (
      <div className="app">
        <header className="toc-header">
          <h1>Colloquia Familiaria</h1>
          <p className="subtitle">Desiderius Erasmus Roterodamus</p>
        </header>
        <div className="toc-controls">
          <input type="text" placeholder="Search colloquia..." value={search}
            onChange={e => setSearch(e.target.value)} className="search-input" />
        </div>
        {bookmark && (
          <button className="bookmark-btn" onClick={goToBookmark}>
            Continue: <em>{bookmark.title}</em>
          </button>
        )}
        <div className="toc-list">
          {filtered.map(c => (
            <button key={c.id} className="toc-item" onClick={() => open(c)}>
              <span className="toc-title">{c.title}</span>
              <span className="toc-words">{c.wordCount.toLocaleString()} words</span>
            </button>
          ))}
        </div>
        <footer className="toc-footer">
          <p>66 colloquia &middot; {colloquia.reduce((s, c) => s + c.wordCount, 0).toLocaleString()} words</p>
          <p className="credit">Text: Wikisource (Holtze 1892) &middot; Dictionary: Lewis &amp; Short</p>
        </footer>
      </div>
    )
  }

  // ── Reader ────────────────────────────────────────────
  return (
    <div className="app">
      <div className="reader-toolbar">
        <button className="toolbar-btn" onClick={() => { saveBookmark(); setSelected(null); setPopup(null) }}>
          &#8592; Back
        </button>
        <h2 className="reader-title">{selected.title}</h2>
        <div className="font-controls">
          <button className="toolbar-btn" onClick={() => setFontSize(s => Math.max(14, s - 2))}>A&minus;</button>
          <button className="toolbar-btn" onClick={() => setFontSize(s => Math.min(32, s + 2))}>A+</button>
        </div>
      </div>

      <div className="reader-body" ref={containerRef} onClick={() => setPopup(null)}>
        <TextBody text={selected.text} fontSize={fontSize} onWordTap={handleWordTap} />

        {popup && (
          <div ref={popupRef} className="popup popup-expanded"
            onClick={e => e.stopPropagation()} style={{
            left: '8px',
            top: `${popup.y}px`,
            width: 'calc(100% - 16px)',
          }}>
            <div className="popup-word">{popup.clean}</div>
            {popup.ls ? popup.ls.slice(0, 3).map((entry, i) => (
              <div key={i} className="ls-entry">
                <div className="ls-head">
                  <span className="ls-orth">{entry.o}</span>
                  {entry.p && <span className="ls-pos">{entry.p}</span>}
                </div>
                {entry.n && <div className="ls-notes"><ClickableText text={entry.n} onWordTap={handleLSWordTap} /></div>}
                <div className="ls-senses"><ClickableText text={entry.s} onWordTap={handleLSWordTap} /></div>
              </div>
            )) : <div className="popup-def"><em>No entry found</em></div>}
          </div>
        )}
      </div>
    </div>
  )
}

function ClickableText({ text, onWordTap }) {
  if (!text) return null
  return text.split(/(\s+)/).map((seg, i) => {
    if (/^\s+$/.test(seg)) return <span key={i}>{seg}</span>
    const letters = seg.replace(/[^a-zA-ZāēīōūĀĒĪŌŪăĕĭŏŭ]/g, '')
    if (letters.length >= 2) {
      return (
        <span key={i} className="ls-word" role="button" tabIndex={0}
          onClick={e => { e.stopPropagation(); onWordTap(seg) }}
          onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); onWordTap(seg) }}
        >{seg}</span>
      )
    }
    return <span key={i}>{seg}</span>
  })
}

function TextBody({ text, fontSize, onWordTap }) {
  return (
    <div className="latin-text" style={{ fontSize: `${fontSize}px` }}>
      {text.split('\n').map((line, li) => {
        if (!line.trim()) return <div key={li} className="blank-line" />
        const sm = line.match(/^([A-Za-z]{1,4})\.\s/)
        const speaker = sm ? sm[1] : null
        const rest = speaker ? line.slice(sm[0].length) : line
        return (
          <p key={li} className="text-line">
            {speaker && <span className="speaker">{speaker}.</span>}
            {rest.split(/(\s+)/).map((seg, si) =>
              /^\s+$/.test(seg) ? <span key={si}>{seg}</span> : (
                <span key={si} className="word" role="button" tabIndex={0}
                  onTouchEnd={e => { e.preventDefault(); onWordTap(e, seg) }}
                  onClick={e => onWordTap(e, seg)}>{seg}</span>
              )
            )}
          </p>
        )
      })}
    </div>
  )
}
