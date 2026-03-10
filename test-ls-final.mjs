import { lookupLS } from './src/lookup.js'

const tests = [
  // Previously failing 3
  ['lucis', 'lux'], ['partis', 'pars'], ['rei', 'res'],
  // New LS_LEMMA additions
  ['vocis', 'vox'], ['vocem', 'vox'], ['legis', 'lex'], ['legem', 'lex'],
  ['pacis', 'pax'], ['pacem', 'pax'], ['iuris', 'ius'], ['iure', 'ius'],
  ['noctis', 'nox'], ['noctem', 'nox'], ['artis', 'ars'], ['artem', 'ars'],
  ['mortis', 'mors'], ['mortem', 'mors'], ['mentis', 'mens'], ['mentem', 'mens'],
  ['gentis', 'gens'], ['gentem', 'gens'],
  // Previous test words (spot check)
  ['regem', 'rex'], ['ducem', 'dux'], ['senem', 'senex'],
  ['cachinnos', 'cachinnus'], ['iudicem', 'judex'],
  ['amorem', 'amor'], ['virtutis', 'virtus'], ['hominem', 'homo'],
  ['mulieris', 'mulier'], ['corporis', 'corpus'], ['operis', 'opus'],
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
  ['diem', 'dies'], ['spem', 'spes'], ['fidem', 'fides'],
  // Adjectives
  ['magnum', 'magnus'], ['bonum', 'bonus'], ['bonorum', 'bonus'],
  ['fortem', 'fortis'], ['fortium', 'fortis'],
  // Pronouns/demonstratives via LS_LEMMA
  ['illum', 'ille'], ['hanc', 'hic'], ['quem', 'qui'], ['ipsum', 'ipse'],
  // Prepositions/particles
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
]

let pass = 0, fail = 0
for (const [word, expectedLemma] of tests) {
  const result = lookupLS(word)
  const firstOrth = result?.[0]?.o || 'NOT_FOUND'
  const firstKey = firstOrth.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')
  const expKey = expectedLemma.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')
  if (firstKey === expKey) {
    pass++
  } else {
    fail++
    console.log(`MISS: ${word} → ${firstOrth} (expected ${expectedLemma})`)
  }
}
console.log(`\n${pass}/${pass+fail} correct (${(100*pass/(pass+fail)).toFixed(1)}%)`)
if (fail === 0) console.log('ALL TESTS PASSED!')
