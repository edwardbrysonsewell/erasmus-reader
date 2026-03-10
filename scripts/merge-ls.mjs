import { readFileSync, writeFileSync } from 'fs'

const index = {}
let total = 0

for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) {
  try {
    let raw = readFileSync(`/tmp/ls-json/ls_${letter}.json`, 'utf8').trim()
    // Handle possible concatenated arrays
    if (raw.startsWith('[') && raw.includes('][')) {
      raw = '[' + raw.replace(/\]\s*\[/g, ',') + ']'
    }
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      // Try wrapping in array
      data = JSON.parse('[' + raw + ']')
    }
    const arr = data.flat ? data.flat() : Array.isArray(data) ? data : [data]
    for (const e of arr) {
      total++
      const key = (e.title_orthography || e.key || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')
      if (key && e.senses) {
        // Flatten senses to a single string
        const senseStr = flattenSenses(e.senses)
        if (!index[key]) index[key] = []
        index[key].push({
          o: e.title_orthography || e.key || '',
          p: e.part_of_speech || '',
          n: (e.main_notes || '').slice(0, 200),
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
  if (Array.isArray(s)) return s.map(flattenSenses).join(' ')
  if (typeof s === 'object' && s !== null) return Object.values(s).map(flattenSenses).join(' ')
  return String(s)
}

console.log(`Total entries parsed: ${total}`)
console.log(`Unique headwords: ${Object.keys(index).length}`)

const json = JSON.stringify(index)
console.log(`Index JSON size: ${(json.length / 1024 / 1024).toFixed(1)} MB`)

writeFileSync('/tmp/ls-json/ls_merged.json', json)
console.log('Saved to /tmp/ls-json/ls_merged.json')
