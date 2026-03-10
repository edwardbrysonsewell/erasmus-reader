/**
 * Latin word lookup using Whitaker's Words dictionary data.
 *
 * Strategy:
 * 1. Check DIRECT table for common irregular/tricky forms
 * 2. Try stem index with ending stripping
 * 3. Handle enclitics (-que, -ne, -ve)
 */

import DICT from './data/DICTLINE.json'
import LS from './data/lewis-short.json'

// ── Strip macrons/accents ───────────────────────────────────
function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '').replace(/j/g, 'i')
}

// ── Lewis & Short lookup ────────────────────────────────────
// L&S is indexed by lemma form. We need to reconstruct the lemma
// from inflected forms to find the right entry.

// Map common irregular forms → L&S lemma key
const LS_LEMMA = {}
const _lm = (forms, lemma) => forms.forEach(f => { LS_LEMMA[f] = lemma })
_lm(['sum','es','est','sumus','estis','sunt','eram','eras','erat','eramus','eratis','erant',
  'ero','eris','erit','erimus','eritis','erunt','sim','sis','sit','simus','sitis','sint',
  'essem','esses','esset','essemus','essetis','essent','esse','fui','fuisti','fuit',
  'fuimus','fuistis','fuerunt','fuerat','fuerant','fuerit','fuisse','fuisset'], 'sum')
_lm(['possum','potes','potest','possumus','potestis','possunt','poteram','poterat','poterant',
  'possim','possit','possint','posset','possent','posse','potui','potuit','potuisse'], 'possum')
_lm(['eo','is','it','imus','itis','eunt','ibam','ibat','ibant','ibo','ibit',
  'eam','eat','eant','irem','iret','ire','iens','eundi','eundo'], 'eo')
_lm(['fero','fers','fert','ferimus','fertis','ferunt','ferebam','ferebat',
  'feram','feret','ferent','ferre','ferrem','ferret','tuli','tulit','tulerunt',
  'tuleram','tulerat','tulisse','latum','latus','lata','lati'], 'fero')
_lm(['volo','vis','vult','volt','volumus','vultis','volunt','volebam','volebat',
  'volam','volet','volent','velim','velit','velint','vellem','vellet','velle',
  'volui','voluit','voluisse'], 'volo')
_lm(['nolo','nolumus','nolunt','nolebam','nolebat','nolim','nolit','nollem',
  'nolle','noli','nolite','nolui','noluit'], 'nolo')
_lm(['malo','mavis','mavult','malumus','malunt','malebam','malim','malit',
  'mallem','malle','malui','maluit'], 'malo')
_lm(['fio','fis','fit','fiunt','fiebam','fiebat','fiam','fiat','fierem',
  'fieret','fieri'], 'fio')
