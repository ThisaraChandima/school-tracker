'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import SCHOOLS from '@/lib/schools'

export default function Home() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [issues, setIssues] = useState([]) // issues for selected school
  const [allCounts, setAllCounts] = useState({}) // schoolId -> {open, done}
  const [newText, setNewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const taRef = useRef(null)

  const filtered = query
    ? SCHOOLS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.address.toLowerCase().includes(query.toLowerCase())
      )
    : SCHOOLS

  // Load all issue counts on mount (for dots in sidebar)
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
  }

  const addIssue = async () => {
    if (!newText.trim() || !selected || adding) return
    setAdding(true)
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: selected.id, text: newText.trim() }),
    })
    const issue = await res.json()
    if (res.ok) {
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
        const c = { ...prev[selected.id] }
        if (issue.done) { c.open++; c.done-- } else { c.done++; c.open-- }
        return { ...prev, [selected.id]: c }
      })
    }
  }

  const deleteIssue = async (issue) => {
    const res = await fetch(`/api/issues/${issue.id}`, { method: 'DELETE' })
    if (res.ok) {
      setIssues(prev => prev.filter(i => i.id !== issue.id))
      setAllCounts(prev => {
        const c = { ...prev[selected.id] }
        issue.done ? c.done-- : c.open--
        return { ...prev, [selected.id]: c }
      })
    }
  }

  const totalOpen = Object.values(allCounts).reduce((a, c) => a + (c.open || 0), 0)
  const totalDone = Object.values(allCounts).reduce((a, c) => a + (c.done || 0), 0)

  const open = issues.filter(i => !i.done)
  const done = issues.filter(i => i.done)

  return (
    <>
      {/* HEADER */}
      <div className="header">
        <div className="hemblem">🏫</div>
        <div className="htitle">
          <h1>School Issue Tracker</h1>
          <p className="si">මාවනැල්ල අධ්‍යාපන කලාපය — 2025</p>
        </div>
        <div className="hstats">
          <div className="schip"><div className="n">{SCHOOLS.length}</div><div className="l">Schools</div></div>
          <div className="schip"><div className="n" style={{color:'#f87171'}}>{totalOpen}</div><div className="l">Open</div></div>
          <div className="schip"><div className="n" style={{color:'#4ade80'}}>{totalDone}</div><div className="l">Solved</div></div>
        </div>
      </div>

      {/* BODY */}
      <div className="body">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sbox">
            <div className="swrap">
              <span className="sico">🔍</span>
              <input
                type="text"
                placeholder="පාසල් නම සොයන්න..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="slist">
            {filtered.length === 0 && <div className="nois">සොයාගත නොහැකිය</div>}
            {filtered.map(s => {
              const c = allCounts[s.id]
              const isActive = selected?.id === s.id
              return (
                <div key={s.id} className={`sitem ${isActive ? 'active' : ''}`} onClick={() => selectSchool(s)}>
                  <div className="sn">{s.name}</div>
                  <div className="sa">{s.address}</div>
                  <div className="sb">{s.type || 'N/A'} · {s.medium}</div>
                  {c && (c.open > 0 || c.done > 0) && (
                    <div className="idot">
                      {c.open > 0 && <div className="dr" />}
                      {c.done > 0 && <div className="dg" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          {!selected ? (
            <div className="estate">
              <div className="ico">🏫</div>
              <p>පාසලක් තෝරන්න</p>
            </div>
          ) : (
            <>
              {/* School info */}
              <div className="shead">
                <h2>{selected.name}</h2>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,.65)',fontFamily:'var(--font-si),sans-serif',marginTop:'2px'}}>{selected.address}</div>
                <div className="smeta">
                  <div className="mitem"><span>විදුහල්පති:</span><strong>{selected.principal || '-'}</strong></div>
                  <div className="mitem"><span>වර්ගය:</span><strong>{selected.type || '-'}</strong></div>
                  <div className="mitem"><span>මාධ්‍යය:</span><strong>{selected.medium}</strong></div>
                  <div className="mitem"><span>සිසුන්:</span><strong>{(selected.students_m + selected.students_f).toLocaleString()}</strong></div>
                  <div className="mitem"><span>ගුරු:</span><strong>{selected.teachers}</strong></div>
                  <div className="mitem"><span>ශ්‍රේණිය:</span><strong>{selected.classification}</strong></div>
                </div>
              </div>

              {/* Section title */}
              <div className="stitle">ගැටළු <span>{issues.length}</span></div>

              {/* Add issue */}
              <div className="addi">
                <textarea
                  ref={taRef}
                  placeholder="නව ගැටළුවක් ලියන්න... (Ctrl+Enter)"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') addIssue() }}
                />
                <div className="arow">
                  <button className="btn btns" onClick={() => setNewText('')}>මකන්න</button>
                  <button className="btn btnp" onClick={addIssue} disabled={adding || !newText.trim()}>
                    {adding ? 'Adding...' : 'ගැටළුව + '}
                  </button>
                </div>
              </div>

              {loading && <div className="loading">Loading...</div>}

              {/* Open issues */}
              {open.length > 0 && (
                <div className="stitle" style={{fontSize:'13px',marginBottom:'9px'}}>
                  විසඳීමට ඇති <span style={{background:'#dc2626'}}>{open.length}</span>
                </div>
              )}
              {open.map(i => <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} />)}

              {/* Done issues */}
              {done.length > 0 && (
                <div className="stitle" style={{fontSize:'13px',margin:'16px 0 9px',color:'#6b7280'}}>
                  විසඳූ <span style={{background:'#16a34a'}}>{done.length}</span>
                </div>
              )}
              {done.map(i => <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} />)}

              {!loading && issues.length === 0 && <div className="nois">🎉 ගැටළු නොමැත</div>}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function IssueCard({ issue, onToggle, onDelete }) {
  const d = new Date(issue.created_at).toLocaleDateString('si-LK')
  return (
    <div className={`icard ${issue.done ? 'done' : ''}`}>
      <button className={`ick ${issue.done ? 'chk' : ''}`} onClick={() => onToggle(issue)}>
        {issue.done ? '✓' : ''}
      </button>
      <div className="ibody">
        <div className="itxt">{issue.text}</div>
        <div className="imeta">
          <span className={`ibadge ${issue.done ? 'bdone' : 'bopen'}`}>
            {issue.done ? '✓ විසඳා ඇත' : '⚠ විසඳීමට ඇත'}
          </span>
          {d}
        </div>
      </div>
      <button className="idel" onClick={() => onDelete(issue)}>✕</button>
    </div>
  )
}
