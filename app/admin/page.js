'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

const TABS = ['Access Control', 'Issue Stats', 'Bulk Actions', 'Edit School Details']

export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [accounts, setAccounts] = useState([])
  const [overrides, setOverrides] = useState({})
  const [editSchool, setEditSchool] = useState(null)  // school being edited
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editMsg, setEditMsg] = useState('')
  const [allIssues, setAllIssues] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(null)
  const [passwords, setPasswords] = useState({})
  const [showPass, setShowPass] = useState({})
  const [feedback, setFeedback] = useState({})
  const [selected, setSelected] = useState(new Set())
  const [bulkPw, setBulkPw] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkMsg, setBulkMsg] = useState('')
  const [issueAction, setIssueAction] = useState({})
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      if (!d.loggedIn || d.role !== 'admin') { router.push('/login'); return }
      setAuthChecked(true)
      loadAll()
    })
  }, [])

  const loadAll = async () => {
    const [accRes, issRes, ovRes] = await Promise.all([
      fetch('/api/schools'),
      fetch('/api/issues'),
      fetch('/api/schools/overrides'),
    ])
    if (accRes.ok) setAccounts(await accRes.json())
    if (issRes.ok) setAllIssues(await issRes.json())
    if (ovRes.ok) {
      const ovData = await ovRes.json()
      if (Array.isArray(ovData)) setOverrides(Object.fromEntries(ovData.map(o => [o.school_id, o])))
    }
  }

  const accountMap = useMemo(() => Object.fromEntries(accounts.map(a => [a.school_id, a])), [accounts])

  const issuesBySchool = useMemo(() => {
    const m = {}
    allIssues.forEach(i => {
      if (!m[i.school_id]) m[i.school_id] = { open: 0, done: 0, total: 0, hasImage: 0 }
      m[i.school_id].total++
      i.done ? m[i.school_id].done++ : m[i.school_id].open++
      if (i.image_url) m[i.school_id].hasImage++
    })
    return m
  }, [allIssues])

  const logout = async () => { await fetch('/api/auth', { method: 'DELETE' }); router.push('/') }

  const saveAccount = async (school) => {
    const pw = passwords[school.id]; if (!pw?.trim()) return
    setSaving(school.id)
    const res = await fetch('/api/schools', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: school.id, school_name: school.name, password: pw.trim() }),
    })
    if (res.ok) {
      setFeedback(p => ({ ...p, [school.id]: 'saved' }))
      setPasswords(p => ({ ...p, [school.id]: '' }))
      setTimeout(() => setFeedback(p => ({ ...p, [school.id]: '' })), 2500)
      loadAll()
    }
    setSaving(null)
  }

  const removeAccount = async (school) => {
    if (!confirm(`Revoke access for ${school.name}?`)) return
    await fetch('/api/schools', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ school_id: school.id }) })
    loadAll()
  }

  const doIssueAction = async (school, action) => {
    const labels = { reset_issues: 'Delete ALL issues', mark_all_done: 'Mark ALL as resolved', mark_all_open: 'Reopen ALL issues' }
    if (!confirm(`${labels[action]} for ${school.name}?`)) return
    setIssueAction(p => ({ ...p, [school.id]: action }))
    await fetch('/api/admin/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, school_id: school.id }) })
    await loadAll()
    setIssueAction(p => ({ ...p, [school.id]: null }))
  }

  const doBulk = async (action) => {
    if (!selected.size) { setBulkMsg('Select at least one school'); return }
    if (action === 'grant' && !bulkPw.trim()) { setBulkMsg('Enter a password for bulk grant'); return }
    if (action === 'revoke' && !confirm(`Revoke access for ${selected.size} school(s)?`)) return
    setBulkLoading(true); setBulkMsg('')
    const schoolsData = Object.fromEntries([...selected].map(id => [id, SCHOOLS.find(s => s.id === id)?.name || String(id)]))
    const res = await fetch('/api/admin/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, school_ids: [...selected], password: bulkPw, schools_data: schoolsData }),
    })
    const d = await res.json()
    setBulkMsg(res.ok ? `✓ Done — ${d.count} school(s) updated` : `Error: ${d.error}`)
    if (res.ok) { setSelected(new Set()); setBulkPw(''); loadAll() }
    setBulkLoading(false)
  }

  const exportCSV = () => { window.open('/api/admin/export', '_blank') }

  const filteredSchools = useMemo(() => SCHOOLS.filter(s => {
    const q = query.toLowerCase()
    const match = !q || s.name.toLowerCase().includes(q) || s.search_en.includes(q) || s.address_en.toLowerCase().includes(q)
    const hasAcc = !!accountMap[s.id]
    if (filter === 'access' && !hasAcc) return false
    if (filter === 'no-access' && hasAcc) return false
    if (filter === 'has-issues' && !issuesBySchool[s.id]) return false
    return match
  }), [query, filter, accountMap, issuesBySchool])

  const totalOpen = allIssues.filter(i => !i.done).length
  const totalDone = allIssues.filter(i => i.done).length

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="loading-text">Checking access...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-emblem" style={{ background: 'var(--blue)', borderRadius: 8, fontSize: 14 }}>⚙️</div>
          <div><div className="topbar-title display">Admin Panel</div></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button onClick={exportCSV} className="btn btn-ghost btn-sm" title="Export all issues to CSV">📥 Export CSV</button>
          <Link href="/tracker" className="btn btn-ghost btn-sm">📋 Tracker</Link>
          <Link href="/" className="btn btn-ghost btn-sm">🏠</Link>
          <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Administration</p>
          <h1 className="display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 4 }}>Control Panel</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Manage school access, monitor issues, run bulk actions and export data.</p>
        </div>

        {/* STATS STRIP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { icon: '🏫', n: SCHOOLS.length, l: 'Schools', c: '' },
            { icon: '🔑', n: accounts.length, l: 'Access Granted', c: 'green' },
            { icon: '📋', n: allIssues.length, l: 'Total Issues', c: 'blue' },
            { icon: '⚠️', n: totalOpen, l: 'Open', c: 'red' },
            { icon: '✅', n: totalDone, l: 'Resolved', c: 'green' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div className={`stat-num ${s.c}`} style={{ fontSize: 22 }}>{s.n}</div>
              <div className="stat-label" style={{ fontSize: 11 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', borderRadius: 12, padding: 4, marginBottom: 20, border: '1px solid var(--border)' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{
                flex: 1, padding: '9px 12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'Figtree,sans-serif', transition: 'all 0.2s',
                background: tab === i ? 'var(--navy)' : 'transparent',
                color: tab === i ? '#fff' : 'var(--text2)',
                boxShadow: tab === i ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* SEARCH + FILTER (shared) */}
        {tab < 2 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
              <input className="input" style={{ paddingLeft: 38, fontSize: 14 }} type="text"
                placeholder="Search schools..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['all', 'All'], ['access', 'Has Access'], ['no-access', 'No Access'], ['has-issues', 'Has Issues']].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 980, fontSize: 12 }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 0: ACCESS CONTROL ── */}
        {tab === 0 && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, fontWeight: 500 }}>
              {filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''} shown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredSchools.map(school => {
                const acc = accountMap[school.id]
                const pw = passwords[school.id] || ''
                const fb = feedback[school.id]
                return (
                  <div key={school.id} className="card" style={{ padding: '15px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span className="si" style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{school.name}</span>
                          {acc
                            ? <span style={{ background: '#f0fdf4', color: 'var(--green-dark)', fontSize: 10, padding: '2px 8px', borderRadius: 980, fontWeight: 700 }}>✓ Access</span>
                            : <span style={{ background: 'var(--bg)', color: 'var(--text3)', fontSize: 10, padding: '2px 8px', borderRadius: 980, fontWeight: 600 }}>No Access</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{school.address_en} · Type {school.type} · #{school.id}</div>
                        {acc && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: 12 }}>
                            <span style={{ color: 'var(--text2)' }}>Password:</span>
                            <span style={{ background: 'var(--bg)', padding: '1px 8px', borderRadius: 6, fontFamily: 'monospace', letterSpacing: showPass[school.id] ? 0 : 3, fontSize: 12 }}>
                              {showPass[school.id] ? acc.password : '••••••••'}
                            </span>
                            <button onClick={() => setShowPass(p => ({ ...p, [school.id]: !p[school.id] }))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, padding: 2, lineHeight: 1 }}>
                              {showPass[school.id] ? '🙈' : '👁️'}
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                        <input className="input" type="text" style={{ width: 150, padding: '7px 11px', fontSize: 13 }}
                          placeholder={acc ? 'New password...' : 'Set password...'}
                          value={pw}
                          onChange={e => setPasswords(p => ({ ...p, [school.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveAccount(school)} />
                        <button className={`btn btn-sm ${fb === 'saved' ? 'btn-ghost' : 'btn-primary'}`}
                          onClick={() => saveAccount(school)} disabled={saving === school.id || !pw.trim()}
                          style={{ minWidth: 76, fontSize: 12 }}>
                          {saving === school.id ? '⏳' : fb === 'saved' ? '✓ Saved' : acc ? 'Update' : 'Grant'}
                        </button>
                        {acc && <button className="btn btn-danger btn-sm" onClick={() => removeAccount(school)} style={{ fontSize: 12 }}>Revoke</button>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB 1: ISSUE STATS ── */}
        {tab === 1 && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, fontWeight: 500 }}>
              {filteredSchools.filter(s => issuesBySchool[s.id]).length} schools with issues
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredSchools.map(school => {
                const c = issuesBySchool[school.id]
                if (!c && filter !== 'all' && filter !== 'has-issues') return null
                const pct = c ? Math.round((c.done / c.total) * 100) : 0
                const act = issueAction[school.id]
                return (
                  <div key={school.id} className="card" style={{ padding: '15px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <span className="si" style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)', display: 'block', marginBottom: 2 }}>{school.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{school.address_en} · Type {school.type}</span>
                      </div>
                      {c ? (
                        <>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ background: '#fef2f2', color: 'var(--red)', padding: '3px 10px', borderRadius: 980, fontSize: 12, fontWeight: 700 }}>⚠ {c.open} Open</span>
                            <span style={{ background: '#f0fdf4', color: 'var(--green-dark)', padding: '3px 10px', borderRadius: 980, fontSize: 12, fontWeight: 700 }}>✓ {c.done} Done</span>
                            {c.hasImage > 0 && <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '3px 10px', borderRadius: 980, fontSize: 12, fontWeight: 600 }}>📷 {c.hasImage}</span>}
                          </div>
                          {/* Mini progress */}
                          <div style={{ width: 80 }}>
                            <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 3, textAlign: 'right', fontWeight: 600 }}>{pct}%</div>
                            <div style={{ background: 'var(--bg)', borderRadius: 980, height: 6, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,var(--blue),var(--green))', borderRadius: 980, transition: 'width 0.8s ease' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => doIssueAction(school, 'mark_all_done')} disabled={!!act} style={{ fontSize: 11 }}>
                              {act === 'mark_all_done' ? '⏳' : '✓ All Done'}
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={() => doIssueAction(school, 'mark_all_open')} disabled={!!act} style={{ fontSize: 11 }}>
                              {act === 'mark_all_open' ? '⏳' : '↺ Reopen All'}
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => doIssueAction(school, 'reset_issues')} disabled={!!act} style={{ fontSize: 11 }}>
                              {act === 'reset_issues' ? '⏳' : '🗑 Clear'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>No issues logged</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: BULK ACTIONS ── */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Bulk grant/revoke */}
            <div className="card" style={{ padding: '24px 26px' }}>
              <h3 className="display" style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Bulk Access Management</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>Select schools below, then grant or revoke access all at once.</p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="input" type="text" style={{ width: 200, fontSize: 13 }}
                  placeholder="Password for bulk grant..."
                  value={bulkPw} onChange={e => setBulkPw(e.target.value)} />
                <button className="btn btn-primary btn-sm" onClick={() => doBulk('grant')} disabled={bulkLoading}>
                  {bulkLoading ? '⏳' : `🔑 Grant ${selected.size > 0 ? `(${selected.size})` : ''}`}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => doBulk('revoke')} disabled={bulkLoading}>
                  {bulkLoading ? '⏳' : `🗑 Revoke ${selected.size > 0 ? `(${selected.size})` : ''}`}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set(SCHOOLS.map(s => s.id)))}>
                  Select All
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
              </div>

              {bulkMsg && (
                <div style={{ background: bulkMsg.startsWith('✓') ? '#f0fdf4' : '#fef2f2', color: bulkMsg.startsWith('✓') ? 'var(--green-dark)' : 'var(--red)', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                  {bulkMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 8, maxHeight: 400, overflowY: 'auto', padding: '4px' }}>
                {SCHOOLS.map(s => {
                  const isSel = selected.has(s.id)
                  const hasAcc = !!accountMap[s.id]
                  return (
                    <div key={s.id} onClick={() => setSelected(p => { const n = new Set(p); isSel ? n.delete(s.id) : n.add(s.id); return n })}
                      style={{
                        padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${isSel ? 'var(--blue)' : 'var(--border)'}`,
                        background: isSel ? 'var(--blue-light)' : 'var(--bg)',
                        display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 6, border: `2px solid ${isSel ? 'var(--blue)' : 'var(--border2)'}`,
                        background: isSel ? 'var(--blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: '#fff', fontWeight: 800, flexShrink: 0, transition: 'all 0.15s',
                      }}>
                        {isSel ? '✓' : ''}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="si" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>
                          {s.address_en}
                          {hasAcc && <span style={{ color: 'var(--green-dark)', marginLeft: 5, fontWeight: 600 }}>· Access ✓</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Export */}
            <div className="card" style={{ padding: '22px 26px' }}>
              <h3 className="display" style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Export Data</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                Download all issues as a spreadsheet-compatible CSV file with school names, areas, status, and dates.
              </p>
              <button className="btn btn-primary" onClick={exportCSV}>
                📥 Download Issues CSV
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: EDIT SCHOOL DETAILS ── */}
        {tab === 3 && (
          <div>
            {/* Search to pick school */}
            {!editSchool ? (
              <div>
                <p style={{fontSize:13,color:'var(--text2)',marginBottom:14,fontWeight:500}}>
                  Select a school to edit its details. Changes override the original directory data and will show immediately in the tracker.
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:520,overflowY:'auto'}}>
                  {filteredSchools.map(school => {
                    const ov = overrides[school.id]
                    return (
                      <div key={school.id} className="card" style={{padding:'13px 18px',cursor:'pointer',transition:'box-shadow .18s'}}
                        onClick={() => {
                          setEditSchool(school)
                          setEditForm({
                            principal:      ov?.principal      ?? school.principal ?? '',
                            type:           ov?.type           ?? school.type ?? '',
                            medium:         ov?.medium         ?? school.medium ?? '',
                            students_m:     ov?.students_m     ?? school.students_m ?? 0,
                            students_f:     ov?.students_f     ?? school.students_f ?? 0,
                            teachers:       ov?.teachers       ?? school.teachers ?? 0,
                            classification: ov?.classification ?? school.classification ?? '',
                          })
                          setEditMsg('')
                        }}
                        onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow)'}
                        onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{flex:1}}>
                            <span className="si" style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{school.name}</span>
                            <span style={{fontSize:12,color:'var(--text2)',marginLeft:8}}>{school.address_en}</span>
                          </div>
                          {ov && <span style={{background:'#fff7ed',color:'#c2410c',fontSize:11,padding:'2px 8px',borderRadius:980,fontWeight:700,flexShrink:0}}>✏ Edited</span>}
                          <span style={{color:'var(--text3)',fontSize:18}}>›</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* EDIT FORM */
              <div>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditSchool(null); setEditMsg('') }}>← Back</button>
                  <div>
                    <div className="si" style={{fontWeight:800,fontSize:16,color:'var(--text)'}}>{editSchool.name}</div>
                    <div style={{fontSize:12,color:'var(--text2)'}}>{editSchool.address_en} · ID: {editSchool.id}</div>
                  </div>
                  {overrides[editSchool.id] && (
                    <button className="btn btn-danger btn-sm" style={{marginLeft:'auto'}}
                      onClick={async () => {
                        if (!confirm('Restore original details for this school?')) return
                        await fetch('/api/admin/school-details', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ school_id: editSchool.id }) })
                        await loadAll()
                        setEditMsg('✓ Restored to original directory data')
                      }}>
                      ↺ Restore Original
                    </button>
                  )}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginBottom:20}}>
                  {[
                    { key:'principal',      label:'Principal Name',    type:'text',   placeholder:'e.g. M.A. Perera' },
                    { key:'type',           label:'School Type',       type:'text',   placeholder:'e.g. 1AB, 1C, 2, 3' },
                    { key:'medium',         label:'Medium',            type:'text',   placeholder:'e.g. Sinhala, Tamil' },
                    { key:'students_m',     label:'Male Students',     type:'number', placeholder:'0' },
                    { key:'students_f',     label:'Female Students',   type:'number', placeholder:'0' },
                    { key:'teachers',       label:'Total Teachers',    type:'number', placeholder:'0' },
                    { key:'classification', label:'Classification',    type:'text',   placeholder:'e.g. ව.ප්‍රි.ම' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="input-label">{field.label}</label>
                      <input className="input" type={field.type} placeholder={field.placeholder}
                        value={editForm[field.key] ?? ''}
                        onChange={e => setEditForm(p => ({...p, [field.key]: field.type==='number' ? Number(e.target.value) : e.target.value}))}
                      />
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div style={{background:'var(--navy)',borderRadius:16,padding:'18px 22px',marginBottom:20}}>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12}}>Preview</p>
                  <div className="si" style={{fontSize:17,fontWeight:800,color:'#fff',marginBottom:4}}>{editSchool.name}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:12}}>{editSchool.address} · {editSchool.address_en}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {[
                      {l:'Principal', v: editForm.principal || '—'},
                      {l:'Type',      v: editForm.type || '—'},
                      {l:'Medium',    v: editForm.medium || '—'},
                      {l:'Students',  v: ((Number(editForm.students_m)||0)+(Number(editForm.students_f)||0)).toLocaleString()},
                      {l:'Teachers',  v: editForm.teachers || '—'},
                      {l:'Grade',     v: editForm.classification || '—'},
                    ].map(p => (
                      <div key={p.l} style={{background:'rgba(255,255,255,0.09)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:8,padding:'5px 12px'}}>
                        <span style={{fontSize:10,color:'rgba(255,255,255,0.4)',display:'block',textTransform:'uppercase',letterSpacing:'0.04em'}}>{p.l}</span>
                        <span className="si" style={{fontSize:13,color:'#fff',fontWeight:600}}>{p.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {editMsg && (
                  <div style={{background: editMsg.startsWith('✓') ? 'var(--green-light)' : 'var(--red-light)', color: editMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)', padding:'10px 14px',borderRadius:10,fontSize:13,fontWeight:600,marginBottom:14,animation:'fadeUp .2s ease'}}>
                    {editMsg}
                  </div>
                )}

                <div style={{display:'flex',gap:10}}>
                  <button className="btn btn-primary" disabled={editSaving}
                    onClick={async () => {
                      setEditSaving(true); setEditMsg('')
                      const res = await fetch('/api/admin/school-details', {
                        method:'POST', headers:{'Content-Type':'application/json'},
                        body: JSON.stringify({ school_id: editSchool.id, ...editForm }),
                      })
                      if (res.ok) {
                        await loadAll()
                        setEditMsg('✓ School details updated successfully')
                      } else {
                        const d = await res.json()
                        setEditMsg(`Error: ${d.error}`)
                      }
                      setEditSaving(false)
                    }}>
                    {editSaving ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setEditSchool(null); setEditMsg('') }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
