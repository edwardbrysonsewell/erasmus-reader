// Standalone test harness for L&S lemmatization (synced with src/lookup.js)
const { readFileSync } = require('fs')

const DICT = JSON.parse(readFileSync('./src/data/DICTLINE.json', 'utf8'))
const LS = JSON.parse(readFileSync('./src/data/lewis-short.json', 'utf8'))

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '').replace(/j/g, 'i')
}

// ── LS_LEMMA: irregular form → L&S lemma key (must match src/lookup.js) ──
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
// Forms where L&S has a separate (rare) headword that steals the match from the common word
_lm(['pedis','pedi','pedem','pede','pedes','pedum','pedibus'], 'pes')
_lm(['animo','animum','animi','animorum','animis','animos'], 'animus')
_lm(['amans','amantis','amantem','amante','amantes','amantium','amantibus'], 'amo')
_lm(['virum','viri','viro','virorum','viris','viros'], 'vir')
_lm(['malum','mala','mali','malo','malorum','malis','malos','malam','malas'], 'malus')
_lm(['caeli','caelo','caelorum','caelis','coelum','coeli','coelo','coelorum','coelis'], 'caelum')
_lm(['concio','concionis','concioni','concionem','concione','conciones','concionum','concionibus'], 'contio')
_lm(['concionator','concionatoris','concionatorem','concionatores'], 'contio')
_lm(['sibi','se','sese'], 'sui')
_lm(['suam','suas','suos','suum','suae','sui','suo','suis','sua','suorum','suarum'], 'suus')
_lm(['tuam','tuas','tuos','tuum','tuae','tui','tuo','tuis','tua','tuorum','tuarum'], 'tuus')
_lm(['meam','meas','meos','meum','meae','mei','meo','meis','mea','meorum','mearum'], 'meus')
_lm(['literis','literae','literas','litera','literarum','literam'], 'littera')
_lm(['nova','novum','novae','novo','novis','novam','novos','novas','novorum','novarum'], 'novus')
_lm(['pacto','pactum','pacti','pactorum','pactis'], 'pactum')

// Compound verbs with sum (intersum, adsum, absum, praesum, etc.)
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
const PROSUM_FORMS = ['prosum','prodes','prodest','prosumus','prodestis','prosunt',
  'proderam','proderat','proderant','prodero','proderit','proderunt',
  'prosim','prosit','prosint','prodessem','prodesset','prodessent','prodesse',
  'profui','profuisti','profuit','profuimus','profuistis','profuerunt',
  'profuerat','profuerant','profuerit','profuisse','profuisset','profuissent',
  'profuturus','profutura','profuturum']
_lm(PROSUM_FORMS, 'prosum')

const LEMMA_ENDINGS = ['', 'o', 'us', 'um', 'a', 'is', 'er', 'or', 'io', 'e', 'es', 'as', 'eo', 'men', 'ns', 'x']
const FREQ_ORDER = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, X: 6 }

function bestLemma(entry) {
  if (!entry.stems) return null
  const s1 = entry.stems[0] ? normalize(entry.stems[0]) : null
  if (!s1) return null
  if (entry.pos === 'N') {
    const d = entry.declension || 0
    if (d === 1) return s1 + 'a'
    if (d === 2) return entry.gender === 'N' ? s1 + 'um' : s1 + 'us'
    if (d === 3) return s1
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
    lemmas.push(s1 + 'or')
  }
  if (entry.pos === 'ADV') lemmas.push(s1 + 'e', s1 + 'er', s1 + 'iter', s1 + 'im')
  return lemmas
}

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

function lsGet(key) {
  if (!key) return null
  if (LS[key]) return key
  const jKey = key.replace(/i([aeiou])/g, 'j$1')
  if (jKey !== key && LS[jKey]) return jKey
  return null
}

// Build stem index
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

