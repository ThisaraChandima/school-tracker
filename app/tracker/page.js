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

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      setAuth({ loggedIn: d.loggedIn||false, role: d.role||'guest', schoolId: d.schoolId||null })
      setAuthChecked(true)
    }).catch(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    fetch('/api/issues').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const counts = {}
      data.forEach(i => {
        if (!counts[i.school_id]) counts[i.school_id] = { open:0, done:0 }
        i.done ? counts[i.school_id].done++ : counts[i.school_id].open++
      })
      setAllCounts(counts)
    })
  }, [])

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
    setNewText(''); setImageFile(null); setImagePreview(null)
    loadIssues(school.id)
    setSidebarOpen(false)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]; if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null); setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const addIssue = async () => {
    if (!newText.trim() || !selected || adding || !canEdit(selected.id)) return
    setAdding(true)
    let image_url = null
    if (imageFile) {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', imageFile); fd.append('school_id', String(selected.id))
      const up = await fetch('/api/upload', { method:'POST', body:fd })
      if (up.ok) { const d = await up.json(); image_url = d.url }
      setUploading(false)
    }
    const res = await fetch('/api/issues', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ school_id: selected.id, text: newText.trim(), image_url }),
    })
    if (res.ok) {
      const issue = await res.json()
      setIssues(prev => [issue, ...prev])
      setAllCounts(prev => ({
        ...prev,
        [selected.id]: { open:(prev[selected.id]?.open||0)+1, done:prev[selected.id]?.done||0 }
      }))
      setNewText(''); clearImage()
    }
    setAdding(false)
  }

  const toggleIssue = async (issue) => {
    if (!canEdit(issue.school_id)) return
    const res = await fetch(`/api/issues/${issue.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ done: !issue.done }),
    })
    if (res.ok) {
      setIssues(prev => prev.map(i => i.id===issue.id ? {...i, done:!i.done} : i))
      setAllCounts(prev => {
        const c = {...(prev[selected.id]||{open:0,done:0})}
        issue.done ? (c.open++, c.done--) : (c.done++, c.open--)
        return {...prev, [selected.id]:c}
      })
    }
  }

  const deleteIssue = async (issue) => {
    if (!canEdit(issue.school_id)) return
    if (!confirm('Delete this issue? This cannot be undone.')) return
    const res = await fetch(`/api/issues/${issue.id}`, { method:'DELETE' })
    if (res.ok) {
      setIssues(prev => prev.filter(i => i.id!==issue.id))
      setAllCounts(prev => {
        const c = {...(prev[selected.id]||{open:0,done:0})}
        issue.done ? c.done-- : c.open--
        return {...prev, [selected.id]:c}
      })
    }
  }

  const logout = async () => {
    await fetch('/api/auth', { method:'DELETE' })
    setAuth({ loggedIn:false, role:'guest', schoolId:null })
    router.push('/')
  }

  const totalOpen = Object.values(allCounts).reduce((a,c) => a+(c.open||0), 0)
  const totalDone = Object.values(allCounts).reduce((a,c) => a+(c.done||0), 0)
  const openIssues = issues.filter(i => !i.done)
  const doneIssues = issues.filter(i => i.done)
  const userCanEdit = selected ? canEdit(selected.id) : false

  return (
    <div className="tracker-page">
      <header className="topbar">
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="topbar-brand">
          <div className="topbar-emblem">🏫</div>
          <div><div className="topbar-title display">Issue Tracker</div></div>
        </div>
        <div className="topbar-chips">
          <div className="topbar-chip"><div className="n">{SCHOOLS.length}</div><div className="l">Schools</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'var(--red)'}}>{totalOpen}</div><div className="l">Open</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'var(--green-dark)'}}>{totalDone}</div><div className="l">Done</div></div>
        </div>
        <div style={{display:'flex',gap:8,marginLeft:'auto',alignItems:'center'}}>
          {authChecked && (auth.loggedIn ? (
            <>
              <span style={{fontSize:11,color:'var(--text2)',display:'flex',alignItems:'center',gap:5,fontWeight:600}}>
                <span style={{width:7,height:7,background:'var(--green)',borderRadius:'50%',display:'inline-block'}}/>
                {auth.role==='admin' ? 'Admin' : 'School'}
              </span>
              {auth.role==='admin' && (
                <Link href="/admin" className="btn btn-ghost btn-sm" title="Admin Panel">⚙️</Link>
              )}
              <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">Sign In</Link>
          ))}
          <Link href="/" className="btn btn-ghost btn-sm">🏠</Link>
        </div>
      </header>

      <div className="tracker-body">
        <div className={`mobile-overlay ${sidebarOpen?'show':''}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar ${sidebarOpen?'open':''}`}>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
          <div style={{display:'flex',gap:8,padding:'12px 12px 8px',borderBottom:'1px solid var(--border)'}}>
            {[{n:totalOpen,l:'Open',c:'var(--red)'},{n:totalDone,l:'Done',c:'var(--green-dark)'},{n:SCHOOLS.length,l:'Schools',c:'var(--navy)'}].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:'center',background:'var(--bg)',borderRadius:10,padding:'7px 4px'}}>
                <div style={{fontWeight:800,fontSize:15,color:s.c,lineHeight:1,fontFamily:'Syne,sans-serif'}}>{s.n}</div>
                <div style={{fontSize:10,color:'var(--text3)',marginTop:2,fontWeight:500}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="sidebar-search">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" type="text" placeholder="Search schools..."
                value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            {query && <div style={{fontSize:11,color:'var(--text2)',marginTop:5,paddingLeft:2,fontWeight:500}}>{filtered.length} result{filtered.length!==1?'s':''}</div>}
          </div>
          <div className="school-list">
            {filtered.length===0 && <div className="no-issues">No schools found</div>}
            {filtered.map((s,idx) => {
              const c = allCounts[s.id]
              const isMySchool = auth.role==='school' && auth.schoolId===s.id
              return (
                <div key={s.id} className={`school-item ${selected?.id===s.id?'active':''}`}
                  style={{animationDelay:`${idx*0.02}s`}} onClick={() => selectSchool(s)}>
                  {isMySchool && (
                    <div style={{position:'absolute',left:8,top:8,fontSize:9,background:'var(--gold)',color:'#fff',borderRadius:4,padding:'1px 5px',fontWeight:700,letterSpacing:'0.03em'}}>MY SCHOOL</div>
                  )}
                  <div className="school-name" style={isMySchool?{paddingTop:14}:{}}>{s.name}</div>
                  <div className="school-addr">{s.address_en}</div>
                  <div className="school-type">Type {s.type||'N/A'} · {s.medium==='සිංහල'?'Sinhala':s.medium==='දෙමළ'?'Tamil':'Bilingual'}</div>
                  {c && (c.open>0||c.done>0) && (
                    <div className="issue-dots">
                      {c.open>0 && <div className="dot dot-red"/>}
                      {c.done>0 && <div className="dot dot-green"/>}
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
              <p>{auth.role==='school' ? 'Loading your school...' : 'Select a school to view issues'}</p>
            </div>
          ) : (
            <>
              <div className="school-header-card">
                <h2 className="display">{selected.name}</h2>
                <div className="school-header-sub">{selected.address} · {selected.address_en}</div>
                <div className="school-meta-grid">
                  <div className="meta-pill"><span>Principal</span><strong>{selected.principal||'-'}</strong></div>
                  <div className="meta-pill"><span>Type</span><strong>{selected.type||'-'}</strong></div>
                  <div className="meta-pill"><span>Medium</span><strong>{selected.medium==='සිංහල'?'Sinhala':selected.medium==='දෙමළ'?'Tamil':'Bilingual'}</strong></div>
                  <div className="meta-pill"><span>Students</span><strong>{(selected.students_m+selected.students_f).toLocaleString()}</strong></div>
                  <div className="meta-pill"><span>Teachers</span><strong>{selected.teachers}</strong></div>
                  <div className="meta-pill"><span>Grade</span><strong>{selected.classification}</strong></div>
                </div>
              </div>

              <div className="section-label">
                <span className="display">All Issues</span>
                <span className="count">{issues.length}</span>
              </div>

              {userCanEdit ? (
                <div className="add-box">
                  <textarea placeholder="Describe the issue... (Ctrl+Enter to submit)"
                    value={newText} onChange={e => setNewText(e.target.value)}
                    onKeyDown={e => { if (e.ctrlKey && e.key==='Enter') addIssue() }} />
                  {imagePreview && (
                    <div style={{margin:'8px 0',position:'relative',display:'inline-block'}}>
                      <img src={imagePreview} alt="preview" style={{maxHeight:100,maxWidth:'100%',borderRadius:10,border:'1px solid var(--border)'}}/>
                      <button onClick={clearImage} style={{position:'absolute',top:-8,right:-8,width:22,height:22,borderRadius:'50%',background:'var(--red)',color:'#fff',border:'none',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✕</button>
                    </div>
                  )}
                  <div className="add-box-row">
                    <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                      📷 {imageFile ? 'Change Photo' : 'Add Photo'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={handleImageSelect}/>
                    <div style={{flex:1}}/>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setNewText(''); clearImage() }}>Clear</button>
                    <button className="btn btn-primary btn-sm" onClick={addIssue} disabled={adding||!newText.trim()}>
                      {uploading?'Uploading...' : adding?'Adding...' : '+ Add Issue'}
                    </button>
                  </div>
                </div>
              ) : (
                authChecked && (
                  <div className="readonly-notice">
                    👁️ View only mode —
                    <Link href="/login" style={{color:'var(--blue)',fontWeight:600,textDecoration:'none',marginLeft:4}}>Sign in to edit issues →</Link>
                  </div>
                )
              )}

              {loading && <div className="loading-text">Loading issues...</div>}

              {openIssues.length>0 && (
                <div className="section-label" style={{marginTop:4}}>
                  <span>Open</span><span className="count red">{openIssues.length}</span>
                </div>
              )}
              {openIssues.map(i => <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={canEdit(i.school_id)}/>)}

              {doneIssues.length>0 && (
                <div className="section-label" style={{marginTop:18}}>
                  <span>Resolved</span><span className="count green">{doneIssues.length}</span>
                </div>
              )}
              {doneIssues.map(i => <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={canEdit(i.school_id)}/>)}

              {!loading && issues.length===0 && <div className="no-issues">🎉 No issues recorded for this school</div>}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function IssueCard({ issue, onToggle, onDelete, canEdit }) {
  const [imgOpen, setImgOpen] = useState(false)
  const date = new Date(issue.created_at).toLocaleDateString('en-GB',{year:'numeric',month:'short',day:'numeric'})
  return (
    <>
      <div className={`issue-card ${issue.done?'done':''}`}>
        <button className={`check-btn ${issue.done?'checked':''}`}
          onClick={() => canEdit && onToggle(issue)}
          style={!canEdit?{cursor:'default',opacity:0.5}:{}}
          title={canEdit?(issue.done?'Reopen':'Mark as resolved'):'Sign in to edit'}>
          {issue.done?'✓':''}
        </button>
        <div className="issue-body">
          <div className="issue-text">{issue.text}</div>
          {issue.image_url && (
            <div style={{marginTop:8}}>
              <img src={issue.image_url} alt="issue"
                style={{maxHeight:72,maxWidth:180,borderRadius:8,border:'1px solid var(--border)',cursor:'pointer',objectFit:'cover',transition:'transform 0.2s'}}
                onClick={() => setImgOpen(true)}
                onMouseEnter={e => e.target.style.transform='scale(1.03)'}
                onMouseLeave={e => e.target.style.transform='scale(1)'}
                title="Click to enlarge" />
            </div>
          )}
          <div className="issue-meta">
            <span className={`badge ${issue.done?'badge-done':'badge-open'}`}>
              {issue.done ? '✓ Resolved' : '⚠ Open'}
            </span>
            <span className="issue-date">{date}</span>
          </div>
        </div>
        {canEdit && <button className="del-btn" onClick={() => onDelete(issue)} title="Delete">✕</button>}
      </div>

      {imgOpen && (
        <div onClick={() => setImgOpen(false)} style={{
          position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20,cursor:'pointer',
          backdropFilter:'blur(8px)',animation:'fadeIn 0.2s ease'
        }}>
          <div style={{position:'relative',maxWidth:'90vw',maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>
            <img src={issue.image_url} alt="issue" style={{maxWidth:'100%',maxHeight:'82vh',borderRadius:16,display:'block',boxShadow:'0 40px 80px rgba(0,0,0,0.5)'}}/>
            <button onClick={() => setImgOpen(false)} style={{
              position:'absolute',top:-14,right:-14,width:34,height:34,borderRadius:'50%',
              background:'#fff',border:'none',cursor:'pointer',fontSize:16,fontWeight:800,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 4px 16px rgba(0,0,0,0.3)'
            }}>✕</button>
            <div style={{marginTop:12,textAlign:'center',color:'rgba(255,255,255,0.6)',fontSize:13,maxWidth:500,lineHeight:1.6}}>
              {issue.text}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