_lm(['inquam','inquis','inquit','inquiunt','inquiat'], 'inquam')
_lm(['ego','me','mei','mihi'], 'ego')
_lm(['tu','te','tui','tibi'], 'tu')
_lm(['nos','nobis','nostri','nostrum'], 'nos')
_lm(['vos','vobis','vestri','vestrum'], 'vos')
_lm(['hic','haec','hoc','huius','huic','hunc','hanc','hac','hi','hae','horum','harum','his','hos','has'], 'hic')
_lm(['ille','illa','illud','illius','illi','illum','illam','illo','illos','illas','illis'], 'ille')
_lm(['iste','ista','istud','istius','isti','istum','istam','isto','istos','istas','istis'], 'iste')
_lm(['ipse','ipsa','ipsum','ipsius','ipsi','ipso','ipsam','ipsos','ipsas','ipsis'], 'ipse')
_lm(['qui','quae','quod','cuius','cui','quem','quam','quo','qua','quorum','quarum','quibus','quos','quas'], 'qui')
_lm(['quis','quid'], 'quis')
_lm(['is','ea','id','eius','ei','eum','eam','eo','eae','eorum','earum','eis','eos','eas','iis'], 'is')
_lm(['idem','eadem','eodem','eandem','eundem','eorundem','earundem','eisdem','eosdem'], 'idem')
// Common 3rd/5th decl nouns whose stems overlap with other words
_lm(['lucis','luci','lucem','luce','luces','lucum','lucibus'], 'lux')
_lm(['partis','parti','partem','parte','partes','partium','partibus'], 'pars')
_lm(['rei','rem','rerum','rebus'], 'res')
_lm(['vocis','voci','vocem','voce','voces','vocum','vocibus'], 'vox')
_lm(['legis','legi','legem','lege','leges','legum','legibus'], 'lex')
_lm(['pacis','paci','pacem','pace','paces','pacibus'], 'pax')
_lm(['iuris','iuri','ius','iure','iura','iurum','iuribus'], 'jus')
_lm(['noctis','nocti','noctem','nocte','noctes','noctum','noctium','noctibus'], 'nox')
_lm(['artis','arti','artem','arte','artes','artium','artibus'], 'ars')
_lm(['mortis','morti','mortem','morte','mortes','mortium','mortibus'], 'mors')
_lm(['mentis','menti','mentem','mente','mentes','mentium','mentibus'], 'mens')
_lm(['gentis','genti','gentem','gente','gentes','gentium','gentibus'], 'gens')
_lm(['operis','operi','opera','opere','operum','operibus'], 'opus')
_lm(['diem','diei','dierum','diebus'], 'dies')
_lm(['fortem','forti','fortes','fortium','fortibus','fortior','fortius','fortissimus'], 'fortis')
_lm(['servi','servo','servum','servos','servorum','servis'], 'servus')
_lm(['generis','generi','genera','generum','generibus'], 'genus')
_lm(['oneris','oneri','onera','onerum','oneribus'], 'onus')
_lm(['vulneris','vulneri','vulnera','vulnerum','vulneribus'], 'vulnus')
_lm(['sceleris','sceleri','scelera','scelerum','sceleribus'], 'scelus')
_lm(['muneris','muneri','munera','munerum','muneribus'], 'munus')
// Adjective/noun forms where L&S has separate sub-entries that steal the match
_lm(['bonum','bona','boni','bono','bonorum','bonis','bonos','bonas','bonam'], 'bonus')
_lm(['optimum','optima','optimi','optimo','optimorum','optimis','optimos'], 'optimus')
_lm(['maximum','maxima','maximi','maximo','maximorum','maximis','maximos'], 'maximus')
// (ius forms handled above with 'jus' key)
// Forms where L&S has a separate (rare) headword that steals the match from the common word
_lm(['pedis','pedi','pedem','pede','pedes','pedum','pedibus'], 'pes')
_lm(['animo','animum','animi','animorum','animis','animos'], 'animus')
_lm(['amans','amantis','amantem','amante','amantes','amantium','amantibus'], 'amo')
_lm(['virum','viri','viro','virorum','viris','viros'], 'vir')
_lm(['malum','mala','mali','malo','malorum','malis','malos','malam','malas'], 'malus')
_lm(['caeli','caelo','caelorum','caelis','coelum','coeli','coelo','coelorum','coelis'], 'caelum')
// Renaissance nc↔nt spelling (concio = contio)
_lm(['concio','concionis','concioni','concionem','concione','conciones','concionum','concionibus'], 'contio')
_lm(['concionator','concionatoris','concionatorem','concionatores'], 'contio')
// Possessive/reflexive pronouns — oblique forms that don't share stems with headword
_lm(['sibi','se','sese'], 'sui')
_lm(['suam','suas','suos','suum','suae','sui','suo','suis','sua','suorum','suarum'], 'suus')
_lm(['tuam','tuas','tuos','tuum','tuae','tui','tuo','tuis','tua','tuorum','tuarum'], 'tuus')
_lm(['meam','meas','meos','meum','meae','mei','meo','meis','mea','meorum','mearum'], 'meus')
// littera / litera (Renaissance often drops one t)
_lm(['literis','literae','literas','litera','literarum','literam'], 'littera')
// Common adjective forms where wrong verb steals the match
_lm(['nova','novum','novae','novo','novis','novam','novos','novas','novorum','novarum'], 'novus')
// pactum/pacto — not pango
_lm(['pacto','pactum','pacti','pactorum','pactis'], 'pactum')

// Compound verbs with sum (intersum, adsum, absum, praesum, etc.)
// Generate all prefix+stem combinations automatically
const SUM_STEMS = ['sum','es','est','sumus','estis','sunt','eram','eras','erat','eramus','eratis','erant',
  'ero','eris','erit','erimus','eritis','erunt','sim','sis','sit','simus','sitis','sint',
  'essem','esses','esset','essemus','essetis','essent','esse','fui','fuisti','fuit',
  'fuimus','fuistis','fuerunt','fuerat','fuerant','fuerit','fuerint','fuisse','fuisset','fuissent',
  'futurus','futura','futurum','futuri','futuro','futuros','futuras','futuris']
const SUM_PREFIXES = [
  ['ab', 'absum'], ['ad', 'adsum'], ['de', 'desum'], ['in', 'insum'],
  ['inter', 'intersum'], ['ob', 'obsum'], ['prae', 'praesum'],
  ['sub', 'subsum'], ['super', 'supersum']
]
for (const [pfx, lemma] of SUM_PREFIXES) {
  for (const stem of SUM_STEMS) {
    const form = pfx + stem
    if (!LS_LEMMA[form]) LS_LEMMA[form] = lemma
  }
}
// prosum is irregular: prod- before vowels (prodest, profui, etc.)
const PROSUM_FORMS = ['prosum','prodes','prodest','prosumus','prodestis','prosunt',
  'proderam','proderat','proderant','prodero','proderit','proderunt',
  'prosim','prosit','prosint','prodessem','prodesset','prodessent','prodesse',
  'profui','profuisti','profuit','profuimus','profuistis','profuerunt',
  'profuerat','profuerant','profuerit','profuisse','profuisset','profuissent',
  'profuturus','profutura','profuturum']
_lm(PROSUM_FORMS, 'prosum')

// Common endings to try when reconstructing lemmas
const LEMMA_ENDINGS = ['', 'o', 'us', 'um', 'a', 'is', 'er', 'or', 'io', 'e', 'es', 'as', 'eo', 'men', 'ns', 'x']

