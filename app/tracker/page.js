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
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [auth, setAuth] = useState({ loggedIn: false, role: 'guest', schoolId: null })
  const [authChecked, setAuthChecked] = useState(false)
  const fileRef = useRef(null)
  const router = useRouter()

  // Check auth
  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      setAuth({ loggedIn: d.loggedIn || false, role: d.role || 'guest', schoolId: d.schoolId || null })
      setAuthChecked(true)
    }).catch(() => setAuthChecked(true))
  }, [])

  // Load all issue counts for sidebar dots
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

  // If school user, auto-select their school
  useEffect(() => {
    if (auth.role === 'school' && auth.schoolId) {
      const school = SCHOOLS.find(s => s.id === auth.schoolId)
      if (school && !selected) selectSchool(school)
    }
  }, [auth])

  const canEdit = (schoolId) => {
    if (!auth.loggedIn) return false
    if (auth.role === 'admin') return true
    if (auth.role === 'school') return auth.schoolId === schoolId
    return false
  }

  const filtered = query
    ? SCHOOLS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.address.toLowerCase().includes(query.toLowerCase()) ||
        s.search_en.includes(query.toLowerCase()) ||
        s.address_en.toLowerCase().includes(query.toLowerCase()) ||
        String(s.id).includes(query)
      )
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
    setImageFile(null)
    setImagePreview(null)
    loadIssues(school.id)
    setSidebarOpen(false)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const clearImage = () => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }

  const addIssue = async () => {
    if (!newText.trim() || !selected || adding || !canEdit(selected.id)) return
    setAdding(true)

    let image_url = null

    // Upload image if selected
    if (imageFile) {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('school_id', String(selected.id))
      const upRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (upRes.ok) {
        const upData = await upRes.json()
        image_url = upData.url
      }
      setUploading(false)
    }

    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: selected.id, text: newText.trim(), image_url }),
    })
    if (res.ok) {
      const issue = await res.json()
      setIssues(prev => [issue, ...prev])
      setAllCounts(prev => ({
        ...prev,
        [selected.id]: { open: (prev[selected.id]?.open || 0) + 1, done: prev[selected.id]?.done || 0 }
      }))
      setNewText('')
      clearImage()
    }
    setAdding(false)
  }

  const toggleIssue = async (issue) => {
    if (!canEdit(issue.school_id)) return
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
    if (!canEdit(issue.school_id)) return
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
    setAuth({ loggedIn: false, role: 'guest', schoolId: null })
    router.push('/')
  }

  const totalOpen = Object.values(allCounts).reduce((a, c) => a + (c.open || 0), 0)
  const totalDone = Object.values(allCounts).reduce((a, c) => a + (c.done || 0), 0)
  const openIssues = issues.filter(i => !i.done)
  const doneIssues = issues.filter(i => i.done)
  const userCanEdit = selected ? canEdit(selected.id) : false

  return (
    <div className="tracker-page">
      <header className="topbar">
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="topbar-brand">
          <div className="topbar-emblem">🏫</div>
          <div><div className="topbar-title">School Issue Tracker</div></div>
        </div>
        <div className="topbar-chips">
          <div className="topbar-chip"><div className="n">{SCHOOLS.length}</div><div className="l">Schools</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'#f87171'}}>{totalOpen}</div><div className="l">Open</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'#4ade80'}}>{totalDone}</div><div className="l">Done</div></div>
        </div>
        <div style={{display:'flex',gap:8,marginLeft:'auto',alignItems:'center'}}>
          {authChecked && (
            auth.loggedIn ? (
              <>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{width:7,height:7,background:'#4ade80',borderRadius:'50%',display:'inline-block'}}/>
                  {auth.role === 'admin' ? 'Admin' : 'School'}
                </span>
                {auth.role === 'admin' && (
                  <Link href="/admin" className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>
                    ⚙️
                  </Link>
                )}
                <button onClick={logout} className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>
                  🔓
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
        <div className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
          <div style={{display:'flex',gap:8,padding:'12px 12px 8px',borderBottom:'1.5px solid var(--border)'}}>
            {[{n:totalOpen,l:'Open',c:'#dc2626'},{n:totalDone,l:'Done',c:'#16a34a'},{n:SCHOOLS.length,l:'Schools',c:'var(--navy)'}].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:'center',background:'var(--cream)',borderRadius:10,padding:'6px 4px'}}>
                <div style={{fontWeight:700,fontSize:15,color:s.c,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="sidebar-search">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" type="text" placeholder="Search / සොයන්න..."
                value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            {query && <div style={{fontSize:11,color:'var(--muted)',marginTop:5,paddingLeft:2}}>{filtered.length} results</div>}
          </div>
          <div className="school-list">
            {filtered.length === 0 && <div className="no-issues">🔍 No schools found</div>}
            {filtered.map(s => {
              const c = allCounts[s.id]
              const isMySchool = auth.role === 'school' && auth.schoolId === s.id
              return (
                <div key={s.id} className={`school-item ${selected?.id === s.id ? 'active' : ''}`} onClick={() => selectSchool(s)}>
                  {isMySchool && <div style={{position:'absolute',left:6,top:6,fontSize:10,background:'var(--gold)',color:selectedSchool?.id===s.id?'var(--navy)':'var(--navy)',borderRadius:4,padding:'1px 4px',fontWeight:700}}>MY</div>}
                  <div className="school-name" style={isMySchool?{paddingLeft:30}:{}}>{s.name}</div>
                  <div className="school-addr">{s.address} · {s.address_en}</div>
                  <div className="school-type">{s.type||'N/A'} · {s.medium}</div>
                  {c && (c.open > 0 || c.done > 0) && (
                    <div className="issue-dots">
                      {c.open > 0 && <div className="dot dot-red"/>}
                      {c.done > 0 && <div className="dot dot-green"/>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        <main className="main-area">
          {!selected ? (
            <div className="empty-state">
              <div className="big-icon">🏫</div>
              <p>{auth.role === 'school' ? 'Loading your school...' : 'Select a school / පාසලක් තෝරන්න'}</p>
            </div>
          ) : (
            <>
              <div className="school-header-card">
                <h2>{selected.name}</h2>
                <div className="school-header-sub">{selected.address} · {selected.address_en}</div>
                <div className="school-meta-grid">
                  <div className="meta-pill"><span>විදුහල්පති</span><strong>{selected.principal||'-'}</strong></div>
                  <div className="meta-pill"><span>Type</span><strong>{selected.type||'-'}</strong></div>
                  <div className="meta-pill"><span>Medium</span><strong>{selected.medium}</strong></div>
                  <div className="meta-pill"><span>Students</span><strong>{(selected.students_m+selected.students_f).toLocaleString()}</strong></div>
                  <div className="meta-pill"><span>Teachers</span><strong>{selected.teachers}</strong></div>
                  <div className="meta-pill"><span>Grade</span><strong>{selected.classification}</strong></div>
                </div>
              </div>

              <div className="section-label">
                Issues / ගැටළු <span className="count">{issues.length}</span>
              </div>

              {/* ADD ISSUE */}
              {userCanEdit ? (
                <div className="add-box">
                  <textarea
                    placeholder="නව ගැටළුවක් ලියන්න... (Ctrl+Enter)"
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    onKeyDown={e => { if (e.ctrlKey && e.key==='Enter') addIssue() }}
                  />

                  {/* Image preview */}
                  {imagePreview && (
                    <div style={{margin:'8px 0',position:'relative',display:'inline-block'}}>
                      <img src={imagePreview} alt="preview" style={{maxHeight:120,maxWidth:'100%',borderRadius:10,border:'1.5px solid var(--border)'}}/>
                      <button onClick={clearImage} style={{position:'absolute',top:-6,right:-6,width:22,height:22,borderRadius:'50%',background:'#ef4444',color:'#fff',border:'none',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✕</button>
                    </div>
                  )}

                  <div className="add-box-row">
                    <button className="btn btn-ghost btn-sm" onClick={() => { fileRef.current?.click() }} style={{display:'flex',alignItems:'center',gap:5}}>
                      📷 {imageFile ? 'Change' : 'Add Photo'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={handleImageSelect}/>
                    <div style={{flex:1}}/>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setNewText(''); clearImage() }}>Clear</button>
                    <button className="btn btn-primary btn-sm" onClick={addIssue} disabled={adding || !newText.trim()}>
                      {uploading ? '📤 Uploading...' : adding ? '⏳' : '➕'} Add Issue
                    </button>
                  </div>
                </div>
              ) : (
                authChecked && (
                  <div className="readonly-notice">
                    <span>👁️ View only — </span>
                    <Link href="/login" style={{color:'var(--gold)',fontWeight:600,textDecoration:'none'}}>Login to edit →</Link>
                  </div>
                )
              )}

              {loading && <div className="loading-text">⏳ Loading issues...</div>}

              {openIssues.length > 0 && (
                <div className="section-label" style={{marginTop:4}}>
                  Open <span className="count red">{openIssues.length}</span>
                </div>
              )}
              {openIssues.map(i => (
                <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={canEdit(i.school_id)}/>
              ))}

              {doneIssues.length > 0 && (
                <div className="section-label" style={{marginTop:16}}>
                  Solved <span className="count green">{doneIssues.length}</span>
                </div>
              )}
              {doneIssues.map(i => (
                <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={canEdit(i.school_id)}/>
              ))}

              {!loading && issues.length === 0 && (
                <div className="no-issues">🎉 No issues for this school</div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function IssueCard({ issue, onToggle, onDelete, canEdit }) {
  const [imgOpen, setImgOpen] = useState(false)
  const date = new Date(issue.created_at).toLocaleDateString('en-LK',{year:'numeric',month:'short',day:'numeric'})

  return (
    <>
      <div className={`issue-card ${issue.done ? 'done' : ''}`}>
        <button className={`check-btn ${issue.done ? 'checked' : ''}`}
          onClick={() => canEdit && onToggle(issue)}
          style={!canEdit ? {cursor:'default',opacity:0.6} : {}}
          title={canEdit ? (issue.done ? 'Reopen' : 'Mark solved') : 'Login to edit'}>
          {issue.done ? '✓' : ''}
        </button>
        <div className="issue-body">
          <div className="issue-text">{issue.text}</div>
          {/* Image thumbnail */}
          {issue.image_url && (
            <div style={{marginTop:8}}>
              <img
                src={issue.image_url} alt="issue"
                style={{maxHeight:80,maxWidth:200,borderRadius:8,border:'1.5px solid var(--border)',cursor:'pointer',objectFit:'cover'}}
                onClick={() => setImgOpen(true)}
                title="Click to enlarge"
              />
            </div>
          )}
          <div className="issue-meta">
            <span className={`badge ${issue.done ? 'badge-done' : 'badge-open'}`}>
              {issue.done ? '✓ Solved' : '⚠ Open'}
            </span>
            <span className="issue-date">{date}</span>
          </div>
        </div>
        {canEdit && <button className="del-btn" onClick={() => onDelete(issue)}>✕</button>}
      </div>

      {/* IMAGE LIGHTBOX */}
      {imgOpen && (
        <div onClick={() => setImgOpen(false)} style={{
          position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20,cursor:'pointer'
        }}>
          <div style={{position:'relative',maxWidth:'90vw',maxHeight:'90vh'}}>
            <img src={issue.image_url} alt="issue" style={{maxWidth:'100%',maxHeight:'85vh',borderRadius:12,display:'block'}}/>
            <button onClick={() => setImgOpen(false)} style={{
              position:'absolute',top:-12,right:-12,width:32,height:32,borderRadius:'50%',
              background:'#fff',border:'none',cursor:'pointer',fontSize:18,fontWeight:700,
              display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.3)'
            }}>✕</button>
            <div style={{marginTop:10,textAlign:'center',color:'rgba(255,255,255,0.7)',fontSize:12}}>
              {issue.text}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
