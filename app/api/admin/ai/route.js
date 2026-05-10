import { NextResponse } from 'next/server'
import { getAuthInfo } from '@/lib/auth'
import supabase from '@/lib/supabase'
import SCHOOLS from '@/lib/schools'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = 'llama-3.1-8b-instant'

async function callGroq(messages, maxTokens = 1024) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error: ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

export async function POST(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, query } = await request.json()

  // Fetch all issues from Supabase
  const { data: issues, error } = await supabase
    .from('issues').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const schoolMap = Object.fromEntries(SCHOOLS.map(s => [s.id, s]))

  // Enrich issues with school name
  const enriched = issues.map(i => ({
    id: i.id,
    school_id: i.school_id,
    school: schoolMap[i.school_id]?.name || String(i.school_id),
    school_en: schoolMap[i.school_id]?.address_en || '',
    text: i.text,
    done: i.done,
    date: i.created_at?.slice(0, 10),
    has_image: !!i.image_url,
  }))

  // ── ACTION: semantic search ──
  if (action === 'search') {
    if (!query?.trim()) return NextResponse.json({ results: [] })

    // First do fast keyword filter (find candidates)
    const qLower = query.toLowerCase()
    const keywords = qLower.split(/\s+/).filter(w => w.length > 2)

    // Score each issue
    const scored = enriched.map(i => {
      const text = i.text.toLowerCase()
      let score = 0
      keywords.forEach(k => { if (text.includes(k)) score += 2 })
      if (text.includes(qLower)) score += 5
      return { ...i, score }
    }).filter(i => i.score > 0)

    // Take top 30 candidates for Groq to re-rank and interpret
    const candidates = scored.sort((a, b) => b.score - a.score).slice(0, 40)

    if (candidates.length === 0) {
      // Let Groq try a broader semantic match on all issues
      const allTexts = enriched.slice(0, 200).map(i => `[${i.id}] ${i.text}`).join('\n')
      const prompt = `You are analyzing school issues in Sri Lanka. Find issues relevant to: "${query}"

Issues list (format: [id] issue text):
${allTexts}

Return ONLY a JSON array of matching issue IDs (numbers), max 20 results. Example: [1,5,23]
If nothing matches, return [].`

      try {
        const raw = await callGroq([{ role: 'user', content: prompt }], 256)
        const match = raw.match(/\[[\d,\s]*\]/)
        const ids = match ? JSON.parse(match[0]) : []
        const results = enriched.filter(i => ids.includes(i.id))
        return NextResponse.json({ results, method: 'ai', query })
      } catch {
        return NextResponse.json({ results: [], method: 'keyword', query })
      }
    }

    // Use Groq to re-rank and filter candidates semantically
    const candidateText = candidates.map(i => `[${i.id}] ${i.text}`).join('\n')
    const prompt = `You are analyzing school issues in Sri Lanka written in Sinhala.
User searched for: "${query}"

From these candidate issues, select the ones that are genuinely relevant to the search:
${candidateText}

Return ONLY a JSON array of relevant issue IDs. Example: [1,5,23]
Be inclusive — include anything loosely related. Return [] if truly nothing matches.`

    let results = candidates
    try {
      const raw = await callGroq([{ role: 'user', content: prompt }], 256)
      const match = raw.match(/\[[\d,\s]*\]/)
      if (match) {
        const ids = JSON.parse(match[0])
        const filtered = candidates.filter(i => ids.includes(i.id))
        if (filtered.length > 0) results = filtered
      }
    } catch { /* fallback to keyword results */ }

    return NextResponse.json({ results: results.slice(0, 25), method: 'ai', query })
  }

  // ── ACTION: zone summary ──
  if (action === 'summary') {
    const open = enriched.filter(i => !i.done)
    const done = enriched.filter(i => i.done)

    // Cluster open issues by frequency of terms
    const termFreq = {}
    open.forEach(i => {
      const words = i.text.replace(/[^\u0D80-\u0DFFa-zA-Z\s]/g, '').split(/\s+/)
      words.forEach(w => {
        if (w.length > 2) termFreq[w] = (termFreq[w] || 0) + 1
      })
    })
    const topTerms = Object.entries(termFreq).sort((a,b) => b[1]-a[1]).slice(0, 20).map(([t,n]) => `${t}(${n})`).join(', ')

    const sample = open.slice(0, 60).map(i => i.text).join(' | ')

    const prompt = `You are an education analyst. Analyze these school infrastructure issues from the Mawanella Education Zone, Sri Lanka.

Total issues: ${enriched.length} (${open.length} open, ${done.length} resolved)
Common terms: ${topTerms}
Sample issues: ${sample}

Write a concise English executive summary (3-4 paragraphs) covering:
1. Most critical problem categories
2. Resolution progress
3. Schools most needing attention
4. Key recommendations

Be direct and actionable. Use plain English.`

    try {
      const summary = await callGroq([{ role: 'user', content: prompt }], 600)
      return NextResponse.json({ summary })
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // ── ACTION: categorise ──
  if (action === 'categorise') {
    const open = enriched.filter(i => !i.done)
    const sample = open.slice(0, 150).map(i => `[${i.id}] ${i.text}`).join('\n')

    const prompt = `Categorise these school issues from Sri Lanka into groups.

Issues:
${sample}

Return ONLY valid JSON in this exact format:
{
  "categories": [
    {"name": "Teacher Shortage", "ids": [1,2,3], "icon": "👨‍🏫"},
    {"name": "Lab/Science Facilities", "ids": [4,5], "icon": "🔬"},
    {"name": "Library", "ids": [6], "icon": "📚"},
    {"name": "Computers/IT", "ids": [7,8], "icon": "💻"},
    {"name": "Toilets/Sanitation", "ids": [9], "icon": "🚿"},
    {"name": "Building/Infrastructure", "ids": [10], "icon": "🏗️"}
  ]
}

Use 4-8 categories. Only include IDs from the list above.`

    try {
      const raw = await callGroq([{ role: 'user', content: prompt }], 800)
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON found')
      const parsed = JSON.parse(match[0])
      // Enrich with issue details
      const idMap = Object.fromEntries(open.map(i => [i.id, i]))
      parsed.categories = parsed.categories.map(cat => ({
        ...cat,
        count: cat.ids.length,
        issues: cat.ids.slice(0, 5).map(id => idMap[id]).filter(Boolean),
      }))
      return NextResponse.json(parsed)
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // ── ACTION: chart data (no Groq needed) ──
  if (action === 'chartdata') {
    const bySchool = {}
    enriched.forEach(i => {
      if (!bySchool[i.school_id]) bySchool[i.school_id] = { name: i.school, en: i.school_en, open: 0, done: 0 }
      i.done ? bySchool[i.school_id].done++ : bySchool[i.school_id].open++
    })

    const schoolList = Object.values(bySchool)
      .map(s => ({ ...s, total: s.open + s.done }))
      .sort((a, b) => b.open - a.open)

    const top10Open = schoolList.slice(0, 10)
    const top10Total = [...schoolList].sort((a,b) => b.total - a.total).slice(0, 10)

    // Resolution rate by type
    const byType = {}
    SCHOOLS.forEach(s => {
      const type = s.type || 'Unknown'
      if (!byType[type]) byType[type] = { open: 0, done: 0 }
    })
    enriched.forEach(i => {
      const school = schoolMap[i.school_id]
      const type = school?.type || 'Unknown'
      if (!byType[type]) byType[type] = { open: 0, done: 0 }
      i.done ? byType[type].done++ : byType[type].open++
    })

    const typeData = Object.entries(byType)
      .map(([type, d]) => ({ type, ...d, total: d.open + d.done }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)

    // Timeline: issues by month
    const byMonth = {}
    enriched.forEach(i => {
      const month = i.date?.slice(0, 7) || 'Unknown'
      if (!byMonth[month]) byMonth[month] = { created: 0, resolved: 0 }
      byMonth[month].created++
      if (i.done) byMonth[month].resolved++
    })

    return NextResponse.json({
      total: enriched.length,
      open: enriched.filter(i => !i.done).length,
      done: enriched.filter(i => i.done).length,
      withImage: enriched.filter(i => i.has_image).length,
      top10Open,
      top10Total,
      typeData,
      byMonth: Object.entries(byMonth).sort(),
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