// Get the single best-guess L&S headword for a Whitaker DICT entry
function bestLemma(entry) {
  if (!entry.stems) return null
  const s1 = entry.stems[0] ? normalize(entry.stems[0]) : null
  if (!s1) return null
  if (entry.pos === 'N') {
    const d = entry.declension || 0
    if (d === 1) return s1 + 'a'
    if (d === 2) return entry.gender === 'N' ? s1 + 'um' : s1 + 'us'
    if (d === 3) return s1 // 3rd decl: first stem is the nominative
    if (d === 4) return entry.gender === 'N' ? s1 + 'u' : s1 + 'us'
    if (d === 5) return s1 + 'es'
  }
  if (entry.pos === 'ADJ') {
    const d = entry.declension || 0
    if (d === 1 || d === 2) return s1 + 'us'
    if (d === 3) return s1
  }
  if (entry.pos === 'V') {
    const c = entry.conjugation || 0
    if (c === 1) return s1 + 'o'
    if (c === 2) return s1 + 'eo'
    if (c === 3) return s1 + 'o'
    if (c === 4) return s1 + 'io'
    return s1 + 'o'
  }
  return s1
}

// Get broader candidate L&S headwords for a Whitaker DICT entry
function broadLemmas(entry) {
  const lemmas = []
  if (!entry.stems) return lemmas
  const s1 = entry.stems[0] ? normalize(entry.stems[0]) : null
  if (!s1) return lemmas
  lemmas.push(s1)
  if (entry.pos === 'N') {
    const d = entry.declension || 0
    if (d === 1) lemmas.push(s1 + 'a')
    if (d === 2) lemmas.push(s1 + 'us', s1 + 'um', s1 + 'er', s1 + 'ius')
    if (d === 3) lemmas.push(s1 + 'o', s1 + 'or', s1 + 'ex', s1 + 'ix', s1 + 'ax', s1 + 'ox', s1 + 'ux',
      s1 + 'x', s1 + 's', s1 + 'is', s1 + 'es', s1 + 'er', s1 + 'men', s1 + 'ns', s1 + 'e',
      s1 + 'as', s1 + 'tas', s1 + 'tio', s1 + 'do', s1 + 'go')
    if (d === 4) lemmas.push(s1 + 'us', s1 + 'u')
    if (d === 5) lemmas.push(s1 + 'es')
  }
  if (entry.pos === 'ADJ') {
    const d = entry.declension || 0
    if (d === 1 || d === 2) lemmas.push(s1 + 'us', s1 + 'er', s1 + 'a', s1 + 'um')
    if (d === 3) lemmas.push(s1 + 'is', s1 + 'er', s1 + 'ns', s1 + 'x', s1 + 'or', s1 + 'ax', s1 + 'ex', s1 + 'ix')
  }
  if (entry.pos === 'V') {
    const c = entry.conjugation || 0
    if (c === 1) lemmas.push(s1 + 'o')
    if (c === 2) lemmas.push(s1 + 'eo')
    if (c === 3) lemmas.push(s1 + 'o', s1 + 'io')
    if (c === 4) lemmas.push(s1 + 'io')
    lemmas.push(s1 + 'or') // deponents
  }
  if (entry.pos === 'ADV') lemmas.push(s1 + 'e', s1 + 'er', s1 + 'iter', s1 + 'im')
  return lemmas
}

// Morphological ending check: does this ending fit this entry's POS/declension/conjugation?
// Returns a bonus score (0 = no match, 3 = strong match)
const N1_ENDS = new Set(['a','ae','am','arum','is'])
const N2_ENDS = new Set(['us','um','i','o','e','orum','os','is'])
const N3_ENDS = new Set(['em','is','i','e','es','ibus','um','ium','a'])
const N4_ENDS = new Set(['us','u','ui','uum','ibus'])
const N5_ENDS = new Set(['es','ei','erum','ebus'])
const V_ENDS = new Set(['o','as','at','amus','atis','ant','es','et','emus','etis','ent',
  'is','it','imus','itis','unt','ebam','ebas','ebat','ebamus','ebatis','ebant',
  'abam','abas','abat','abamus','abatis','abant','iebam','iebas','iebat',
  'abo','abis','abit','abimus','abitis','abunt','ebo','ebis','ebit',
  'am','iam','ias','iat','iamus','iatis','iant',
  'arem','ares','aret','erem','eres','eret','irem','ires','iret',
  'a','ate','are','e','ete','ere','i','ite','ire',
  'eo','io','avit','evit','ivit','uit',
  'atur','etur','itur','antur','entur','untur',
  'or','aris','eris','iris',
  'ans','ens','iens',
  're','ri','isse','ando','endo','iendo'])
const ADJ12_ENDS = new Set(['us','a','um','i','ae','o','orum','arum','os','as','is','ibus','em','e'])
const ADJ3_ENDS = new Set(['is','e','i','es','ium','ibus','em','ia','ior','ius'])

function morphBonus(ending, entry) {
  if (!ending) return 0
  if (entry.pos === 'N') {
    const d = entry.declension || 0
    if (d === 1 && N1_ENDS.has(ending)) return 3
    if (d === 2 && N2_ENDS.has(ending)) return 3
    if (d === 3 && N3_ENDS.has(ending)) return 3
    if (d === 4 && N4_ENDS.has(ending)) return 3
    if (d === 5 && N5_ENDS.has(ending)) return 3
  }
  if (entry.pos === 'V' && V_ENDS.has(ending)) return 3
  if (entry.pos === 'ADJ') {
    const d = entry.declension || 0
    if ((d === 1 || d === 2) && ADJ12_ENDS.has(ending)) return 3
    if (d === 3 && ADJ3_ENDS.has(ending)) return 3
  }
  return 0
}

