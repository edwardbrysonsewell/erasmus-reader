import { readFileSync } from 'fs'
const DICT = JSON.parse(readFileSync('./src/data/DICTLINE.json', 'utf8'))

// Build stem index
const stemIdx = new Map()
for (const entry of DICT) {
  if (!entry.stems) continue
  for (const stem of entry.stems) {
    if (!stem || stem === 'NO_STEM') continue
    const s = stem.toLowerCase()
    if (!stemIdx.has(s)) stemIdx.set(s, [])
    stemIdx.get(s).push(entry)
  }
}

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

// IRREG with POS filter (same as lookup.js)
const IRREG_ENTRIES = [
  [['sum','es','est','sumus','estis','sunt','eram','eras','erat','eramus','eratis','erant',
    'ero','eris','erit','erimus','eritis','erunt','sim','sis','sit','simus','sitis','sint',
    'essem','esses','esset','essemus','essetis','essent','esse','esto','estote','ens'], 's', 'V'],
  [['fui','fuisti','fuit','fuimus','fuistis','fuerunt','fuere','fueram','fueras','fuerat',
    'fueramus','fueratis','fuerant','fuero','fueris','fuerit','fuerimus','fueritis','fuerint',
    'fuerim','fuisses','fuisset','fuissem','fuisse'], 'fu', 'V'],
  [['possum','potes','potest','possumus','potestis','possunt','poteram','poterat','poterant',
    'potero','poterit','poterunt','possim','possit','possint','possem','posset','possent','posse'], 'possu', 'V'],
  [['potui','potuit','potuisse','potuisset'], 'potu', 'V'],
  [['eo','imus','itis','eunt','ibam','ibat','ibant','ibo','ibit','ibunt',
    'eam','eas','eat','eamus','eant','irem','iret','irent','ire','iens','eundi','eundo'], 'e', 'V'],
  [['fero','fers','fert','ferimus','fertis','ferunt','ferebam','ferebat','ferebant',
    'feram','feres','feret','ferent','ferre','ferrem','ferret','ferrent','ferens'], 'fer', 'V'],
  [['tuli','tulit','tulimus','tulerunt','tuleram','tulerat','tulerant','tulisse','tulisset'], 'tul', 'V'],
  [['volo','vis','vult','volt','volumus','vultis','volunt','volebam','volebat','volebant',
    'volam','volet','volent','volens'], 'vol', 'V'],
  [['velim','velis','velit','velimus','velint','vellem','vellet','vellent','velle'], 'vel', 'V'],
  [['volui','voluit','voluisse','voluisset'], 'volu', 'V'],
  [['nolo','nolumus','nolunt','nolebam','nolebat','nolam','nolet','noli','nolite','nolens'], 'nol', 'V'],
  [['nolim','nolit','nolint','nollem','nollet','nolle'], 'nol', 'V'],
  [['nolui','noluit','noluisse'], 'nolu', 'V'],
  [['malo','mavis','mavult','malumus','malunt','malebam','malebat'], 'mal', 'V'],
  [['malim','malit','malint','mallem','mallet','malle'], 'mal', 'V'],
  [['malui','maluit','maluisse'], 'malu', 'V'],
  [['fio','fis','fit','fimus','fitis','fiunt','fiebam','fiebat','fiebant',
    'fiam','fiat','fiant','fierem','fieret','fierent','fieri'], 'f', 'V'],
  [['inquam','inquis','inquit','inquimus','inquiunt','inquiat','inquies','inquiet'], 'inqu', 'V'],
  [['ego','me','mei','mihi','nos','nobis','nostri','nostrum'], 'eg', 'PRON'],
  [['tu','te','tui','tibi','vos','vobis','vestri','vestrum'], 'tu', 'PRON'],
  [['ea','id','eius','ei','eum','eam','eae','eorum','earum','eis','eos','eas','iis'], 'e', 'PRON'],
  [['hic','haec','hoc','huius','huic','hunc','hanc','hac','hi','hae','horum','harum','his','hos','has'], 'h', 'PRON'],
  [['ille','illa','illud','illius','illi','illum','illam','illo','illae','illorum','illarum','illis','illos','illas'], 'ill', 'PRON'],
  [['iste','ista','istud','istius','isti','istum','istam','isto','istae','istorum','istarum','istis','istos','istas'], 'ist', 'PRON'],
  [['qui','quae','quod','cuius','cui','quem','quam','quo','qua','quorum','quarum','quibus','quos','quas','quis','quid'], 'qu', 'PRON'],
  [['ipse','ipsa','ipsum','ipsius','ipsi','ipso','ipsam','ipsae','ipsorum','ipsarum','ipsis','ipsos','ipsas'], 'ips', 'PRON'],
  [['idem','eadem','eodem','eandem','eundem','eorundem','earundem','eisdem','eosdem','easdem','isdem'], 'idem', 'PRON'],
]
const IRREG = {}
for (const [forms, stem, pos] of IRREG_ENTRIES) {
  for (const f of forms) IRREG[f] = { stem, pos }
}

