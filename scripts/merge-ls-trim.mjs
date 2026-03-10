import { readFileSync, writeFileSync } from 'fs'

const MAX_SENSE_LEN = 600 // chars per sense — keeps main definitions + key citations

const index = {}
let total = 0

for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) {
  try {
    let raw = readFileSync(`/tmp/ls-json/ls_${letter}.json`, 'utf8').trim()
    if (raw.startsWith('[') && raw.includes('][')) {
      raw = '[' + raw.replace(/\]\s*\[/g, ',') + ']'
    }
    let data
    try { data = JSON.parse(raw) } catch { data = JSON.parse('[' + raw + ']') }
    const arr = data.flat ? data.flat() : Array.isArray(data) ? data : [data]
    for (const e of arr) {
      total++
      const key = (e.title_orthography || e.key || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')
      if (key && e.senses) {
        const senseStr = trimSenses(flattenSenses(e.senses))
        if (!index[key]) index[key] = []
        index[key].push({
          o: e.title_orthography || e.key || '',
          p: e.part_of_speech || '',
          n: (e.main_notes || '').slice(0, 150),
          s: senseStr,
        })
      }
    }
  } catch (err) {
    console.error(`Error parsing ls_${letter}.json:`, err.message)
  }
}

function flattenSenses(s) {
  if (typeof s === 'string') return s
  if (Array.isArray(s)) return s.map(flattenSenses).join(' || ')
  if (typeof s === 'object' && s !== null) return Object.values(s).map(flattenSenses).join(' || ')
  return String(s)
}

function trimSenses(s) {
  if (s.length <= MAX_SENSE_LEN) return s
  // Cut at last sentence/clause boundary before limit
  const cut = s.lastIndexOf('.', MAX_SENSE_LEN)
  if (cut > MAX_SENSE_LEN * 0.5) return s.slice(0, cut + 1)
  return s.slice(0, MAX_SENSE_LEN) + '...'
}

console.log(`Total entries: ${total}`)
console.log(`Unique headwords: ${Object.keys(index).length}`)

const json = JSON.stringify(index)
console.log(`Trimmed JSON size: ${(json.length / 1024 / 1024).toFixed(1)} MB`)

writeFileSync(new URL('../src/data/lewis-short.json', import.meta.url), json)
console.log('Saved to src/data/lewis-short.json')
