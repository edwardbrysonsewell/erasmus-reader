import { useState, useEffect, useRef } from 'react'
import colloquia from './data/colloquia.json'
import eutropius from './data/eutropius.json'
import caesar from './data/caesar.json'
import sallust from './data/sallust.json'
import suetonius from './data/suetonius.json'
import nepos from './data/nepos.json'
import poggio from './data/poggio.json'
import bebel from './data/bebel.json'
import cordier from './data/cordier.json'
import vives from './data/vives.json'
import { lookupLS } from './lookup'

const BOOKMARK_KEY = 'reader-bookmark'
const SCROLL_KEY = 'reader-scroll-'
const FONT_KEY = 'erasmus-fontsize'
const LS_ZOOM_KEY = 'erasmus-ls-zoom'
const PAGE_ZOOM_KEY = 'erasmus-page-zoom'

const WORKS = [
  {
    key: 'caesar',
    title: 'Commentarii',
    author: 'C. Iulius Caesar',
    entries: caesar,
    entryLabel: 'libri',
    credit: 'Text: The Latin Library',
    hasSpeakers: false,
  },
  {
    key: 'sallust',
    title: 'Bellum Catilinae & Bellum Iugurthinum',
    author: 'C. Sallustius Crispus',
    entries: sallust,
    entryLabel: 'opera',
    credit: 'Text: The Latin Library',
    hasSpeakers: false,
  },
  {
    key: 'nepos',
    title: 'De Viris Illustribus',
    author: 'Cornelius Nepos',
    entries: nepos,
    entryLabel: 'vitae',
    credit: 'Text: The Latin Library',
    hasSpeakers: false,
  },
  {
    key: 'suetonius',
    title: 'De Vita Caesarum',
    author: 'C. Suetonius Tranquillus',
    entries: suetonius,
    entryLabel: 'vitae',
    credit: 'Text: The Latin Library',
    hasSpeakers: false,
  },
  {
    key: 'poggio',
    title: 'Facetiae',
    author: 'Poggio Bracciolini',
    entries: poggio,
    entryLabel: 'facetiae',
    credit: 'Text: The Latin Library',
    hasSpeakers: false,
  },
  {
    key: 'bebel',
    title: 'Liber Facetiarum',
    author: 'Heinrich Bebel',
    entries: bebel,
    entryLabel: 'facetiae',
    credit: 'Text: The Latin Library',
    hasSpeakers: false,
  },
  {
    key: 'vives',
    title: 'Exercitatio Linguae Latinae',
    author: 'Juan Luis Vives',
    entries: vives,
    entryLabel: 'colloquia',
    credit: 'Text: Archive.org (ed. 1817, OCR)',
    hasSpeakers: false,
  },
  {
    key: 'cordier',
    title: 'Colloquia Scholastica',
    author: 'Mathurin Cordier',
    entries: cordier,
    entryLabel: 'colloquia',
    credit: 'Text: Alexander (1835) / Marsh (2016)',
    hasSpeakers: false,
  },
  {
    key: 'eutropius',
    title: 'Breviarium ab Urbe Condita',
    author: 'Eutropius',
    entries: eutropius,
    entryLabel: 'libri',
    credit: 'Text: The Latin Library',
    hasSpeakers: false,
  },
  {
    key: 'erasmus',
    title: 'Colloquia Familiaria',
    author: 'Desiderius Erasmus Roterodamus',
    entries: colloquia,
    entryLabel: 'colloquia',
    credit: 'Text: Wikisource (Holtze 1892)',
    hasSpeakers: true,
  },
]

function loadBookmark() {
  try {
    const b = JSON.parse(localStorage.getItem(BOOKMARK_KEY))
    if (b && !b.work) b.work = 'erasmus' // backward compat
    return b
  } catch {
    // Try old key for backward compat
    try {
      const b = JSON.parse(localStorage.getItem('erasmus-bookmark'))
      if (b) b.work = 'erasmus'
      return b
    } catch { return null }
  }
}