const ENCL = ['que', 'ne', 've']
const FREQ = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, X: 6 }
const POS_LABEL = {
  N: 'noun', V: 'verb', ADJ: 'adjective', ADV: 'adverb',
  PREP: 'preposition', CONJ: 'conjunction', PRON: 'pronoun', INTERJ: 'interjection',
}

function lookup(raw) {
  let w = normalize(raw)
  if (!w) return null
  let r = _try(w)
  if (r) return r
  for (const enc of ENCL) {
    if (w.endsWith(enc) && w.length > enc.length + 1) {
      r = _try(w.slice(0, -enc.length))
      if (r) return r
    }
  }
  return null
}

// DIRECT overrides (same as lookup.js)
const DD = (pos, def) => ({ pos, def })
const DIRECT = {
  sum: DD('verb','to be, exist'), es: DD('verb','you are'), est: DD('verb','is, exists'),
  sumus: DD('verb','we are'), estis: DD('verb','you are'), sunt: DD('verb','they are'),
  esse: DD('verb','to be'), erat: DD('verb','was'), erant: DD('verb','they were'),
  esset: DD('verb','would be'), essent: DD('verb','they would be'), sim: DD('verb','I may be'),
  sit: DD('verb','may be'), sint: DD('verb','they may be'), fuit: DD('verb','was, has been'),
  fuerat: DD('verb','had been'), fuerit: DD('verb','will have been'),
  potest: DD('verb','is able, can'), possit: DD('verb','may be able'),
  posset: DD('verb','could, would be able'), posse: DD('verb','to be able'),
  deus: DD('noun','god, deity; God'), mihi: DD('pronoun','to me, for me'),
  amicus: DD('noun','friend'), librorum: DD('noun','of books'),
  vivere: DD('verb','to live'), sapientia: DD('noun','wisdom'),
  sapientiam: DD('noun','wisdom (acc.)'), gratias: DD('noun','thanks'),
  is: DD('pronoun','he, she, it'), ea: DD('pronoun','she, it, those things'),
  id: DD('pronoun','it, that'), res: DD('noun','thing, matter, affair'),
}

function _try(w) {
  // Check DIRECT
  if (DIRECT[w]) return DIRECT[w]
  // Check IRREG with POS filtering
  const irr = IRREG[w]
  if (irr && stemIdx.has(irr.stem)) {
    const filtered = stemIdx.get(irr.stem).filter(e => e.pos === irr.pos)
    if (filtered.length > 0) return fmt(filtered)
  }
  // Exact stem match
  if (stemIdx.has(w)) return fmt(stemIdx.get(w))
  // Strip 1-7 chars
  for (let c = 1; c <= Math.min(7, w.length - 1); c++) {
    const s = w.slice(0, -c)
    if (s.length < 1) break
    if (stemIdx.has(s)) return fmt(stemIdx.get(s))
  }
  // j→i, v→u
  const alt = w.replace(/j/g, 'i').replace(/v/g, 'u')
  if (alt !== w) {
    const irrAlt = IRREG[alt]
    if (irrAlt && stemIdx.has(irrAlt.stem)) {
      const filtered = stemIdx.get(irrAlt.stem).filter(e => e.pos === irrAlt.pos)
      if (filtered.length > 0) return fmt(filtered)
    }
    if (stemIdx.has(alt)) return fmt(stemIdx.get(alt))
    for (let c = 1; c <= Math.min(7, alt.length - 1); c++) {
      const s = alt.slice(0, -c)
      if (s.length < 1) break
      if (stemIdx.has(s)) return fmt(stemIdx.get(s))
    }
  }
  return null
}

function fmt(entries) {
  const seen = new Set()
  const u = []
  for (const e of [...entries].sort((a, b) => (FREQ[a.frequency] ?? 9) - (FREQ[b.frequency] ?? 9))) {
    if (seen.has(e.senses)) continue
    seen.add(e.senses)
    u.push(e)
  }
  const b = u[0]
  return {
    pos: POS_LABEL[b.pos] || b.pos,
    def: (b.senses || '').replace(/^\|/, '').replace(/;\s*$/, '').trim(),
  }
}

console.log(`Stem index: ${stemIdx.size} stems from ${DICT.length} entries\n`)

const tests = [
  'est', 'sunt', 'esse', 'omnia', 'librorum', 'sapientiam', 'vivere',
  'fecit', 'Deus', 'nescio', 'quia', 'philosophum', 'suaviter',
  'potest', 'tuli', 'haec', 'convivium', 'qui', 'nihil',
  'foeminis', 'monachis', 'abbatem', 'sapientia', 'velim',
  'videtur', 'hominem', 'pecunia', 'amicus', 'gratias', 'quidem',
  'inquit', 'mihi', 'tibi', 'ego', 'nos', 'ille', 'quod',
]

for (const w of tests) {
  const r = lookup(w)
  console.log(`${w.padEnd(16)} -> ${r ? r.pos + ': ' + r.def.slice(0, 85) : 'NOT FOUND'}`)
}
