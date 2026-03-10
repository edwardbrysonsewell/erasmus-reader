// Parse the fetched Erasmus text file into a JSON data file
import { readFileSync, writeFileSync } from 'fs'

const raw = readFileSync('/tmp/erasmus_colloquia_familiaria_latin.txt', 'utf8')

const colloquia = []
const blocks = raw.split(/^={80}$/m)

for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i].trim()
  const titleMatch = block.match(/^TITLE:\s*(.+)$/m)
  if (!titleMatch) continue

  const title = titleMatch[1].trim()
  const wordCountMatch = block.match(/^WORD COUNT:\s*(\d+)$/m)
  const wordCount = wordCountMatch ? parseInt(wordCountMatch[1]) : 0

  // The text is in the NEXT block
  const textBlock = blocks[i + 1]
  if (!textBlock) continue

  // Clean the text: remove [END OF ...] markers, navigation, and footnote markers
  let text = textBlock.trim()
  text = text.replace(/\[END OF .+?\]\s*$/i, '').trim()
  // Remove Wikisource navigation lines at the end (previous/next dialogue names)
  text = text.replace(/\n[←→◄►].+$/gm, '').trim()
  // Remove footnote reference numbers like [1], [2] in text
  // But keep the actual text clean
  text = text.replace(/\[\d+\]/g, '').trim()
  // Remove footnote sections (lines starting with ↑)
  text = text.replace(/\n↑.+$/gm, '').trim()
  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  if (text.length > 10) {
    colloquia.push({ id: slugify(title), title, wordCount, text })
    i++ // skip the text block
  }
}

function slugify(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Sort by title
colloquia.sort((a, b) => a.title.localeCompare(b.title))

writeFileSync(
  new URL('../src/data/colloquia.json', import.meta.url),
  JSON.stringify(colloquia, null, 0)
)

console.log(`Parsed ${colloquia.length} colloquia`)
colloquia.forEach(c => console.log(`  ${c.title} (${c.wordCount} words, ${c.text.length} chars)`))
