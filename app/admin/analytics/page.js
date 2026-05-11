'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ═══════════════════════════════════════
   CHART COMPONENTS
═══════════════════════════════════════ */

/* Animated donut */
function Donut({ value, total, size = 120, stroke = 14, color = '#1a56db', label = '' }) {
  const [animated, setAnimated] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setAnimated(value), 100); obs.disconnect() }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [value])
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? animated / total : 0
  const dash = pct * circ
  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: size * 0.18, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.04em' }}>
          {total > 0 ? Math.round((animated / total) * 100) : 0}%
        </div>
        {label && <div style={{ fontSize: size * 0.09, color: '#9ca3af', fontWeight: 600, marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  )
}

/* Animated horizontal bar */
function HBar({ label, value, max, color = '#1a56db', sublabel = '', delay = 0 }) {
  const [w, setW] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setW(max > 0 ? (value / max) * 100 : 0), delay); obs.disconnect() }
    }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [value, max])
  return (
    <div ref={ref} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
        <span className="si" style={{ fontSize: 12, fontWeight: 600, color: '#374151', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>{label}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {sublabel && <span style={{ fontSize: 10, color: '#9ca3af' }}>{sublabel}</span>}
          <span style={{ fontSize: 13, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</span>
        </div>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 6, transition: `width 0.9s cubic-bezier(.4,0,.2,1) ${delay}ms`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
        </div>
      </div>
    </div>
  )
}

/* Radial progress ring */
function RadialRing({ label, value, max, color, icon, size = 90 }) {
  const [anim, setAnim] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setAnim(value), 150); obs.disconnect() }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [value])
  const r = 32, stroke = 7, circ = 2 * Math.PI * r
  const pct = max > 0 ? anim / max : 0
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={40} cy={40} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.4,0,.2,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

/* Area / timeline chart (SVG) */
function AreaChart({ data, color = '#1a56db', height = 120 }) {
  const [anim, setAnim] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setAnim(true); obs.disconnect() } }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  if (!data || data.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>Not enough data</div>
  const W = 600, H = height
  const maxV = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => ({ x: (i / (data.length - 1)) * W, y: H - (d.value / maxV) * (H - 16) - 8 }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`
  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden', borderRadius: 10 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <defs>
          <linearGradient id={`ag${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#ag${color.replace('#','')})`}
          style={{ opacity: anim ? 1 : 0, transition: 'opacity 0.8s ease' }} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: anim ? 'none' : '2000', strokeDashoffset: anim ? 0 : 2000, transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }} />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color}
            style={{ opacity: anim ? 1 : 0, transition: `opacity 0.3s ease ${i * 80}ms` }} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
        {data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)).map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

