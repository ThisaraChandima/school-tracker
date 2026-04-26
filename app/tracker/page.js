'use client'
import { useState, useEffect, useCallback } from 'react'
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      setIsLoggedIn(d.loggedIn || false)
      setAuthChecked(true)
    }).catch(() => setAuthChecked(true))
  }, [])

  // Load all issue counts (sidebar dots)
  useEffect(() => {
    fetch('/api/issues').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const counts = {}
      data.forEach(i => {
        if (!counts[i.school_id]) counts[i.school_id] = { open: 0, done: 0 }
        i.done ? counts[i.school_id].done++ : counts[i.school_id].open++
      })
      setAllCounts(counts)
    })
  }, [])

  // Smart search: works for Sinhala and English
  const filtered = query
    ? SCHOOLS.filter(s => {
        const q = query.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.search_en.includes(q) ||
          s.address_en.toLowerCase().includes(q) ||
          String(s.id).includes(q)
        )
      })
    : SCHOOLS

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
    if (!newText.trim() || !selected || adding || !isLoggedIn) return
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
    if (!isLoggedIn) return
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
    if (!isLoggedIn) return
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
    setIsLoggedIn(false)
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
        <div style={{display:'flex',gap:8,marginLeft:'auto',alignItems:'center'}}>
          {authChecked && (
            isLoggedIn ? (
              <>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{width:7,height:7,background:'#4ade80',borderRadius:'50%',display:'inline-block'}}/>
                  Admin
                </span>
                <button onClick={logout} className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>
                  🔓 Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-gold btn-sm">🔐 Login</Link>
            )
          )}
          <Link href="/" className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>🏠</Link>
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
              {n:totalOpen, l:'Open', c:'#dc2626'},
              {n:totalDone, l:'Done', c:'#16a34a'},
              {n:SCHOOLS.length, l:'Schools', c:'var(--navy)'},
            ].map((s,i) => (
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
                placeholder="Search / සොයන්න..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            {query && (
              <div style={{fontSize:11,color:'var(--muted)',marginTop:6,paddingLeft:2}}>
                {filtered.length} results for "{query}"
              </div>
            )}
          </div>

          <div className="school-list">
            {filtered.length === 0 && (
              <div className="no-issues">
                <div style={{fontSize:24,marginBottom:8}}>🔍</div>
                No schools found
              </div>
            )}
            {filtered.map(s => {
              const c = allCounts[s.id]
              return (
                <div
                  key={s.id}
                  className={`school-item ${selected?.id === s.id ? 'active' : ''}`}
                  onClick={() => selectSchool(s)}
                >
                  <div className="school-name">{s.name}</div>
                  <div className="school-addr">{s.address} · {s.address_en}</div>
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
              <p>Select a school / පාසලක් තෝරන්න</p>
            </div>
          ) : (
            <>
              {/* School info card */}
              <div className="school-header-card">
                <h2>{selected.name}</h2>
                <div className="school-header-sub">{selected.address} · {selected.address_en}</div>
                <div className="school-meta-grid">
                  <div className="meta-pill"><span>විදුහල්පති</span><strong>{selected.principal || '-'}</strong></div>
                  <div className="meta-pill"><span>Type</span><strong>{selected.type || '-'}</strong></div>
                  <div className="meta-pill"><span>Medium</span><strong>{selected.medium}</strong></div>
                  <div className="meta-pill"><span>Students</span><strong>{(selected.students_m + selected.students_f).toLocaleString()}</strong></div>
                  <div className="meta-pill"><span>Teachers</span><strong>{selected.teachers}</strong></div>
                  <div className="meta-pill"><span>Grade</span><strong>{selected.classification}</strong></div>
                </div>
              </div>

              {/* Issues count */}
              <div className="section-label">
                ගැටළු / Issues <span className="count">{issues.length}</span>
              </div>

              {/* ADD ISSUE — only for logged in */}
              {isLoggedIn ? (
                <div className="add-box">
                  <textarea
                    placeholder="නව ගැටළුවක් ලියන්න... (Ctrl+Enter to submit)"
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') addIssue() }}
                  />
                  <div className="add-box-row">
                    <button className="btn btn-ghost btn-sm" onClick={() => setNewText('')}>Clear</button>
                    <button className="btn btn-primary btn-sm" onClick={addIssue} disabled={adding || !newText.trim()}>
                      {adding ? '⏳' : '➕'} Add Issue
                    </button>
                  </div>
                </div>
              ) : (
                authChecked && (
                  <div className="readonly-notice">
                    <span>👁️ View only mode — </span>
                    <Link href="/login" style={{color:'var(--gold)',fontWeight:600,textDecoration:'none'}}>Login to add or edit issues →</Link>
                  </div>
                )
              )}

              {loading && <div className="loading-text">⏳ Loading issues...</div>}

              {/* Open issues */}
              {openIssues.length > 0 && (
                <div className="section-label" style={{marginTop:4}}>
                  විසඳීමට ඇති <span className="count red">{openIssues.length}</span>
                </div>
              )}
              {openIssues.map(i => (
                <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={isLoggedIn} />
              ))}

              {/* Done issues */}
              {doneIssues.length > 0 && (
                <div className="section-label" style={{marginTop:16}}>
                  විසඳූ <span className="count green">{doneIssues.length}</span>
                </div>
              )}
              {doneIssues.map(i => (
                <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={isLoggedIn} />
              ))}

              {!loading && issues.length === 0 && (
                <div className="no-issues">🎉 No issues recorded for this school</div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function IssueCard({ issue, onToggle, onDelete, canEdit }) {
  const date = new Date(issue.created_at).toLocaleDateString('en-LK', {
    year:'numeric', month:'short', day:'numeric'
  })
  return (
    <div className={`issue-card ${issue.done ? 'done' : ''}`}>
      {/* Check button - only active for admins */}
      <button
        className={`check-btn ${issue.done ? 'checked' : ''} ${!canEdit ? 'view-only' : ''}`}
        onClick={() => canEdit && onToggle(issue)}
        style={!canEdit ? {cursor:'default',opacity:0.6} : {}}
        title={canEdit ? (issue.done ? 'Mark as open' : 'Mark as done') : 'Login to edit'}
      >
        {issue.done ? '✓' : ''}
      </button>
      <div className="issue-body">
        <div className="issue-text">{issue.text}</div>
        <div className="issue-meta">
          <span className={`badge ${issue.done ? 'badge-done' : 'badge-open'}`}>
            {issue.done ? '✓ Solved' : '⚠ Open'}
          </span>
          <span className="issue-date">{date}</span>
        </div>
      </div>
      {/* Delete - only for admins */}
      {canEdit && (
        <button className="del-btn" onClick={() => onDelete(issue)} title="Delete">✕</button>
      )}
    </div>
  )
}