export default function App() {
  const [work, setWork] = useState(null)
  const [selected, setSelected] = useState(null)
  const [popup, setPopup] = useState(null)
  const [search, setSearch] = useState('')
  const [fontSize, setFontSize] = useState(() =>
    parseInt(localStorage.getItem(FONT_KEY)) || 20
  )
  const [lsZoom, setLsZoom] = useState(() =>
    parseInt(localStorage.getItem(LS_ZOOM_KEY)) || 16
  )
  const [pageZoom, setPageZoom] = useState(() =>
    parseFloat(localStorage.getItem(PAGE_ZOOM_KEY)) || 1
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
    if (!selected || !work) return
    const scrollKey = SCROLL_KEY + work.key + '-' + selected.id
    const saved = sessionStorage.getItem(scrollKey)
    if (saved && containerRef.current) containerRef.current.scrollTop = parseInt(saved)
    return () => {
      if (containerRef.current)
        sessionStorage.setItem(scrollKey, containerRef.current.scrollTop)
    }
  }, [selected, work])

  useEffect(() => { localStorage.setItem(FONT_KEY, fontSize) }, [fontSize])
  useEffect(() => { localStorage.setItem(LS_ZOOM_KEY, lsZoom) }, [lsZoom])
  useEffect(() => { localStorage.setItem(PAGE_ZOOM_KEY, pageZoom) }, [pageZoom])

  // Trackpad pinch-to-zoom (fires as wheel events with ctrlKey on Mac)
  useEffect(() => {
    function handler(e) {
      if (e.ctrlKey) {
        e.preventDefault()
        setPageZoom(z => Math.min(3, Math.max(0.5, z - e.deltaY * 0.01)))
      }
    }
    document.addEventListener('wheel', handler, { passive: false })
    return () => document.removeEventListener('wheel', handler)
  }, [])

  function selectWork(w) { setWork(w); setSelected(null); setPopup(null); setSearch('') }
  function goToLibrary() { setWork(null); setSelected(null); setPopup(null); setSearch('') }
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

  function handleRelatedTap(orth) {
    const ls = lookupLS(orth)
    setPopup(prev => prev ? { ...prev, clean: orth, ls } : prev)
  }

  function saveBookmark() {
    if (!selected || !work) return
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify({
      work: work.key, id: selected.id, title: selected.title,
      scroll: containerRef.current?.scrollTop || 0,
    }))
  }

  function goToBookmark() {
    if (!bookmark) return
    const w = WORKS.find(x => x.key === bookmark.work)
    if (!w) return
    const entry = w.entries.find(x => x.id === bookmark.id)
    if (!entry) return
    setWork(w); setSelected(entry); setPopup(null)
    setTimeout(() => {
      if (containerRef.current) containerRef.current.scrollTop = bookmark.scroll || 0
    }, 50)
  }

  const entries = work ? work.entries : []
  const filtered = search
    ? entries.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : entries

  const zoomStyle = pageZoom !== 1 ? { zoom: pageZoom } : undefined

  // ── Library ──────────────────────────────────────────
  if (!work) {
    return (
      <div className="app" style={zoomStyle}>
        <header className="toc-header">
          <h1>Latin Reader</h1>
          <p className="subtitle">with Lewis &amp; Short dictionary</p>
        </header>
        {bookmark && (
          <button className="bookmark-btn" onClick={goToBookmark}>
            Continue: <em>{bookmark.title}</em>
          </button>
        )}
        <div className="library-list">
          {WORKS.map(w => (
            <button key={w.key} className="library-item" onClick={() => selectWork(w)}>
              <div className="library-title">{w.title}</div>
              <div className="library-author">{w.author}</div>
              <div className="library-meta">
                {w.entries.length} {w.entryLabel} &middot; {w.entries.reduce((s, e) => s + e.wordCount, 0).toLocaleString()} words
              </div>
            </button>
          ))}
        </div>
        <footer className="toc-footer">
          <p className="credit">Dictionary: Lewis &amp; Short (Perseus Digital Library)</p>
        </footer>
      </div>
    )
  }

  // ── Table of Contents ─────────────────────────────────
  if (!selected) {
    return (
      <div className="app" style={zoomStyle}>
        <div className="reader-toolbar">
          <button className="toolbar-btn" onClick={goToLibrary}>&#8592; Library</button>
          <h2 className="reader-title">{work.title}</h2>
          <div style={{ width: '48px' }} />
        </div>
        <header className="toc-header" style={{ paddingTop: '1rem' }}>
          <p className="subtitle">{work.author}</p>
        </header>
        <div className="toc-controls">
          <input type="text" placeholder={`Search ${work.entryLabel}...`} value={search}
            onChange={e => setSearch(e.target.value)} className="search-input" />
        </div>
        {bookmark && bookmark.work === work.key && (
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
          <p>{work.entries.length} {work.entryLabel} &middot; {work.entries.reduce((s, c) => s + c.wordCount, 0).toLocaleString()} words</p>
          <p className="credit">{work.credit} &middot; Dictionary: Lewis &amp; Short</p>
        </footer>
      </div>
    )
  }

  // ── Reader ────────────────────────────────────────────
  return (
    <div className="app" style={zoomStyle}>
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
        <TextBody text={selected.text} fontSize={fontSize} onWordTap={handleWordTap} hasSpeakers={work.hasSpeakers} />

        {popup && (
          <div ref={popupRef} className="popup popup-expanded"
            onClick={e => e.stopPropagation()} style={{
            left: '8px',
            top: `${popup.y}px`,
            width: 'calc(100% - 16px)',
            fontSize: `${lsZoom}px`,
          }}>
            <div className="popup-top">
              <div className="popup-word">{popup.clean}</div>
              <div className="popup-top-right">
                {popup.ls?.related?.length > 0 && (
                  <div className="ls-related">
                    {popup.ls.related.map((r, i) => (
                      <span key={r.key}>
                        {i > 0 && ', '}
                        <span className="ls-related-link" role="button" tabIndex={0}
                          onClick={() => handleRelatedTap(r.orth)}
                          onTouchEnd={e => { e.preventDefault(); handleRelatedTap(r.orth) }}
                        >{r.orth}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="ls-zoom-controls">
                  <button className="ls-zoom-btn" onClick={() => setLsZoom(s => Math.max(12, s - 1))}>A&minus;</button>
                  <button className="ls-zoom-btn" onClick={() => setLsZoom(s => Math.min(26, s + 1))}>A+</button>
                </div>
              </div>
            </div>
            {popup.ls ? popup.ls.slice(0, 3).map((entry, i) => (
              <div key={i} className="ls-entry">
                <div className="ls-head">
                  <span className="ls-orth">{entry.o}</span>
                  {entry.p && <span className="ls-pos">{entry.p}</span>}
                </div>
                {entry.n && <div className="ls-notes"><ClickableText text={entry.n} onWordTap={handleLSWordTap} /></div>}
                <div className="ls-senses"><SensesText text={entry.s} onWordTap={handleLSWordTap} /></div>
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

const MARKER_RE = /^(I|II|III|IV|V|VI|VII|VIII|Lit|Trop|Fig|Absol|Transf|Meton|Act|Pass|Neutr|Freq|Esp|Dep|Pregn)\.$/

function SenseWords({ text, onWordTap }) {
  if (!text) return null
  return text.split(/(\s+)/).map((seg, i) => {
    if (/^\s+$/.test(seg)) return <span key={i}>{seg}</span>
    if (MARKER_RE.test(seg)) return <span key={i} className="ls-marker">{seg}</span>
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

// ── Section splitting ──────────────────────────────────────
// L&S uses em-dashes for some breaks, but many sub-sections start
// inline after a period/semicolon. Insert em-dashes before known markers.
const SECTION_MARKERS = /([.;:)\]])\s+(In gen\b|In partic\b|Constr\b|Esp\b|Absol\b|In conversation\b|Prop\b|Aliquem,|Aliquid[,:.]|Audito,|De aliq)/g

function addBreaks(text) {
  return text.replace(SECTION_MARKERS, '$1\u2014$2')
}

// ── English definition detection ──────────────────────────
// L&S entries typically have: [morphological forms] [etymology], DEFINITION (notes). Citations...
// We detect the English definition and return { start, end } character offsets, or null.

const LATIN_FORM_START = /^(Perf|Imperf|Pluperf|Fut\b|Inf\b|Subj|Imper|Sync|Contr|Collat|Freq\.|Dim\.|Desid|Inch|Sup\b|Obs\b)/

function findDefs(text) {
  const defs = []
  const bracketEnd = text.indexOf('], ')

  // Pattern 1: After ], (closing etymology bracket) — most reliable
  const bm = text.match(/\],\s*/)
  if (bm) {
    const start = bm.index + bm[0].length
    const rest = text.slice(start)
    const end = defEnd(rest)
    if (end > 3) defs.push({ start, end: start + end })
  }

  // Pattern 2: Starts with clear English definition (restrictive — only known English patterns)
  if (defs.length === 0) {
    const t = text.trimStart()
    const offset = text.length - t.length
    if (/^(To |A |An |One |The |Of |That |Not |[A-Z][a-z]+(ly|ful|ous|ive|ed|ble|ant|ent|ing|ary|ness|ment|tion|ical|ular),)/.test(t) && !LATIN_FORM_START.test(t)) {
      const end = defEnd(t)
      if (end > 2) defs.push({ start: offset, end: offset + end })
    }
  }

  // Pattern 4: Article-based definition after sentence boundary (". The/A/An [lowercase]")
  // Common for noun entries: morphology + etymology ends with period, then English definition
  const textHead = text.slice(0, 600)
  const artRe = /\.\s+((?:The|An?) [a-z])/g
  let am
  while ((am = artRe.exec(textHead)) !== null) {
    const start = text.indexOf(am[1], am.index)
    if (start < 0) continue
    if (defs.some(d => start >= d.start && start < d.end)) continue
    if (bracketEnd >= 0 && start < bracketEnd) continue
    const rest = text.slice(start)
    const end = defEnd(rest)
    if (end > 3) defs.push({ start, end: start + end })
  }

  // Pattern 3: Find ALL "to [verb]..." phrases after punctuation, not already covered
  // Exclude "to" + articles/pronouns/determiners and "to" + adverbs/adjectives (non-verb words)
  const TO_SKIP = /^to (the|this|that|these|those|its|his|her|their|our|your|one|ones|each|every|all|any|some|what|whom|which|such|said|great|much|very|more|most|less|least|not|[a-z]+ly\b|natural|original|literal|general)\b/
  const toRe = /\bto [a-z]{3,}/g
  let m
  while ((m = toRe.exec(text)) !== null) {
    const idx = m.index
    if (defs.some(d => idx >= d.start && idx < d.end)) continue
    // Skip matches inside etymology brackets (before ],)
    if (bracketEnd >= 0 && idx < bracketEnd) continue
    // Require preceding comma, semicolon, period, closing paren, or start of text
    if (idx > 0) {
      const before = text.slice(Math.max(0, idx - 3), idx).trimEnd()
      const lastChar = before[before.length - 1]
      if (!lastChar || !',;.)'.includes(lastChar)) continue
    }
    const match = text.slice(idx)
    if (TO_SKIP.test(match)) continue
    const end = defEnd(match)
    if (end > 5) defs.push({ start: idx, end: idx + end })
  }

  return defs.sort((a, b) => a.start - b.start)
}

function defEnd(text) {
  let earliest = -1
  const check = (pos) => { if (pos > 0 && (earliest < 0 || pos < earliest)) earliest = pos }
  check(text.indexOf('('))                          // opening paren
  check(text.indexOf(';'))                          // semicolon
  const sent = text.search(/\.\s+[A-Z]/)           // sentence boundary
  if (sent > 0) check(sent + 1)                    // include the period
  check(text.search(/:\s/))                         // colon (introduces examples)
  check(text.search(/,\s*[A-Z][a-z]{1,10}\.\s/))   // comma + author citation
  const greek = text.search(/[,\s]*[\u0370-\u03FF]/) // Greek text boundary
  if (greek > 0) check(greek)
  return earliest > 2 && earliest < 300 ? earliest : -1
}

function RenderSection({ text, onWordTap }) {
  const defs = findDefs(text)
  if (defs.length === 0) return <SenseWords text={text} onWordTap={onWordTap} />

  const segments = []
  let pos = 0
  for (const d of defs) {
    if (d.start > pos) segments.push({ text: text.slice(pos, d.start), bold: false })
    segments.push({ text: text.slice(d.start, d.end), bold: true })
    pos = d.end
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), bold: false })

  return <>
    {segments.map((s, i) => s.bold
      ? <span key={i} className="ls-def"><SenseWords text={s.text} onWordTap={onWordTap} /></span>
      : <SenseWords key={i} text={s.text} onWordTap={onWordTap} />
    )}
  </>
}

function SensesText({ text, onWordTap }) {
  if (!text) return null
  const processed = addBreaks(text)
  const sections = processed.split('\u2014')
  return sections.map((section, i) => (
    <div key={i} className={i > 0 ? 'ls-section' : undefined}>
      {i > 0 && <span className="ls-dash">{'\u2014'}</span>}
      <RenderSection text={section} onWordTap={onWordTap} />
    </div>
  ))
}

function TextBody({ text, fontSize, onWordTap, hasSpeakers = true }) {
  return (
    <div className="latin-text" style={{ fontSize: `${fontSize}px` }}>
      {text.split('\n').map((line, li) => {
        if (!line.trim()) return <div key={li} className="blank-line" />
        const sm = hasSpeakers ? line.match(/^([A-Za-z]{1,4})\.\s/) : null
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