/* Stacked type bar */
function StackedBar({ type, open, done, maxTotal, delay = 0 }) {
  const [anim, setAnim] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setAnim(true), delay); obs.disconnect() } }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  const total = open + done
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const barW = maxTotal > 0 ? (total / maxTotal) * 100 : 0
  return (
    <div ref={ref} style={{ padding: '12px 16px', background: '#f9fafb', borderRadius: 12, border: '1.5px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#111827', background: '#e5e7eb', padding: '2px 8px', borderRadius: 6 }}>Type {type}</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{total} issues</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626' }}>{pct}% done</span>
      </div>
      <div style={{ background: '#e5e7eb', borderRadius: 6, height: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '100%', width: anim ? `${barW}%` : '0%', transition: 'width 0.9s cubic-bezier(.4,0,.2,1)' }}>
          <div style={{ flex: open, background: '#dc2626', borderRadius: '6px 0 0 6px' }} />
          <div style={{ flex: done, background: '#16a34a', borderRadius: open > 0 ? '0 6px 6px 0' : 6 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠ {open} open</span>
        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ {done} done</span>
      </div>
    </div>
  )
}

/* Issue result card */
function IssueResult({ issue, highlight = '' }) {
  const text = issue.text || ''
  const hl = highlight.toLowerCase()
  let display = text
  if (hl && text.toLowerCase().includes(hl)) {
    const idx = text.toLowerCase().indexOf(hl)
    display = <>{text.slice(0, idx)}<mark style={{ background: '#fef9c3', color: '#92400e', borderRadius: 3, padding: '0 2px' }}>{text.slice(idx, idx + hl.length)}</mark>{text.slice(idx + hl.length)}</>
  }
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: issue.done ? '#16a34a' : '#dc2626', marginTop: 7, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="si" style={{ fontSize: 13, color: '#111827', lineHeight: 1.6 }}>{display}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="si" style={{ fontSize: 11, fontWeight: 600, color: '#1a56db', background: '#eff6ff', padding: '1px 7px', borderRadius: 20 }}>{issue.school}</span>
          <span style={{ fontSize: 11, color: issue.done ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{issue.done ? '✓ Resolved' : '⚠ Open'}</span>
          {issue.has_image && <span style={{ fontSize: 10, color: '#6b7280' }}>📷</span>}
          <span style={{ fontSize: 10, color: '#d1d5db' }}>{issue.date}</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   CHAT ASSISTANT
═══════════════════════════════════════ */
function ChatAssistant({ open: chatOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI assistant for the Mawanella School Issue Tracker. Ask me anything about the zone's issues, schools, or statistics." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (chatOpen) inputRef.current?.focus() }, [chatOpen])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0), userMsg] }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'No response.' }])
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]) }
    setLoading(false)
  }

  const SUGGESTIONS = ['What are the most critical issues?', 'Which school has the most problems?', 'How many issues have been resolved?', 'What types of issues are most common?']

  if (!chatOpen) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', right: 16, bottom: 80, width: 'min(420px, calc(100vw - 32px))',
        height: 'min(560px, calc(100vh - 120px))',
        background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        border: '1.5px solid #e5e7eb', zIndex: 300,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'chatSlideUp 0.25s cubic-bezier(.22,1,.36,1)',
      }}>
        <style>{`@keyframes chatSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>AI Assistant</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Powered by Groq · Llama 3.1</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{ width: 26, height: 26, background: '#f5f3ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginRight: 8, marginTop: 2 }}>🤖</div>
              )}
              <div style={{
                maxWidth: '80%', padding: '9px 13px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.role === 'user' ? '#1a56db' : '#f8f9fa',
                color: m.role === 'user' ? '#fff' : '#111827',
                fontSize: 13, lineHeight: 1.65,
                border: m.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, background: '#f5f3ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
              <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', display: 'flex', gap: 5 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#9ca3af', animation: `pulse 1.2s ease-in-out infinite ${i*0.2}s` }} />)}
              </div>
            </div>
          )}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 6 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>SUGGESTED QUESTIONS</div>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus() }}
                  style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 9, padding: '8px 12px', fontSize: 12, color: '#4f46e5', cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f5f3ff'}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 14px', borderTop: '1.5px solid #f3f4f6', display: 'flex', gap: 8 }}>
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask anything about the zone..."
            style={{ flex: 1, padding: '9px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'var(--font)', outline: 'none', color: '#111827', background: '#f9fafb' }} />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loading || !input.trim() ? 0.5 : 1, transition: 'opacity .15s' }}>
            →
          </button>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
const QUICK = ['teacher shortage', 'no laboratory', 'no library', 'no computers', 'toilet shortage', 'technology lab']

export default function AnalyticsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [chartData, setChartData] = useState(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartTab, setChartTab] = useState('open')
  const [searchQ, setSearchQ] = useState('')
  const [searchRes, setSearchRes] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [categories, setCategories] = useState(null)
  const [catLoading, setCatLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      if (!d.loggedIn || d.role !== 'admin') { router.push('/login'); return }
      setAuthChecked(true); loadChartData()
    })
  }, [])

  const call = async (action, extra = {}) => {
    const res = await fetch('/api/admin/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  }

  const loadChartData = async () => {
    setChartLoading(true)
    try { setChartData(await call('chartdata')) } catch (e) { console.error(e) }
    setChartLoading(false)
  }

  const doSearch = async (q = searchQ) => {
    if (!q.trim()) return
    setSearchLoading(true); setSearchRes(null)
    try { const d = await call('search', { query: q }); setSearchRes(d.results || []) } catch { setSearchRes([]) }
    setSearchLoading(false)
  }

  const loadSummary = async () => {
    setSummaryLoading(true); setSummary('')
    try { setSummary((await call('summary')).summary || '') } catch (e) { setSummary('Failed. ' + e.message) }
    setSummaryLoading(false)
  }

  const loadCategories = async () => {
    setCatLoading(true); setCategories(null)
    try { setCategories((await call('categorise')).categories || []) } catch { setCategories([]) }
    setCatLoading(false)
  }

  const logout = async () => { await fetch('/api/auth', { method: 'DELETE' }); router.push('/') }

  // Prepare timeline data
  const timelineData = chartData?.byMonth?.map(([month, d]) => ({
    label: month.slice(5), value: d.created, resolved: d.resolved,
  })) || []

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}>
      <div style={{ fontSize: 14, color: '#9ca3af', animation: 'pulse 1.5s infinite' }}>Checking access...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: 'var(--font)' }}>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .an-card{background:#fff;border-radius:18px;border:1.5px solid #e5e7eb;box-shadow:0 1px 4px rgba(0,0,0,0.05);padding:22px;animation:fadeUp .3s ease both}
        .tab-btn{padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:var(--font);transition:all .18s}
        .chat-fab{position:fixed;right:20px;bottom:20px;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;cursor:pointer;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(79,70,229,0.4);transition:transform .2s;z-index:150}
        .chat-fab:hover{transform:scale(1.08)}
        @media(max-width:640px){
          .an-grid-2{grid-template-columns:1fr!important}
          .topbar-chips{display:none!important}
          .hide-mobile{display:none!important}
          .tab-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
          .tab-row{min-width:max-content}
        }
      `}</style>

      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-emblem" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', fontSize: 14 }}>🤖</div>
          <div><div className="topbar-title">AI Analytics</div></div>
        </div>
        <div className="topbar-chips">
          {chartData && <>
            <div className="topbar-chip"><div className="n" style={{color:'#dc2626'}}>{chartData.open}</div><div className="l">Open</div></div>
            <div className="topbar-chip"><div className="n" style={{color:'#16a34a'}}>{chartData.done}</div><div className="l">Done</div></div>
          </>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          <button onClick={() => setChatOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            🤖 <span className="hide-mobile">Chat</span>
          </button>
          <Link href="/admin" className="btn btn-ghost btn-sm hide-mobile">⚙️ Admin</Link>
          <Link href="/" className="btn btn-ghost btn-sm">🏠</Link>
          <button onClick={logout} className="btn btn-ghost btn-sm hide-mobile">Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* HEADER */}
        <div style={{ animation: 'fadeUp .35s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Powered by Groq · Llama 3.1</p>
          <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111827', marginBottom: 4 }}>AI Analytics Dashboard</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Search issues, view charts, get AI insights, and chat with the assistant.</p>
        </div>

        {/* STAT RINGS */}
        {chartData && (
          <div className="an-card">
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <Donut value={chartData.done} total={chartData.total} size={130} color="#16a34a" label="Resolved" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 20, flex: 1, minWidth: 200 }}>
                <RadialRing label="Schools" value={134}     max={134} color="#1a56db" icon="🏫" />
                <RadialRing label="Total"   value={chartData.total} max={chartData.total} color="#6b7280" icon="📋" />
                <RadialRing label="Open"    value={chartData.open}  max={chartData.total} color="#dc2626" icon="⚠️" />
                <RadialRing label="Photos"  value={chartData.withImage} max={chartData.total} color="#d97706" icon="📷" />
              </div>
            </div>
          </div>
        )}

        {/* CHARTS */}
        <div className="an-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>📊 Issue Distribution</h2>
            <div className="tab-scroll">
              <div className="tab-row" style={{ display: 'flex', gap: 5 }}>
                {[['open','Most Open'],['total','By Volume'],['type','By Type'],['timeline','Timeline']].map(([v,l]) => (
                  <button key={v} className="tab-btn" onClick={() => setChartTab(v)}
                    style={{ background: chartTab===v ? '#111827' : '#f3f4f6', color: chartTab===v ? '#fff' : '#6b7280' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chartLoading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 14, animation: 'pulse 1.5s infinite' }}>Loading charts...</div>
          ) : chartData ? (
            <>
              {(chartTab === 'open' || chartTab === 'total') && (
                <div className="an-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
                      {chartTab === 'open' ? 'Schools with most open issues' : 'Schools with most total issues'}
                    </p>
                    {(chartTab === 'open' ? chartData.top10Open : chartData.top10Total).map((s, i) => (
                      <HBar key={i} label={s.name} value={chartTab==='open'?s.open:s.total}
                        max={chartTab==='open'?chartData.top10Open[0]?.open:chartData.top10Total[0]?.total}
                        color={chartTab==='open'?'#dc2626':'#1a56db'}
                        sublabel={chartTab==='total'?`${s.done} done`:''}
                        delay={i * 60} />
                    ))}
                  </div>
                  <Donut value={chartData.done} total={chartData.total} size={110} color="#1a56db" label="Done" />
                </div>
              )}
              {chartTab === 'type' && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Resolution rate by school type</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
                    {chartData.typeData.map((d, i) => (
                      <StackedBar key={i} type={d.type} open={d.open} done={d.done}
                        maxTotal={Math.max(...chartData.typeData.map(t => t.total))} delay={i * 80} />
                    ))}
                  </div>
                </div>
              )}
              {chartTab === 'timeline' && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Issues logged over time</p>
                  <AreaChart data={timelineData} color="#1a56db" height={140} />
                </div>
              )}
            </>
          ) : <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No data</div>}
        </div>

        {/* AI SEARCH */}
        <div className="an-card">
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>🔍 AI Issue Search</h2>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Search in English — finds Sinhala issues automatically</p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className="input" style={{ fontSize: 14, flex: 1 }} type="text"
              placeholder='"no lab", "teacher shortage", "desks"...'
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()} />
            <button className="btn btn-primary" onClick={() => doSearch()} disabled={searchLoading || !searchQ.trim()} style={{ minWidth: 90, whiteSpace: 'nowrap' }}>
              {searchLoading ? '⏳' : 'Search'}
            </button>
            {searchRes !== null && <button className="btn btn-ghost" onClick={() => { setSearchRes(null); setSearchQ('') }} style={{ padding: '0 12px' }}>✕</button>}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: searchRes !== null ? 14 : 0 }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => { setSearchQ(q); doSearch(q) }}
                style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#4f46e5', cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#ede9fe'}
                onMouseLeave={e => e.currentTarget.style.background='#f5f3ff'}>
                {q}
              </button>
            ))}
          </div>

          {searchLoading && <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 13, animation: 'pulse 1.5s infinite' }}>Searching through all issues...</div>}

          {searchRes !== null && !searchLoading && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                {searchRes.length} result{searchRes.length !== 1 ? 's' : ''} for "{searchQ}"
                <span style={{ marginLeft: 8, fontSize: 11, background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>🌐 Sinhala + English</span>
              </div>
              {searchRes.length === 0
                ? <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 13 }}>No matching issues found. Try different keywords.</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 380, overflowY: 'auto' }}>
                    {searchRes.map(i => <IssueResult key={i.id} issue={i} highlight={searchQ} />)}
                  </div>
              }
            </div>
          )}
        </div>

        {/* SUMMARY + CATEGORIES — side by side on desktop */}
        <div className="an-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* AI SUMMARY */}
          <div className="an-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 3 }}>📝 Zone Summary</h2>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>AI executive report of all issues</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={loadSummary} disabled={summaryLoading} style={{ flexShrink: 0, fontSize: 12 }}>
                {summaryLoading ? '⏳' : summary ? '🔄 Regenerate' : '✨ Generate'}
              </button>
            </div>
            {summaryLoading && <div style={{ textAlign: 'center', padding: 24, color: '#059669', animation: 'pulse 1.5s infinite', fontSize: 14 }}>🤖 Analysing all issues...</div>}
            {summary && !summaryLoading && (
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #059669', flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                {summary.split('\n').filter(p => p.trim()).map((p, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, marginBottom: 10 }}>{p}</p>
                ))}
              </div>
            )}
            {!summary && !summaryLoading && (
              <div style={{ textAlign: 'center', padding: '28px 16px', border: '1.5px dashed #d1d5db', borderRadius: 12, color: '#9ca3af', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 32 }}>📊</div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>Click Generate to get an AI analysis</p>
              </div>
            )}
          </div>

          {/* CATEGORIES */}
          <div className="an-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 3 }}>🏷️ Issue Categories</h2>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>Auto-grouped open issues</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={loadCategories} disabled={catLoading} style={{ flexShrink: 0, fontSize: 12 }}>
                {catLoading ? '⏳' : categories ? '🔄 Re-analyse' : '🤖 Analyse'}
              </button>
            </div>
            {catLoading && <div style={{ textAlign: 'center', padding: 24, color: '#d97706', animation: 'pulse 1.5s infinite', fontSize: 14 }}>🏷️ Categorising...</div>}
            {categories && !catLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 340 }}>
                {categories.map((cat, i) => {
                  const pct = chartData ? Math.round((cat.count / chartData.open) * 100) : 0
                  return (
                    <div key={i} style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                        <span style={{ fontSize: 20 }}>{cat.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cat.name}</div>
                          <div style={{ fontSize: 11, color: '#92400e' }}>{cat.count} issues · {pct}% of open</div>
                        </div>
                        <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 20, padding: '2px 9px', fontSize: 12, fontWeight: 800 }}>{cat.count}</span>
                      </div>
                      <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 4, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {!categories && !catLoading && (
              <div style={{ textAlign: 'center', padding: '28px 16px', border: '1.5px dashed #d1d5db', borderRadius: 12, color: '#9ca3af', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 32 }}>🏷️</div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>Click Analyse to group open issues</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING CHAT BUTTON */}
      <button className="chat-fab" onClick={() => setChatOpen(true)} title="AI Chat Assistant">
        🤖
      </button>

      {/* CHAT PANEL */}
      <ChatAssistant open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
