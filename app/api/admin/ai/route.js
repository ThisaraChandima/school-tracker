import { NextResponse } from 'next/server'
import { getAuthInfo } from '@/lib/auth'
import supabase from '@/lib/supabase'
import SCHOOLS from '@/lib/schools'
import { getSearchKeywords } from '@/lib/translations'

const GROQ_API_KEY = process.env.GROQ_API_KEY
// Use compound-mini — no daily token limit per Groq dashboard
const GROQ_MODEL = 'groq/compound-mini'
// Fallback model
const FALLBACK_MODEL = 'llama3-8b-8192'

async function callGroq(messages, maxTokens = 800, useCompound = true) {
  const model = useCompound ? GROQ_MODEL : FALLBACK_MODEL

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.2 }),
  })

  if (res.status === 413 || res.status === 429) {
    // Rate limited — try fallback model
    if (useCompound) {
      console.log('Rate limited on compound-mini, trying llama3-8b-8192...')
      return callGroq(messages, maxTokens, false)
    }
    throw new Error('rate_limit')
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

export async function POST(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, query } = await request.json()

  // Fetch all issues
  const { data: issues, error } = await supabase
    .from('issues').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const schoolMap = Object.fromEntries(SCHOOLS.map(s => [s.id, s]))
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

  // ── SEARCH ──
  if (action === 'search') {
    if (!query?.trim()) return NextResponse.json({ results: [], matched_keywords: [] })

    // Get all search keywords including Sinhala translations
    const allKeywords = getSearchKeywords(query)
    const qLower = query.toLowerCase()

    // Score each issue against all keywords (English + Sinhala)
    const scored = enriched.map(i => {
      const text = i.text.toLowerCase()
      let score = 0

      // Exact phrase match (highest score)
      if (text.includes(qLower)) score += 10

      // Keyword matches
      allKeywords.forEach(kw => {
        const kwL = kw.toLowerCase()
        if (text.includes(kwL)) score += kwL.length > 3 ? 3 : 1
      })

      return { ...i, score }
    }).filter(i => i.score > 0).sort((a, b) => b.score - a.score)

    // Return top 30 directly — no need to call AI for every search
    const results = scored.slice(0, 30)

    // Only call AI if we have candidates and it's an ambiguous/short query
    const sinhalaMatched = allKeywords.filter(k => /[\u0D80-\u0DFF]/.test(k))

    return NextResponse.json({
      results,
      method: results.length > 0 ? 'keyword+sinhala' : 'none',
      matched_keywords: allKeywords,
      query,
    })
  }

  // ── SUMMARY ──
  if (action === 'summary') {
    const open = enriched.filter(i => !i.done)
    const done = enriched.filter(i => i.done)

    // Build frequency map without AI
    const termFreq = {}
    open.forEach(i => {
      i.text.replace(/[^\u0D80-\u0DFFa-zA-Z\s]/g, '').split(/\s+/).forEach(w => {
        if (w.length > 2) termFreq[w] = (termFreq[w] || 0) + 1
      })
    })
    const topTerms = Object.entries(termFreq).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([t,n])=>`${t}(${n})`).join(', ')

    // Sample issues - keep prompt small to avoid rate limits
    const sample = open.slice(0, 40).map(i => i.text).join(' | ')

    const prompt = `Analyze school infrastructure issues from Mawanella Education Zone, Sri Lanka.

Stats: ${enriched.length} total issues, ${open.length} open, ${done.length} resolved (${Math.round(done.length/enriched.length*100)}% resolved)
Common terms: ${topTerms}
Sample issues (Sinhala text): ${sample.slice(0, 800)}

Write a concise executive summary (3 short paragraphs) in English:
1. Most critical problem categories
2. Resolution progress & priorities  
3. Key recommendations

Be direct and actionable. Keep it brief.`

    try {
      const summary = await callGroq([{ role: 'user', content: prompt }], 500)
      return NextResponse.json({ summary })
    } catch (e) {
      if (e.message === 'rate_limit') {
        return NextResponse.json({ error: 'Rate limit reached. Please wait 1 minute and try again.' }, { status: 429 })
      }
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // ── CATEGORISE ──
  if (action === 'categorise') {
    const open = enriched.filter(i => !i.done)

    // Pre-categorise using keyword dictionary (no AI needed for basic categories)
    const CATEGORIES = [
      { name: 'Teacher Shortage',      icon: '👨‍🏫', keywords: ['ගුරු හිඟ', 'ගුරු හිඟය', 'ගුරු'] },
      { name: 'No Laboratory',         icon: '🔬', keywords: ['විද්‍යාගාරයක්', 'විද්‍යාගාර'] },
      { name: 'No Library',            icon: '📚', keywords: ['පුස්තකාල', 'පුස්තකාලයක්'] },
      { name: 'No Computers / IT',     icon: '💻', keywords: ['පරිගණක', 'computer', 'තාක්ෂණ'] },
      { name: 'Toilet / Sanitation',   icon: '🚿', keywords: ['වැසිකිලි', 'කැසිකිලි'] },
      { name: 'No Tech Lab',           icon: '🔧', keywords: ['තාක්ෂණ විද්‍යාගාර', 'තාක්ෂණ'] },
      { name: 'Building / Infrastructure', icon: '🏗️', keywords: ['ගොඩනැගිලි', 'ගොඩනැගිල්ල', 'ප්‍රතිසංස්කරණ', 'ගෙ'] },
      { name: 'Student Shortage',      icon: '👥', keywords: ['සිසුන්', 'ශිෂ්‍ය'] },
    ]

    const result = CATEGORIES.map(cat => {
      const matched = open.filter(issue =>
        cat.keywords.some(kw => issue.text.includes(kw))
      )
      return {
        ...cat,
        count: matched.length,
        ids: matched.map(i => i.id),
        issues: matched.slice(0, 5),
      }
    }).filter(c => c.count > 0).sort((a,b) => b.count - a.count)

    // Other/uncategorised
    const categorisedIds = new Set(result.flatMap(c => c.ids))
    const other = open.filter(i => !categorisedIds.has(i.id))
    if (other.length > 0) {
      result.push({ name: 'Other Issues', icon: '📋', count: other.length, ids: other.map(i=>i.id), issues: other.slice(0,5) })
    }

    // If we have leftover capacity, call Groq to name any uncategorised patterns
    if (other.length > 5 && GROQ_API_KEY) {
      const sample = other.slice(0, 20).map(i => i.text).join(' | ')
      try {
        const prompt = `These are uncategorised school issues (in Sinhala): ${sample.slice(0,500)}

List 2-3 common themes from these in English (e.g. "Water Supply", "Furniture"). Return ONLY a JSON array of strings: ["Theme1","Theme2"]`
        const raw = await callGroq([{ role:'user', content: prompt }], 150)
        const match = raw.match(/\[.*?\]/)
        if (match) {
          const themes = JSON.parse(match[0])
          result[result.length-1].subthemes = themes
        }
      } catch { /* silent fail — categories already work without this */ }
    }

    return NextResponse.json({ categories: result })
  }

  // ── CHART DATA (no AI) ──
  if (action === 'chartdata') {
    const bySchool = {}
    enriched.forEach(i => {
      if (!bySchool[i.school_id]) bySchool[i.school_id] = { name: i.school, en: i.school_en, open:0, done:0 }
      i.done ? bySchool[i.school_id].done++ : bySchool[i.school_id].open++
    })
    const schoolList = Object.values(bySchool).map(s=>({...s,total:s.open+s.done}))
    const top10Open  = [...schoolList].sort((a,b)=>b.open-a.open).slice(0,10)
    const top10Total = [...schoolList].sort((a,b)=>b.total-a.total).slice(0,10)

    const byType = {}
    enriched.forEach(i => {
      const type = schoolMap[i.school_id]?.type || 'Unknown'
      if (!byType[type]) byType[type] = { open:0, done:0 }
      i.done ? byType[type].done++ : byType[type].open++
    })
    const typeData = Object.entries(byType).map(([type,d])=>({type,...d,total:d.open+d.done})).filter(d=>d.total>0).sort((a,b)=>b.total-a.total)

    const byMonth = {}
    enriched.forEach(i => {
      const month = i.date?.slice(0,7)||'Unknown'
      if (!byMonth[month]) byMonth[month] = { created:0, resolved:0 }
      byMonth[month].created++
      if (i.done) byMonth[month].resolved++
    })

    return NextResponse.json({
      total:enriched.length, open:enriched.filter(i=>!i.done).length,
      done:enriched.filter(i=>i.done).length, withImage:enriched.filter(i=>i.has_image).length,
      top10Open, top10Total, typeData, byMonth:Object.entries(byMonth).sort(),
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
