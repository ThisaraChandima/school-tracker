'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

export default function TrackerPage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [issues, setIssues] = useState([])
  const [allCounts, setAllCounts] = useState({})
  const [newText, setNewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const filtered = query
    ? SCHOOLS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.address.toLowerCase().includes(query.toLowerCase())
      )
    : SCHOOLS

  useEffect(() => {
    fetch('/api/issues')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const counts = {}
        data.forEach(i => {
          if (!counts[i.school_id]) counts[i.school_id] = { open: 0, done: 0 }
          i.done ? counts[i.school_id].done++ : counts[i.school_id].open++
        })
        setAllCounts(counts)
      })
  }, [])

  const loadIssues = useCallback(async (schoolId) => {
    setLoading(true)
    const res = await fetch(`/api/issues?school_id=${schoolId}`)
    const data = await res.json()
    setIssues(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  const selectSchool = (school) => {
    setSelected(school)
    setNewText('')
    loadIssues(school.id)
    setSidebarOpen(false)
  }

  const addIssue = async () => {
    if (!newText.trim() || !selected || adding) return
    setAdding(true)
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: selected.id, text: newText.trim() }),
    })
    if (res.ok) {
      const issue = await res.json()
      setIssues(prev => [issue, ...prev])
      setAllCounts(prev => ({
        ...prev,
        [selected.id]: { open: (prev[selected.id]?.open || 0) + 1, done: prev[selected.id]?.done || 0 }
      }))
      setNewText('')
    }
    setAdding(false)
  }

  const toggleIssue = async (issue) => {
    const res = await fetch(`/api/issues/${issue.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !issue.done }),
    })
    if (res.ok) {
      setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, done: !i.done } : i))
      setAllCounts(prev => {
        const c = { ...(prev[selected.id] || { open: 0, done: 0 }) }
        issue.done ? (c.open++, c.done--) : (c.done++, c.open--)
        return { ...prev, [selected.id]: c }
      })
    }
  }

  const deleteIssue = async (issue) => {
    if (!confirm('ගැටළුව ඉවත් කරන්නද?')) return
    const res = await fetch(`/api/issues/${issue.id}`, { method: 'DELETE' })
    if (res.ok) {
      setIssues(prev => prev.filter(i => i.id !== issue.id))
      setAllCounts(prev => {
        const c = { ...(prev[selected.id] || { open: 0, done: 0 }) }
        issue.done ? c.done-- : c.open--
        return { ...prev, [selected.id]: c }
      })
    }
  }

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/')
  }

  const totalOpen = Object.values(allCounts).reduce((a, c) => a + (c.open || 0), 0)
  const totalDone = Object.values(allCounts).reduce((a, c) => a + (c.done || 0), 0)
  const openIssues = issues.filter(i => !i.done)
  const doneIssues = issues.filter(i => i.done)

  return (
    <div className="tracker-page">
      {/* TOPBAR */}
      <header className="topbar">
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="topbar-brand">
          <div className="topbar-emblem">🏫</div>
          <div>
            <div className="topbar-title">School Issue Tracker</div>
          </div>
        </div>
        <div className="topbar-chips">
          <div className="topbar-chip"><div className="n">{SCHOOLS.length}</div><div className="l">Schools</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'#f87171'}}>{totalOpen}</div><div className="l">Open</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'#4ade80'}}>{totalDone}</div><div className="l">Solved</div></div>
        </div>
        <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
          <Link href="/" className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>🏠</Link>
          <button onClick={logout} className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>
            🔓 <span style={{display:'none'}}>Logout</span>
          </button>
        </div>
      </header>

      <div className="tracker-body">
        {/* MOBILE OVERLAY */}
        <div className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>

          {/* Mobile stats */}
          <div style={{display:'flex',gap:8,padding:'12px 12px 8px',borderBottom:'1.5px solid var(--border)'}}>
            {[
              {n:totalOpen,l:'Open',c:'#dc2626'},
              {n:totalDone,l:'Done',c:'#16a34a'},
              {n:SCHOOLS.length,l:'Schools',c:'var(--navy)'},
            ].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:'center',background:'var(--cream)',borderRadius:10,padding:'6px 4px'}}>
                <div style={{fontWeight:700,fontSize:15,color:s.c,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          <div className="sidebar-search">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="පාසල් නම සොයන්න..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="school-list">
            {filtered.length === 0 && <div className="no-issues">සොයාගත නොහැකිය</div>}
            {filtered.map(s => {
              const c = allCounts[s.id]
              return (
                <div
                  key={s.id}
                  className={`school-item ${selected?.id === s.id ? 'active' : ''}`}
                  onClick={() => selectSchool(s)}
                >
                  <div className="school-name">{s.name}</div>
                  <div className="school-addr">{s.address}</div>
                  <div className="school-type">{s.type || 'N/A'} · {s.medium}</div>
                  {c && (c.open > 0 || c.done > 0) && (
                    <div className="issue-dots">
                      {c.open > 0 && <div className="dot dot-red" />}
                      {c.done > 0 && <div className="dot dot-green" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-area">
          {!selected ? (
            <div className="empty-state">
              <div className="big-icon">🏫</div>
              <p>පාසලක් තෝරන්න</p>
            </div>
          ) : (
            <>
              {/* School card */}
              <div className="school-header-card">
                <h2>{selected.name}</h2>
                <div className="school-header-sub">{selected.address}</div>
                <div className="school-meta-grid">
                  <div className="meta-pill"><span>විදුහල්පති</span><strong>{selected.principal || '-'}</strong></div>
                  <div className="meta-pill"><span>වර්ගය</span><strong>{selected.type || '-'}</strong></div>
                  <div className="meta-pill"><span>මාධ්‍ය</span><strong>{selected.medium}</strong></div>
                  <div className="meta-pill"><span>සිසුන්</span><strong>{(selected.students_m + selected.students_f).toLocaleString()}</strong></div>
                  <div className="meta-pill"><span>ගුරු</span><strong>{selected.teachers}</strong></div>
                  <div className="meta-pill"><span>ශ්‍රේණිය</span><strong>{selected.classification}</strong></div>
                </div>
              </div>

              {/* Issues count */}
              <div className="section-label">
                ගැටළු <span className="count">{issues.length}</span>
              </div>

              {/* Add issue */}
              <div className="add-box">
                <textarea
                  placeholder="නව ගැටළුවක් ලියන්න... (Ctrl+Enter)"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') addIssue() }}
                />
                <div className="add-box-row">
                  <button className="btn btn-ghost btn-sm" onClick={() => setNewText('')}>මකන්න</button>
                  <button className="btn btn-primary btn-sm" onClick={addIssue} disabled={adding || !newText.trim()}>
                    {adding ? '⏳' : '➕'} ගැටළුව එකතු
                  </button>
                </div>
              </div>

              {loading && <div className="loading-text">⏳ Loading...</div>}

              {/* Open */}
              {openIssues.length > 0 && (
                <div className="section-label" style={{marginTop:4}}>
                  විසඳීමට ඇති <span className="count red">{openIssues.length}</span>
                </div>
              )}
              {openIssues.map(i => <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} />)}

              {/* Done */}
              {doneIssues.length > 0 && (
                <div className="section-label" style={{marginTop:16}}>
                  විසඳූ <span className="count green">{doneIssues.length}</span>
                </div>
              )}
              {doneIssues.map(i => <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} />)}

              {!loading && issues.length === 0 && (
                <div className="no-issues">🎉 ගැටළු නොමැත</div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function IssueCard({ issue, onToggle, onDelete }) {
  const date = new Date(issue.created_at).toLocaleDateString('si-LK')
  return (
    <div className={`issue-card ${issue.done ? 'done' : ''}`}>
      <button className={`check-btn ${issue.done ? 'checked' : ''}`} onClick={() => onToggle(issue)}>
        {issue.done ? '✓' : ''}
      </button>
      <div className="issue-body">
        <div className="issue-text">{issue.text}</div>
        <div className="issue-meta">
          <span className={`badge ${issue.done ? 'badge-done' : 'badge-open'}`}>
            {issue.done ? '✓ විසඳා ඇත' : '⚠ විසඳීමට ඇත'}
          </span>
          <span className="issue-date">{date}</span>
        </div>
      </div>
      <button className="del-btn" onClick={() => onDelete(issue)}>✕</button>
    </div>
  )
}
