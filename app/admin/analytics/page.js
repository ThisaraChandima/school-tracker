'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ── Mini bar chart ── */
function BarChart({ data, valueKey = 'open', labelKey = 'name', color = '#1a56db', maxBars = 10 }) {
  const items = data.slice(0, maxBars)
  const max = Math.max(...items.map(d => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="si" style={{ width: 160, fontSize: 12, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'right' }} title={d[labelKey]}>
            {d[labelKey]}
          </div>
          <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 22, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: 4, width: `${(d[valueKey] / max) * 100}%`,
              background: color, transition: 'width .8s cubic-bezier(.4,0,.2,1)',
              display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: d[valueKey] > 0 ? 28 : 0,
            }}>
              {d[valueKey] > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{d[valueKey]}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Donut chart (pure CSS/SVG) ── */
function DonutChart({ open, done }) {
  const total = open + done
  const pct = total ? Math.round((done / total) * 100) : 0
  const r = 52, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const dashDone = (done / total) * circ
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a56db" strokeWidth={14}
          strokeDasharray={`${dashDone} ${circ - dashDone}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#16a34a" strokeWidth={14}
          strokeDasharray={`${dashDone} ${circ}`}
          strokeDashoffset={0}
          style={{ opacity: 0 }} />
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.04em' }}>{pct}%</div>
        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Resolved</div>
      </div>
    </div>
  )
}

/* ── Type bar ── */
function TypeBar({ type, open, done }) {
  const total = open + done
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div style={{ background: '#f7f8fa', borderRadius: 12, padding: '14px 16px', border: '1.5px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Type {type}</span>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{total} issues · {pct}% done</span>
      </div>
      <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#1a56db,#16a34a)', borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠ {open} open</span>
        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ {done} done</span>
      </div>
    </div>
  )
}

/* ── Issue result card ── */
function IssueResult({ issue, highlight = '' }) {
  const text = issue.text || ''
  const hl = highlight.toLowerCase()
  let display = text
  if (hl && text.toLowerCase().includes(hl)) {
    const idx = text.toLowerCase().indexOf(hl)
    display = (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: '#fef9c3', color: '#92400e', borderRadius: 3, padding: '0 2px' }}>
          {text.slice(idx, idx + hl.length)}
        </mark>
        {text.slice(idx + hl.length)}
      </>
    )
  }
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: issue.done ? '#16a34a' : '#dc2626', marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="si" style={{ fontSize: 13.5, color: '#111827', lineHeight: 1.7 }}>{display}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="si" style={{ fontSize: 11, fontWeight: 600, color: '#1a56db', background: '#eff6ff', padding: '2px 8px', borderRadius: 20 }}>{issue.school}</span>
          {issue.school_en && <span style={{ fontSize: 11, color: '#9ca3af' }}>{issue.school_en}</span>}
          <span style={{ fontSize: 11, color: issue.done ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{issue.done ? '✓ Resolved' : '⚠ Open'}</span>
          {issue.has_image && <span style={{ fontSize: 11, color: '#6b7280' }}>📷</span>}
          <span style={{ fontSize: 11, color: '#d1d5db' }}>{issue.date}</span>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  // Data
  const [chartData, setChartData] = useState(null)
  const [chartLoading, setChartLoading] = useState(true)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchMethod, setSearchMethod] = useState('')
  const searchRef = useRef(null)

  // Summary
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Categories
  const [categories, setCategories] = useState(null)
  const [catLoading, setCatLoading] = useState(false)

  // Active chart tab
  const [chartTab, setChartTab] = useState('open')

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      if (!d.loggedIn || d.role !== 'admin') { router.push('/login'); return }
      setAuthChecked(true)
      loadChartData()
    })
  }, [])

  const callAI = async (action, extra = {}) => {
    const res = await fetch('/api/admin/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  }

  const loadChartData = async () => {
    setChartLoading(true)
    try {
      const data = await callAI('chartdata')
      setChartData(data)
    } catch (e) { console.error(e) }
    setChartLoading(false)
  }

  const doSearch = async (q = searchQuery) => {
    if (!q.trim()) return
    setSearchLoading(true); setSearchResults(null)
    try {
      const data = await callAI('search', { query: q })
      setSearchResults(data.results || [])
      setSearchMethod(data.method || '')
    } catch (e) { setSearchResults([]) }
    setSearchLoading(false)
  }

  const loadSummary = async () => {
    setSummaryLoading(true); setSummary('')
    try {
      const data = await callAI('summary')
      setSummary(data.summary || '')
    } catch (e) { setSummary('Failed to generate summary. Please try again.') }
    setSummaryLoading(false)
  }

  const loadCategories = async () => {
    setCatLoading(true); setCategories(null)
    try {
      const data = await callAI('categorise')
      setCategories(data.categories || [])
    } catch (e) { setCategories([]) }
    setCatLoading(false)
  }

  const logout = async () => { await fetch('/api/auth', { method: 'DELETE' }); router.push('/') }

  const QUICK_SEARCHES = [
    'teacher shortage', 'no laboratory', 'no library', 'no computers',
    'toilet shortage', 'technology lab', 'building repair', 'water supply'
  ]

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}>
      <div className="loading-text">Checking access...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: 'var(--font)' }}>

      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-emblem" style={{ background: '#7c3aed', fontSize: 14 }}>🤖</div>
          <div><div className="topbar-title">AI Analytics</div></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <Link href="/admin" className="btn btn-ghost btn-sm">⚙️ Admin Panel</Link>
          <Link href="/tracker" className="btn btn-ghost btn-sm">📋 Tracker</Link>
          <Link href="/" className="btn btn-ghost btn-sm">🏠</Link>
          <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* HEADER */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Powered by Groq · Llama 3.1</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827', marginBottom: 4 }}>AI Issue Analytics</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Search issues in plain English, view charts, get AI-generated zone insights, and explore issue categories.</p>
        </div>

        {/* ── STAT STRIP ── */}
        {chartData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
            {[
              { icon: '📋', n: chartData.total,     l: 'Total Issues',  c: '' },
              { icon: '⚠️', n: chartData.open,      l: 'Open',          c: '#dc2626' },
              { icon: '✅', n: chartData.done,      l: 'Resolved',      c: '#16a34a' },
              { icon: '📷', n: chartData.withImage, l: 'With Photos',   c: '#1a56db' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.c || '#111827', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>{s.n}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── AI SEARCH ── */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, background: '#7c3aed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔍</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 1 }}>AI Issue Search</h2>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>Search in plain English — finds issues even with different wording</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
              <input
                ref={searchRef}
                className="input"
                style={{ paddingLeft: 38, fontSize: 15 }}
                type="text"
                placeholder='e.g. "need desks", "teacher missing", "no lab"...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
              />
            </div>
            <button className="btn btn-primary" onClick={() => doSearch()} disabled={searchLoading || !searchQuery.trim()} style={{ minWidth: 110 }}>
              {searchLoading ? '⏳ Searching...' : '🤖 AI Search'}
            </button>
            {searchResults !== null && (
              <button className="btn btn-ghost" onClick={() => { setSearchResults(null); setSearchQuery('') }}>Clear</button>
            )}
          </div>

          {/* Quick search chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: searchResults !== null ? 16 : 0 }}>
            {QUICK_SEARCHES.map(q => (
              <button key={q} onClick={() => { setSearchQuery(q); doSearch(q) }}
                style={{ background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#1a56db'; e.currentTarget.style.color = '#1a56db' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Search results */}
          {searchLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: 14 }}>
              <div style={{ fontSize: 28, marginBottom: 8, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</div>
              <p>AI is searching through all issues...</p>
            </div>
          )}

          {searchResults !== null && !searchLoading && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</span>
                {searchMethod && searchMethod !== 'none' && (
                <span style={{fontSize:11,background:'#f5f3ff',color:'#7c3aed',padding:'2px 8px',borderRadius:20,fontWeight:700,border:'1px solid #ddd6fe'}}>
                  🌐 Sinhala + English
                </span>
              )}
              {searchMethod === 'ai' && (
                  <span style={{ fontSize: 11, background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, fontWeight: 700, border: '1px solid #ddd6fe' }}>🤖 AI ranked</span>
                )}
              </div>
              {searchResults.length === 0
                ? <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 14 }}>No matching issues found. Try different keywords.</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                    {searchResults.map(i => <IssueResult key={i.id} issue={i} highlight={searchQuery} />)}
                  </div>
              }
            </div>
          )}
        </div>

        {/* ── CHARTS ── */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: '#0284c7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Issue Distribution</h2>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['open','Most Open'],['total','Most Issues'],['type','By Type']].map(([v,l]) => (
                <button key={v} onClick={() => setChartTab(v)}
                  style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all .15s', background: chartTab===v ? '#111827' : '#f3f4f6', color: chartTab===v ? '#fff' : '#6b7280' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <div className="loading-text">Loading chart data...</div>
          ) : chartData ? (
            <div style={{ display: 'grid', gridTemplateColumns: chartTab === 'type' ? '1fr' : '1fr auto', gap: 24, alignItems: 'center' }}>
              {chartTab === 'open' && (
                <>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Top 10 schools with most open issues</p>
                    <BarChart data={chartData.top10Open} valueKey="open" labelKey="name" color="#dc2626" />
                  </div>
                  <DonutChart open={chartData.open} done={chartData.done} />
                </>
              )}
              {chartTab === 'total' && (
                <>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Top 10 schools by total issues logged</p>
                    <BarChart data={chartData.top10Total} valueKey="total" labelKey="name" color="#1a56db" />
                  </div>
                  <DonutChart open={chartData.open} done={chartData.done} />
                </>
              )}
              {chartTab === 'type' && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Issue distribution and resolution rate by school type</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
                    {chartData.typeData.map((d, i) => <TypeBar key={i} {...d} />)}
                  </div>
                </div>
              )}
            </div>
          ) : <div className="no-issues">Failed to load chart data</div>}
        </div>

        {/* ── AI SUMMARY ── */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: '#059669', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📝</div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 1 }}>AI Zone Summary</h2>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>AI-generated executive summary of all current issues</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadSummary} disabled={summaryLoading} style={{ flexShrink: 0 }}>
              {summaryLoading ? '⏳ Generating...' : summary ? '🔄 Regenerate' : '✨ Generate Summary'}
            </button>
          </div>

          {summaryLoading && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #d1fae5', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite', display: 'inline-block' }}>🤖</div>
              <p style={{ fontSize: 14, color: '#059669', fontWeight: 500 }}>AI is analysing all 421+ issues...</p>
            </div>
          )}

          {summary && !summaryLoading && (
            <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ borderLeft: '4px solid #059669', paddingLeft: 16 }}>
                {summary.split('\n').filter(p => p.trim()).map((para, i) => (
                  <p key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, marginBottom: i < summary.split('\n').filter(p=>p.trim()).length - 1 ? 14 : 0 }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          {!summary && !summaryLoading && (
            <div style={{ textAlign: 'center', padding: '32px', border: '1.5px dashed #d1d5db', borderRadius: 12, color: '#9ca3af' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Click "Generate Summary" to get an AI-written analysis of all zone issues</p>
            </div>
          )}
        </div>

        {/* ── AI CATEGORIES ── */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: '#d97706', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏷️</div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 1 }}>AI Issue Categories</h2>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>AI automatically groups open issues into categories</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadCategories} disabled={catLoading} style={{ flexShrink: 0 }}>
              {catLoading ? '⏳ Analysing...' : categories ? '🔄 Re-analyse' : '🤖 Analyse Categories'}
            </button>
          </div>

          {catLoading && (
            <div style={{ textAlign: 'center', padding: 24, color: '#d97706', fontSize: 14, fontWeight: 500 }}>
              <div style={{ fontSize: 28, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite', display: 'inline-block' }}>🏷️</div>
              <p>AI is categorising all open issues...</p>
            </div>
          )}

          {categories && !catLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
              {categories.map((cat, i) => (
                <div key={i} style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{cat.name}</div>
                      <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>{cat.count} issues</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <div style={{ background: '#f59e0b', color: '#fff', borderRadius: 100, padding: '3px 10px', fontSize: 12, fontWeight: 800 }}>{cat.count}</div>
                    </div>
                  </div>
                  {cat.issues?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {cat.issues.slice(0, 3).map((issue, j) => (
                        <div key={j} className="si" style={{ fontSize: 12, color: '#78350f', background: 'rgba(255,255,255,0.7)', borderRadius: 7, padding: '6px 10px', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={issue.text}>
                          {issue.text}
                        </div>
                      ))}
                      {cat.count > 3 && <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600, paddingLeft: 10 }}>+{cat.count - 3} more</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!categories && !catLoading && (
            <div style={{ textAlign: 'center', padding: '32px', border: '1.5px dashed #d1d5db', borderRadius: 12, color: '#9ca3af' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏷️</div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Click "Analyse Categories" to group all open issues automatically</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