// L&S uses "j" in keys (judex, conjux, jus) but we normalize to "i".
// Try i→j variants to find the right entry.
function lsGet(key) {
  if (!key) return null
  if (LS[key]) return key
  // Try replacing i→j before vowels (Latin orthographic convention)
  const jKey = key.replace(/i([aeiou])/g, 'j$1')
  if (jKey !== key && LS[jKey]) return jKey
  return null
}

export function lookupLS(raw) {
  if (!raw) return null
  const word = normalize(raw)
  if (!word) return null

  // Scored candidates: { key, entries, freq }
  const found = new Map()
  function add(candidate, freqScore) {
    const key = lsGet(candidate)
    if (!key) return
    if (!found.has(key)) {
      found.set(key, { entries: LS[key], freq: freqScore || 0 })
    } else if ((freqScore || 0) > found.get(key).freq) {
      found.get(key).freq = freqScore
    }
  }

  // 0. Strip enclitics (-que, -ne, -ve) and try the base word
  let base = word
  for (const enc of ['que', 'ne', 've']) {
    if (word.endsWith(enc) && word.length > enc.length + 1) {
      base = word.slice(0, -enc.length)
      break
    }
  }

  // 1. Irregular form → lemma mapping (highest confidence — must beat direct match)
  if (LS_LEMMA[word]) add(LS_LEMMA[word], 15)
  if (base !== word && LS_LEMMA[base]) add(LS_LEMMA[base], 15)

  // 2. Direct match (if the word IS a headword, show it — but LS_LEMMA overrides win)
  add(word, 12)
  if (base !== word) add(base, 12)

  // 3. Find ALL matching DICT entries via stem stripping, then construct L&S lemmas
  //    Key: lookupWord only returns the first stem match, but we need ALL matches
  //    to find the best L&S entry across all possible interpretations.
  function searchStems(w) {
    for (let cut = 0; cut <= Math.min(7, w.length - 2); cut++) {
      const stem = cut === 0 ? w : w.slice(0, -cut)
      if (stem.length < 2) break
      if (!stemIdx.has(stem)) continue
      const ending = cut === 0 ? '' : w.slice(-cut)
      for (const entry of stemIdx.get(stem)) {
        const freqScore = 6 - (FREQ_ORDER[entry.frequency] ?? 6)
        const mb = morphBonus(ending, entry)
        const best = bestLemma(entry)
        if (best) add(best, freqScore + 1 + mb) // +1 for precision, +mb for morph match
        for (const lemma of broadLemmas(entry)) add(lemma, freqScore + mb)
      }
    }
  }
  searchStems(word)
  if (base !== word) searchStems(base)

  // Also try j→i, v→u normalization
  const alt = word.replace(/j/g, 'i').replace(/v/g, 'u')
  if (alt !== word) searchStems(alt)

  // Renaissance/medieval orthographic variants (Erasmus uses oe for ae or e, etc.)
  // Priority: oe↔ae (standard normalization, high score) > oe/ae→e, y→i (lower score)
  const hiVariants = new Set()  // high-confidence variants
  const loVariants = new Set()  // lower-confidence variants
  if (word.includes('oe')) {
    hiVariants.add(word.replace(/oe/g, 'ae'))  // coelum → caelum (standard)
    loVariants.add(word.replace(/oe/g, 'e'))   // foemina → femina
  }
  if (word.includes('ae')) {
    hiVariants.add(word.replace(/ae/g, 'oe'))  // reverse
    loVariants.add(word.replace(/ae/g, 'e'))   // rare
  }
  if (word.includes('y')) loVariants.add(word.replace(/y/g, 'i'))   // sylva → silva
  if (word.includes('ph')) loVariants.add(word.replace(/ph/g, 'f')) // rare
  for (const v of hiVariants) {
    if (v !== word) {
      if (LS_LEMMA[v]) add(LS_LEMMA[v], 14)
      add(v, 14)
      searchStems(v)
    }
  }
  for (const v of loVariants) {
    if (v !== word) {
      if (LS_LEMMA[v]) add(LS_LEMMA[v], 13)
      add(v, 8)
      searchStems(v)
    }
  }

  // 4. Also try raw DICT stems + LEMMA_ENDINGS as broad net
  const triedStems = new Set()
  for (let cut = 0; cut <= Math.min(7, word.length - 2); cut++) {
    const stem = cut === 0 ? word : word.slice(0, -cut)
    if (stem.length < 2) break
    if (!stemIdx.has(stem)) continue
    for (const entry of stemIdx.get(stem)) {
      if (!entry.stems) continue
      for (const s of entry.stems) {
        if (!s || s === 'NO_STEM') continue
        const ns = normalize(s)
        if (!ns || triedStems.has(ns)) continue
        triedStems.add(ns)
        add(ns, 1)
        for (const end of LEMMA_ENDINGS) add(ns + end, 1)
      }
    }
  }

  // 5. Blind stem stripping as absolute last resort
  if (found.size === 0) {
    for (let cut = 1; cut <= Math.min(7, word.length - 2); cut++) {
      const stem = word.slice(0, -cut)
      add(stem, 0)
      for (const end of LEMMA_ENDINGS) {
        if (stem + end !== word) add(stem + end, 0)
      }
      if (found.size > 0) break
    }
  }

  if (found.size === 0) return null

  // Sort candidates by score (higher = more likely the right entry)
  const sorted = [...found.entries()].sort((a, b) => b[1].freq - a[1].freq)

  // Flatten, deduplicate
  const result = []
  const seen = new Set()
  for (const [, data] of sorted) {
    for (const e of data.entries) {
      const key = (e.o || '') + '||' + (e.s || '').slice(0, 100)
      if (!seen.has(key)) {
        seen.add(key)
        result.push(e)
      }
    }
  }

  return result.length > 0 ? result : null
}