function lookupLS(raw) {
  if (!raw) return null
  const word = normalize(raw)
  if (!word) return null

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

  // 0. Strip enclitics
  let base = word
  for (const enc of ['que', 'ne', 've']) {
    if (word.endsWith(enc) && word.length > enc.length + 1) { base = word.slice(0, -enc.length); break }
  }

  // 1. Irregular form → lemma mapping (highest confidence — must beat direct match)
  if (LS_LEMMA[word]) add(LS_LEMMA[word], 15)
  if (base !== word && LS_LEMMA[base]) add(LS_LEMMA[base], 15)

  // 2. Direct match (if the word IS a headword — but LS_LEMMA overrides win)
  add(word, 12)
  if (base !== word) add(base, 12)

  // 3. Find ALL matching DICT entries via stem stripping, then construct L&S lemmas
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
        if (best) add(best, freqScore + 1 + mb)
        for (const lemma of broadLemmas(entry)) add(lemma, freqScore + mb)
      }
    }
  }
  searchStems(word)
  if (base !== word) searchStems(base)

  const alt = word.replace(/j/g, 'i').replace(/v/g, 'u')
  if (alt !== word) searchStems(alt)

  // Renaissance/medieval orthographic variants
  const hiVariants = new Set()
  const loVariants = new Set()
  if (word.includes('oe')) {
    hiVariants.add(word.replace(/oe/g, 'ae'))
    loVariants.add(word.replace(/oe/g, 'e'))
  }
  if (word.includes('ae')) {
    hiVariants.add(word.replace(/ae/g, 'oe'))
    loVariants.add(word.replace(/ae/g, 'e'))
  }
  if (word.includes('y')) loVariants.add(word.replace(/y/g, 'i'))
  if (word.includes('ph')) loVariants.add(word.replace(/ph/g, 'f'))
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

  const sorted = [...found.entries()].sort((a, b) => b[1].freq - a[1].freq)
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

// ═══════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════

// Normalize for comparison: strip diacritics, lowercase, j→i
function cmpKey(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '').replace(/j/g, 'i')
}

