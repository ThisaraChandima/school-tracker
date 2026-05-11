import { NextResponse } from 'next/server'
import { getAuthInfo } from '@/lib/auth'
import supabase from '@/lib/supabase'
import SCHOOLS from '@/lib/schools'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const MODEL = 'llama-3.1-8b-instant'

export async function POST(request) {
  const { isAdmin } = getAuthInfo()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await request.json()

  // Fetch live stats for context
  const { data: issues } = await supabase.from('issues').select('school_id, text, done, created_at')
  const schoolMap = Object.fromEntries(SCHOOLS.map(s => [s.id, s]))

  const total = issues?.length || 0
  const open  = issues?.filter(i => !i.done).length || 0
  const done  = issues?.filter(i => i.done).length || 0

  // Build school summary (top 10 by open issues)
  const bySchool = {}
  issues?.forEach(i => {
    if (!bySchool[i.school_id]) bySchool[i.school_id] = { name: schoolMap[i.school_id]?.name || String(i.school_id), open: 0, done: 0 }
    i.done ? bySchool[i.school_id].done++ : bySchool[i.school_id].open++
  })
  const top5 = Object.values(bySchool).sort((a, b) => b.open - a.open).slice(0, 5)
    .map(s => `${s.name}: ${s.open} open, ${s.done} done`).join('\n')

  // Sample open issues
  const sampleIssues = issues?.filter(i => !i.done).slice(0, 30)
    .map(i => `- [${schoolMap[i.school_id]?.name || i.school_id}] ${i.text}`).join('\n') || ''

  const systemPrompt = `You are an AI assistant for the Mawanella Education Zone School Issue Tracker, Sri Lanka.

LIVE DATA (as of now):
- Total issues: ${total} (${open} open, ${done} resolved, ${total ? Math.round(done/total*100) : 0}% resolved)
- Total schools: ${SCHOOLS.length} schools in the zone
- Schools with most open issues:
${top5}

Sample open issues (Sinhala text):
${sampleIssues.slice(0, 1200)}

You can answer questions about:
- Zone statistics and progress
- Specific schools and their issues
- Issue categories (teacher shortages, labs, computers, toilets etc.)
- Recommendations for prioritization
- Trends and patterns

Be concise, helpful and data-driven. Use bullet points when listing items.
If asked about a specific school, search the data above.
Respond in English unless asked otherwise.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 600,
        temperature: 0.4,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      if (res.status === 413 || res.status === 429) {
        return NextResponse.json({ error: 'Rate limit reached. Please wait a moment.' }, { status: 429 })
      }
      return NextResponse.json({ error: err.error?.message || 'AI error' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ reply: data.choices[0].message.content })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