// ── Build stem index: stem → entries ────────────────────────
const stemIdx = new Map()
for (const entry of DICT) {
  if (!entry.stems) continue
  for (const stem of entry.stems) {
    if (!stem || stem === 'NO_STEM') continue
    const s = stem.toLowerCase().replace(/j/g, 'i')
    if (!stemIdx.has(s)) stemIdx.set(s, [])
    stemIdx.get(s).push(entry)
  }
}

// ── POS labels ──────────────────────────────────────────────
const POS_LABEL = {
  N: 'noun', V: 'verb', ADJ: 'adjective', ADV: 'adverb',
  PREP: 'preposition', CONJ: 'conjunction', PRON: 'pronoun',
  INTERJ: 'interjection', NUM: 'numeral', PACK: 'enclitic',
}
const FREQ_ORDER = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, X: 6 }

// ── DIRECT overrides for forms where stem-matching gets it wrong ─
// Checked FIRST. Returns immediately without further lookup.
const D = (pos, def) => ({ pos, def, allDefs: [{ pos, def }] })
const DIRECT = {
  // sum, esse — "to be" (stem "s" also matches "edo" = to eat)
  sum: D('verb', 'to be, exist'),
  es: D('verb', 'you are (2nd sg. pres. of sum)'),
  est: D('verb', 'is, exists (3rd sg. pres. of sum)'),
  sumus: D('verb', 'we are (1st pl. pres. of sum)'),
  estis: D('verb', 'you are (2nd pl. pres. of sum)'),
  sunt: D('verb', 'they are (3rd pl. pres. of sum)'),
  esse: D('verb', 'to be (inf. of sum)'),
  eram: D('verb', 'I was (1st sg. impf. of sum)'),
  eras: D('verb', 'you were (2nd sg. impf. of sum)'),
  erat: D('verb', 'was (3rd sg. impf. of sum)'),
  eramus: D('verb', 'we were (1st pl. impf. of sum)'),
  eratis: D('verb', 'you were (2nd pl. impf. of sum)'),
  erant: D('verb', 'they were (3rd pl. impf. of sum)'),
  ero: D('verb', 'I will be (1st sg. fut. of sum)'),
  eris: D('verb', 'you will be (2nd sg. fut. of sum)'),
  erit: D('verb', 'will be (3rd sg. fut. of sum)'),
  erimus: D('verb', 'we will be (1st pl. fut. of sum)'),
  erunt: D('verb', 'they will be (3rd pl. fut. of sum)'),
  sim: D('verb', 'I may be (1st sg. pres. subj. of sum)'),
  sis: D('verb', 'you may be (2nd sg. pres. subj. of sum)'),
  sit: D('verb', 'may be (3rd sg. pres. subj. of sum)'),
  simus: D('verb', 'we may be (1st pl. pres. subj. of sum)'),
  sitis: D('verb', 'you may be (2nd pl. pres. subj. of sum)'),
  sint: D('verb', 'they may be (3rd pl. pres. subj. of sum)'),
  essem: D('verb', 'I would be (1st sg. impf. subj. of sum)'),
  esses: D('verb', 'you would be (2nd sg. impf. subj. of sum)'),
  esset: D('verb', 'would be (3rd sg. impf. subj. of sum)'),
  essemus: D('verb', 'we would be (1st pl. impf. subj. of sum)'),
  essent: D('verb', 'they would be (3rd pl. impf. subj. of sum)'),
  fui: D('verb', 'I was/have been (1st sg. perf. of sum)'),
  fuisti: D('verb', 'you were (2nd sg. perf. of sum)'),
  fuit: D('verb', 'was, has been (3rd sg. perf. of sum)'),
  fuimus: D('verb', 'we were (1st pl. perf. of sum)'),
  fuerunt: D('verb', 'they were (3rd pl. perf. of sum)'),
  fuerat: D('verb', 'had been (3rd sg. plpf. of sum)'),
  fuerant: D('verb', 'they had been (3rd pl. plpf. of sum)'),
  fuerit: D('verb', 'will have been / may have been (of sum)'),
  fuerint: D('verb', 'they will have been (3rd pl. fut. perf. of sum)'),
  fuisset: D('verb', 'would have been (3rd sg. plpf. subj. of sum)'),
  fuissem: D('verb', 'I would have been (1st sg. plpf. subj. of sum)'),
  fuisse: D('verb', 'to have been (perf. inf. of sum)'),
  // possum — "to be able"
  possum: D('verb', 'I am able, I can'),
  potes: D('verb', 'you are able, you can'),
  potest: D('verb', 'is able, can (3rd sg. of possum)'),
  possumus: D('verb', 'we are able, we can'),
  possunt: D('verb', 'they are able, they can'),
  poteram: D('verb', 'I was able, I could'),
  poterat: D('verb', 'was able, could (3rd sg. impf. of possum)'),
  poterant: D('verb', 'they were able, they could'),
  poterit: D('verb', 'will be able (3rd sg. fut. of possum)'),
  possit: D('verb', 'may be able (3rd sg. pres. subj. of possum)'),
  possint: D('verb', 'they may be able (3rd pl. pres. subj. of possum)'),
  posset: D('verb', 'could, would be able (3rd sg. impf. subj. of possum)'),
  possent: D('verb', 'they could (3rd pl. impf. subj. of possum)'),
  posse: D('verb', 'to be able (inf. of possum)'),
  potuit: D('verb', 'was able (3rd sg. perf. of possum)'),
  potuerit: D('verb', 'will have been able (of possum)'),
  potuisset: D('verb', 'would have been able (of possum)'),
  potuisse: D('verb', 'to have been able (perf. inf. of possum)'),
  // Other commonly misidentified words
  deus: D('noun', 'god, deity; God (Christian)'),
  deo: D('noun', 'god (dat./abl. sg. of deus)'),
  dei: D('noun', 'of god (gen. sg. of deus); gods (nom. pl.)'),
  deum: D('noun', 'god (acc. sg. of deus)'),
  dii: D('noun', 'gods (nom. pl. of deus)'),
  diis: D('noun', 'to/for the gods (dat./abl. pl. of deus)'),
  deorum: D('noun', 'of the gods (gen. pl. of deus)'),
  deos: D('noun', 'gods (acc. pl. of deus)'),
  mihi: D('pronoun', 'to me, for me (dat. of ego)'),
  amicus: D('noun', 'friend'),
  amici: D('noun', 'of a friend; friends (nom. pl.)'),
  amicum: D('noun', 'friend (acc. sg.)'),
  amico: D('noun', 'to/for a friend (dat./abl. sg.)'),
  amicorum: D('noun', 'of friends (gen. pl.)'),
  amicos: D('noun', 'friends (acc. pl.)'),
  amica: D('noun', 'female friend'),
  liber: D('noun', 'book; inner bark'),
  libri: D('noun', 'of a book; books (nom. pl.)'),
  librorum: D('noun', 'of books (gen. pl. of liber)'),
  librum: D('noun', 'book (acc. sg.)'),
  libros: D('noun', 'books (acc. pl.)'),
  vivere: D('verb', 'to live, be alive'),
  vivit: D('verb', 'lives, is alive (3rd sg.)'),
  vixit: D('verb', 'lived (3rd sg. perf.)'),
  vivo: D('verb', 'I live, am alive'),
  vivunt: D('verb', 'they live (3rd pl.)'),
  vita: D('noun', 'life, way of life'),
  vitam: D('noun', 'life (acc. sg.)'),
  vitae: D('noun', 'of life; lives (gen./dat. sg., nom. pl.)'),
  sapientia: D('noun', 'wisdom, good sense'),
  sapientiam: D('noun', 'wisdom (acc. sg.)'),
  sapientiae: D('noun', 'of wisdom (gen./dat. sg.)'),
  gratia: D('noun', 'favor, grace, gratitude; charm'),
  gratiam: D('noun', 'favor, gratitude (acc. sg.)'),
  gratias: D('noun', 'thanks (acc. pl.); [gratias agere = to give thanks]'),
  gratiae: D('noun', 'of grace; graces (gen./dat. sg., nom. pl.)'),
  is: D('pronoun', 'he, she, it; that (demonstrative)'),
  ea: D('pronoun', 'she, it; that; those things (nom./abl. f. sg., nom./acc. n. pl.)'),
  id: D('pronoun', 'it, that (nom./acc. n. sg.)'),
  res: D('noun', 'thing, matter, affair, event; property; state'),
  rem: D('noun', 'thing, matter (acc. sg. of res)'),
  rei: D('noun', 'of the thing (gen./dat. sg. of res)'),
  rerum: D('noun', 'of things (gen. pl. of res)'),
  rebus: D('noun', 'things (dat./abl. pl. of res)'),
}