const tests = [
  // Previously failing 3rd decl
  ['lucis', 'lux'], ['partis', 'pars'], ['rei', 'res'],
  // LS_LEMMA 3rd decl nouns
  ['vocis', 'vox'], ['vocem', 'vox'], ['legis', 'lex'], ['legem', 'lex'],
  ['pacis', 'pax'], ['pacem', 'pax'], ['iuris', 'jus'], ['iure', 'jus'],
  ['noctis', 'nox'], ['noctem', 'nox'], ['artis', 'ars'], ['artem', 'ars'],
  ['mortis', 'mors'], ['mortem', 'mors'], ['mentis', 'mens'], ['mentem', 'mens'],
  ['gentis', 'gens'], ['gentem', 'gens'],
  // 3rd decl nouns (stem overlap with verbs)
  ['operis', 'opus'], ['diem', 'dies'],
  ['generis', 'genus'], ['oneris', 'onus'],
  // Previous test words (spot check)
  ['regem', 'rex'], ['ducem', 'dux'], ['senem', 'senex'],
  ['cachinnos', 'cachinnus'], ['iudicem', 'judex'],
  ['amorem', 'amor'], ['virtutis', 'virtus'], ['hominem', 'homo'],
  ['mulieris', 'mulier'], ['corporis', 'corpus'],
  ['temporis', 'tempus'], ['nominis', 'nomen'], ['carminis', 'carmen'],
  ['luminis', 'lumen'], ['fluminis', 'flumen'],
  // Common verbs
  ['amat', 'amo'], ['amavit', 'amo'], ['amabat', 'amo'],
  ['docet', 'doceo'], ['docuit', 'doceo'], ['scripsit', 'scribo'],
  ['dixit', 'dico'], ['fecit', 'facio'], ['cepit', 'capio'],
  ['misit', 'mitto'], ['venit', 'venio'], ['vidit', 'video'],
  // 1st declension nouns
  ['puellam', 'puella'], ['aquam', 'aqua'], ['terram', 'terra'],
  ['vitam', 'vita'], ['causam', 'causa'],
  // 2nd declension nouns
  ['amicum', 'amicus'], ['populum', 'populus'], ['bellum', 'bellum'],
  ['verbum', 'verbum'], ['consilium', 'consilium'],
  // 4th declension
  ['exercitus', 'exercitus'], ['senatus', 'senatus'], ['manus', 'manus'],
  // 5th declension
  ['spem', 'spes'], ['fidem', 'fides'],
  // Adjectives — LS_LEMMA overrides sub-entries
  ['magnum', 'magnus'], ['bonum', 'bonus'], ['bonorum', 'bonus'],
  ['fortem', 'fortis'], ['fortium', 'fortis'],
  // Pronouns/demonstratives via LS_LEMMA
  ['illum', 'ille'], ['hanc', 'hic'], ['quem', 'qui'], ['ipsum', 'ipse'],
  // Prepositions/particles (direct match)
  ['cum', 'cum'], ['sine', 'sine'], ['inter', 'inter'],
  // More tricky 3rd decl
  ['militis', 'miles'], ['pedis', 'pes'], ['capitis', 'caput'],
  ['civitatis', 'civitas'], ['libertatis', 'libertas'],
  // More verbs (different conjugations)
  ['audit', 'audio'], ['audivit', 'audio'],
  ['monet', 'moneo'], ['monuit', 'moneo'],
  ['ducit', 'duco'], ['duxit', 'duco'],
  ['capit', 'capio'], ['accipit', 'accipio'],
  // Erasmus-specific common words
  ['colloquium', 'colloquium'], ['familiaria', 'familiaris'],
  ['epistolam', 'epistola'], ['philosophiam', 'philosophia'],
  // Additional stress tests
  ['animum', 'animus'], ['animo', 'animus'], ['animorum', 'animus'],
  ['pecuniam', 'pecunia'], ['pecuniae', 'pecunia'],
  ['litteras', 'littera'], ['litterarum', 'littera'],
  ['patrem', 'pater'], ['patris', 'pater'],
  ['matrem', 'mater'], ['matris', 'mater'],
  ['fratrem', 'frater'], ['fratris', 'frater'],
  ['filium', 'filius'], ['filii', 'filius'], ['filia', 'filia'],
  ['dominum', 'dominus'], ['domini', 'dominus'],
  ['servum', 'servus'], ['servi', 'servus'],
  ['urbem', 'urbs'], ['urbis', 'urbs'],
  ['corpus', 'corpus'], ['corpora', 'corpus'],
  ['tempus', 'tempus'], ['tempora', 'tempus'],
  ['nomen', 'nomen'], ['nomina', 'nomen'],
  ['caput', 'caput'], ['capita', 'caput'],
  ['flumen', 'flumen'], ['flumina', 'flumen'],
  ['genus', 'genus'], ['munus', 'munus'], ['muneris', 'munus'],
  ['vulnus', 'vulnus'], ['vulneris', 'vulnus'],
  ['scelus', 'scelus'], ['sceleris', 'scelus'],
  ['onus', 'onus'],
  // Deponent verbs
  ['sequitur', 'sequor'], ['loquitur', 'loquor'],
  // Participles finding parent verb
  ['amans', 'amo'], ['docens', 'doceo'],
  // Superlatives/comparatives
  ['optimus', 'optimus'], ['maximus', 'maximus'],
  // Renaissance orthographic variants (oe→e, y→i, etc.)
  ['foeminae', 'femina'], ['foemina', 'femina'], ['foeminarum', 'femina'],
  ['coelum', 'caelum'], ['coelo', 'caelum'], ['coeli', 'caelum'],
  ['sylva', 'sylva'], ['sylvas', 'silva'],  // sylva is its own L&S headword
  // Possessive/reflexive pronouns
  ['sibi', 'sui'], ['suam', 'suus'], ['tuam', 'tuus'], ['meam', 'meus'],
  // Renaissance litera = littera
  ['literis', 'littera'], ['literae', 'littera'], ['literas', 'littera'],
  // Adjective forms stealing by wrong verb
  ['nova', 'novus'], ['novum', 'novus'],
  // concio = contio
  ['concionibus', 'contio'], ['concionem', 'contio'],
  // Enclitics
  ['idque', 'is'], ['haecque', 'hic'], ['animumque', 'animus'],
  // pactum not pango
  ['pacto', 'pactum'],
  // Compound-sum verbs
  ['interfuisset', 'intersum'], ['interest', 'intersum'], ['interfuit', 'intersum'],
  ['abest', 'absum'], ['abfuit', 'absum'], ['abesse', 'absum'],
  ['adest', 'adsum'], ['adfuit', 'adsum'], ['adesse', 'adsum'],
  ['deest', 'desum'], ['deesse', 'desum'],
  ['praefuit', 'praesum'], ['praeest', 'praesum'],
  ['profuit', 'prosum'], ['prodest', 'prosum'], ['prodesse', 'prosum'],
  ['superest', 'supersum'], ['superfuit', 'supersum'],
]

let pass = 0, fail = 0
for (const [word, expectedLemma] of tests) {
  const result = lookupLS(word)
  const firstOrth = result?.[0]?.o || 'NOT_FOUND'
  const firstKey = cmpKey(firstOrth)
  const expKey = cmpKey(expectedLemma)
  if (firstKey === expKey) {
    pass++
  } else {
    fail++
    console.log(`MISS: ${word} → ${firstOrth} (expected ${expectedLemma})`)
  }
}
console.log(`\n${pass}/${pass+fail} correct (${(100*pass/(pass+fail)).toFixed(1)}%)`)
if (fail === 0) console.log('ALL TESTS PASSED!')