// ── IRREG: form → { stem, pos } for filtering ──────────────
// The pos filter ensures we pick the right entry when short stems
// match multiple parts of speech.
const IRREG = Object.fromEntries([
  // sum, esse, fui — "to be"
  ...['sum','es','est','sumus','estis','sunt','eram','eras','erat','eramus',
    'eratis','erant','ero','eris','erit','erimus','eritis','erunt',
    'sim','sis','sit','simus','sitis','sint','essem','esses','esset',
    'essemus','essetis','essent','esse','esto','estote','ens'
  ].map(f => [f, { stem: 's', pos: 'V' }]),
  ...['fui','fuisti','fuit','fuimus','fuistis','fuerunt','fuere',
    'fueram','fueras','fuerat','fueramus','fueratis','fuerant',
    'fuero','fueris','fuerit','fuerimus','fueritis','fuerint',
    'fuerim','fuisses','fuisset','fuissem','fuissemus','fuissetis',
    'fuissent','fuisse'
  ].map(f => [f, { stem: 'fu', pos: 'V' }]),

  // possum — "to be able"
  ...['possum','potes','potest','possumus','potestis','possunt',
    'poteram','poteras','poterat','poteramus','poteratis','poterant',
    'potero','poteris','poterit','poterimus','poteritis','poterunt',
    'possim','possis','possit','possimus','possitis','possint',
    'possem','posses','posset','possemus','possetis','possent','posse'
  ].map(f => [f, { stem: 'possu', pos: 'V' }]),
  ...['potui','potuisti','potuit','potuimus','potuistis','potuerunt',
    'potueram','potuerat','potuero','potuerit','potuissem','potuisset','potuisse'
  ].map(f => [f, { stem: 'potu', pos: 'V' }]),

  // eo, ire — "to go"
  ...['eo','is','it','imus','itis','eunt','ibam','ibas','ibat','ibamus',
    'ibatis','ibant','ibo','ibis','ibit','ibimus','ibitis','ibunt',
    'eam','eas','eat','eamus','eatis','eant','irem','ires','iret',
    'iremus','iretis','irent','ire','iens','eundi','eundo','eundum',
    'euntem','euntes','euntis','euntium'
  ].map(f => [f, { stem: 'e', pos: 'V' }]),
  ...['ii','iisti','iit','iimus','iistis','ierunt','iere',
    'ieram','ierat','ierant','iero','ierit','ierint',
    'ierim','iisset','iissem','iisse'
  ].map(f => [f, { stem: 'i', pos: 'V' }]),

  // fero — "to bear, carry"
  ...['fero','fers','fert','ferimus','fertis','ferunt','ferebam',
    'ferebas','ferebat','ferebamus','ferebatis','ferebant',
    'feram','feres','feret','feremus','feretis','ferent',
    'ferre','ferrem','ferres','ferret','ferremus','ferretis','ferrent',
    'fer','ferte','ferens','ferentis','ferentem','ferentes','ferendi'
  ].map(f => [f, { stem: 'fer', pos: 'V' }]),
  ...['tuli','tulisti','tulit','tulimus','tulistis','tulerunt','tulere',
    'tuleram','tuleras','tulerat','tuleramus','tuleratis','tulerant',
    'tulero','tuleris','tulerit','tulerimus','tuleritis','tulerint',
    'tulerim','tulisses','tulisset','tulissem','tulisse'
  ].map(f => [f, { stem: 'tul', pos: 'V' }]),
  ...['latum','latus','lata','lati','lato','latam','latarum',
    'latorum','latis','latos','latas'
  ].map(f => [f, { stem: 'lat', pos: 'V' }]),

  // volo — "to wish"
  ...['volo','vis','vult','volt','volumus','vultis','voltis','volunt',
    'volebam','volebas','volebat','volebamus','volebatis','volebant',
    'volam','voles','volet','volemus','voletis','volent','volens'
  ].map(f => [f, { stem: 'vol', pos: 'V' }]),
  ...['velim','velis','velit','velimus','velitis','velint',
    'vellem','velles','vellet','vellemus','velletis','vellent','velle'
  ].map(f => [f, { stem: 'vel', pos: 'V' }]),
  ...['volui','voluisti','voluit','voluimus','voluistis','voluerunt',
    'volueram','voluerat','voluerint','voluisse','voluisset'
  ].map(f => [f, { stem: 'volu', pos: 'V' }]),

  // nolo — "to be unwilling"
  ...['nolo','nonvis','nonvult','nolumus','nonvultis','nolunt',
    'nolebam','nolebas','nolebat','nolebamus','nolebatis','nolebant',
    'nolam','noles','nolet','nolemus','noletis','nolent',
    'noli','nolite','nolito','nolens'
  ].map(f => [f, { stem: 'nol', pos: 'V' }]),
  ...['nolim','nolis','nolit','nolimus','nolitis','nolint',
    'nollem','nolles','nollet','nollemus','nolletis','nollent','nolle'
  ].map(f => [f, { stem: 'nol', pos: 'V' }]),
  ...['nolui','noluisti','noluit','noluimus','noluistis','noluerunt',
    'noluisse','noluisset'
  ].map(f => [f, { stem: 'nolu', pos: 'V' }]),

  // malo — "to prefer"
  ...['malo','mavis','mavult','malumus','mavultis','malunt',
    'malebam','malebas','malebat','malebamus','malebatis','malebant'
  ].map(f => [f, { stem: 'mal', pos: 'V' }]),
  ...['malim','malis','malit','malimus','malitis','malint',
    'mallem','malles','mallet','mallemus','malletis','mallent','malle'
  ].map(f => [f, { stem: 'mal', pos: 'V' }]),
  ...['malui','maluisti','maluit','maluimus','maluistis','maluerunt',
    'maluisse','maluisset'
  ].map(f => [f, { stem: 'malu', pos: 'V' }]),

  // fio — "to become, be made"
  ...['fio','fis','fit','fimus','fitis','fiunt',
    'fiebam','fiebas','fiebat','fiebamus','fiebatis','fiebant',
    'fiam','fias','fiat','fiamus','fiatis','fiant',
    'fierem','fieres','fieret','fieremus','fieretis','fierent','fieri'
  ].map(f => [f, { stem: 'f', pos: 'V' }]),

  // inquam — "to say"
  ...['inquam','inquis','inquit','inquimus','inquitis','inquiunt',
    'inquiebam','inquiebat','inquiat','inquies','inquiet'
  ].map(f => [f, { stem: 'inqu', pos: 'V' }]),

  // pronouns: ego
  ...['ego','me','mei','mihi','nos','nobis','nostri','nostrum']
    .map(f => [f, { stem: 'eg', pos: 'PRON' }]),
  // tu
  ...['tu','te','tui','tibi','vos','vobis','vestri','vestrum']
    .map(f => [f, { stem: 'tu', pos: 'PRON' }]),
  // is, ea, id
  ...['ea','id','eius','ei','eum','eam','eo','eae','eorum','earum',
    'eis','eos','eas','iis']
    .map(f => [f, { stem: 'e', pos: 'PRON' }]),
  // hic, haec, hoc
  ...['hic','haec','hoc','huius','huic','hunc','hanc','hac','hi','hae',
    'horum','harum','his','hos','has']
    .map(f => [f, { stem: 'h', pos: 'PRON' }]),
  // ille, illa, illud
  ...['ille','illa','illud','illius','illi','illum','illam','illo',
    'illae','illorum','illarum','illis','illos','illas']
    .map(f => [f, { stem: 'ill', pos: 'PRON' }]),
  // iste
  ...['iste','ista','istud','istius','isti','istum','istam','isto',
    'istae','istorum','istarum','istis','istos','istas']
    .map(f => [f, { stem: 'ist', pos: 'PRON' }]),
  // qui, quae, quod
  ...['qui','quae','quod','cuius','cui','quem','quam','quo','qua',
    'quorum','quarum','quibus','quos','quas','quis','quid']
    .map(f => [f, { stem: 'qu', pos: 'PRON' }]),
  // ipse
  ...['ipse','ipsa','ipsum','ipsius','ipsi','ipso','ipsam','ipsae',
    'ipsorum','ipsarum','ipsis','ipsos','ipsas']
    .map(f => [f, { stem: 'ips', pos: 'PRON' }]),
  // idem
  ...['idem','eadem','eodem','eandem','eundem','eorundem','earundem',
    'eisdem','eosdem','easdem','isdem']
    .map(f => [f, { stem: 'idem', pos: 'PRON' }]),
])

// ── Common Latin endings by length (for better stem disambiguation) ──
const NOUN_ENDINGS = new Set([
  'a','e','i','o','u','us','um','em','es','is','os','as',
  'ae','am','ei','ui','er',
  'ium','uum','ibus','orum','arum','erum','ebus',
  'bus',
])

// ── Enclitics ───────────────────────────────────────────────
const ENCLITICS = ['que', 'ne', 've']

// ── Main lookup function ────────────────────────────────────
export function lookupWord(raw) {
  if (!raw) return null
  let word = normalize(raw)
  if (!word) return null

  // 0. Check DIRECT overrides first
  if (DIRECT[word]) return { word, ...DIRECT[word] }

  let result = tryLookup(word)
  if (result) return result

  // Try stripping enclitics
  for (const enc of ENCLITICS) {
    if (word.endsWith(enc) && word.length > enc.length + 1) {
      const base = word.slice(0, -enc.length)
      if (DIRECT[base]) return { word, ...DIRECT[base] }
      result = tryLookup(base)
      if (result) return result
    }
  }

  return null
}

function tryLookup(word) {
  // 1. Check IRREG table (with POS filtering)
  const irr = IRREG[word]
  if (irr && stemIdx.has(irr.stem)) {
    const filtered = stemIdx.get(irr.stem).filter(e => e.pos === irr.pos)
    if (filtered.length > 0) return formatResult(filtered, word)
  }

  // 2. Try exact stem match
  if (stemIdx.has(word)) {
    return formatResult(stemIdx.get(word), word)
  }

  // 3. Strip 1-7 chars from end
  for (let cut = 1; cut <= Math.min(7, word.length - 1); cut++) {
    const stem = word.slice(0, -cut)
    if (stem.length < 1) break
    if (stemIdx.has(stem)) {
      return formatResult(stemIdx.get(stem), word)
    }
  }

  // 4. Try j→i, v→u normalization
  const alt = word.replace(/j/g, 'i').replace(/v/g, 'u')
  if (alt !== word) {
    const irrAlt = IRREG[alt]
    if (irrAlt && stemIdx.has(irrAlt.stem)) {
      const filtered = stemIdx.get(irrAlt.stem).filter(e => e.pos === irrAlt.pos)
      if (filtered.length > 0) return formatResult(filtered, word)
    }
    if (stemIdx.has(alt)) return formatResult(stemIdx.get(alt), word)
    for (let cut = 1; cut <= Math.min(7, alt.length - 1); cut++) {
      const stem = alt.slice(0, -cut)
      if (stem.length < 1) break
      if (stemIdx.has(stem)) return formatResult(stemIdx.get(stem), word)
    }
  }

  return null
}

function formatResult(entries, word) {
  const seen = new Set()
  const unique = []
  const sorted = [...entries].sort((a, b) =>
    (FREQ_ORDER[a.frequency] ?? 9) - (FREQ_ORDER[b.frequency] ?? 9)
  )
  for (const e of sorted) {
    const key = e.senses
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(e)
  }
  const best = unique[0]
  return {
    word,
    pos: POS_LABEL[best.pos] || best.pos,
    def: cleanSenses(best.senses),
    allDefs: unique.slice(0, 4).map(e => ({
      pos: POS_LABEL[e.pos] || e.pos,
      def: cleanSenses(e.senses),
    })),
    _entries: unique,
  }
}

function cleanSenses(s) {
  if (!s) return ''
  return s.replace(/^\|/, '').replace(/;\s*$/, '').trim()
}
