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
  const [overrides, setOverrides] = useState({}) // schoolId -> override row
  const [newText, setNewText] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [auth, setAuth] = useState({ loggedIn: false, role: 'guest', schoolId: null })
  const [authChecked, setAuthChecked] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editFeedback, setEditFeedback] = useState('')
  const fileRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      setAuth({ loggedIn: d.loggedIn||false, role: d.role||'guest', schoolId: d.schoolId||null })
      setAuthChecked(true)
    }).catch(() => setAuthChecked(true))

    // Load all issue counts
    fetch('/api/issues').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      const counts = {}
      data.forEach(i => {
        if (!counts[i.school_id]) counts[i.school_id] = { open:0, done:0 }
        i.done ? counts[i.school_id].done++ : counts[i.school_id].open++
      })
      setAllCounts(counts)
    })

    // Load all school detail overrides
    fetch('/api/school-details').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const map = {}
        data.forEach(d => { map[d.school_id] = d })
        setOverrides(map)
      }
    })
  }, [])

  useEffect(() => {
    if (auth.role === 'school' && auth.schoolId) {
      const school = SCHOOLS.find(s => s.id === auth.schoolId)
      if (school && !selected) selectSchool(school)
    }
  }, [auth])

  // Merge base data with override
  const getSchoolData = (school) => {
    const ov = overrides[school.id]
    if (!ov) return school
    return {
      ...school,
      principal:      ov.principal      ?? school.principal,
      type:           ov.type           ?? school.type,
      medium:         ov.medium         ?? school.medium,
      students_m:     ov.students_m     ?? school.students_m,
      students_f:     ov.students_f     ?? school.students_f,
      teachers:       ov.teachers       ?? school.teachers,
      classification: ov.classification ?? school.classification,
    }
  }

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
    reader.onload = ev => setImagePreview(ev.target.result)
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
      body: JSON.stringify({ school_id:selected.id, text:newText.trim(), image_url }),
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
      body: JSON.stringify({ done:!issue.done }),
    })
    if (res.ok) {
      setIssues(prev => prev.map(i => i.id===issue.id ? {...i, done:!i.done} : i))
      setAllCounts(prev => {
        const c = {...(prev[selected.id]||{open:0,done:0})}
        issue.done ? (c.open++,c.done--) : (c.done++,c.open--)
        return {...prev,[selected.id]:c}
      })
    }
  }

  const deleteIssue = async (issue) => {
    if (!canEdit(issue.school_id)) return
    if (!confirm('Delete this issue?')) return
    const res = await fetch(`/api/issues/${issue.id}`, { method:'DELETE' })
    if (res.ok) {
      setIssues(prev => prev.filter(i => i.id!==issue.id))
      setAllCounts(prev => {
        const c = {...(prev[selected.id]||{open:0,done:0})}
        issue.done ? c.done-- : c.open--
        return {...prev,[selected.id]:c}
      })
    }
  }

  // ── EDIT SCHOOL DETAILS ──
  const openEditModal = () => {
    const data = getSchoolData(selected)
    setEditForm({
      principal: data.principal || '',
      type: data.type || '',
      medium: data.medium || '',
      students_m: data.students_m || 0,
      students_f: data.students_f || 0,
      teachers: data.teachers || 0,
      classification: data.classification || '',
    })
    setEditFeedback('')
    setEditModal(true)
  }

  const saveEditModal = async () => {
    if (!selected || editSaving) return
    setEditSaving(true); setEditFeedback('')
    const res = await fetch(`/api/school-details/${selected.id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setOverrides(prev => ({...prev, [selected.id]: updated}))
      setEditFeedback('saved')
      setTimeout(() => { setEditModal(false); setEditFeedback('') }, 900)
    } else {
      setEditFeedback('error')
    }
    setEditSaving(false)
  }

  const resetToOriginal = async () => {
    if (!selected || !confirm('Reset to original Excel data?')) return
    const res = await fetch(`/api/school-details/${selected.id}`, { method:'DELETE' })
    if (res.ok) {
      setOverrides(prev => { const n={...prev}; delete n[selected.id]; return n })
      setEditModal(false)
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
  const schoolData = selected ? getSchoolData(selected) : null
  const hasOverride = selected ? !!overrides[selected.id] : false

  const MEDIUMS = ['Sinhala','Tamil','Bilingual']
  const TYPES = ['1AB','1C','2','3']
  const GRADES = ['ව.ප්‍රි.ම','ප්‍රි.ම','ප්‍රි.ම.නො','දුෂ්කර','අති දුෂ්කර']

  return (
    <div className="tracker-page">
      {/* TOPBAR */}
      <header className="topbar">
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="topbar-brand">
          <div className="topbar-emblem"><div style={{ width:34, height:34, borderRadius:8, overflow:'hidden', flexShrink:0 }}><Image src="/logo.png" alt="Logo" width={34} height={34} style={{ objectFit:'cover' }} priority /></div></div>
          <div><div className="topbar-title">Issue Tracker</div></div>
        </div>
        <div className="topbar-chips">
          <div className="topbar-chip"><div className="n">{SCHOOLS.length}</div><div className="l">Schools</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'#dc2626'}}>{totalOpen}</div><div className="l">Open</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'#16a34a'}}>{totalDone}</div><div className="l">Done</div></div>
        </div>
        <div style={{display:'flex',gap:8,marginLeft:'auto',alignItems:'center'}}>
          {authChecked && (auth.loggedIn ? (
            <>
              <span style={{fontSize:11,color:'#6b7280',display:'flex',alignItems:'center',gap:5,fontWeight:600}}>
                <span style={{width:7,height:7,background:'#16a34a',borderRadius:'50%',display:'inline-block'}}/>
                {auth.role==='admin'?'Admin':'School'}
              </span>
              {auth.role==='admin' && <Link href="/admin" className="btn btn-ghost btn-sm" title="Admin Panel">⚙️ Admin</Link>}
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

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen?'open':''}`}>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
          <div style={{display:'flex',gap:8,padding:'12px 12px 8px',borderBottom:'1.5px solid #e5e7eb'}}>
            {[{n:totalOpen,l:'Open',c:'#dc2626'},{n:totalDone,l:'Done',c:'#16a34a'},{n:SCHOOLS.length,l:'Schools',c:'#111827'}].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:'center',background:'#f7f8fa',borderRadius:8,padding:'7px 4px'}}>
                <div style={{fontWeight:800,fontSize:15,color:s.c,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:10,color:'#9ca3af',marginTop:2,fontWeight:500}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="sidebar-search">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" type="text" placeholder="Search schools..."
                value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            {query && <div style={{fontSize:11,color:'#9ca3af',marginTop:5,paddingLeft:2,fontWeight:500}}>{filtered.length} result{filtered.length!==1?'s':''}</div>}
          </div>
          <div className="school-list">
            {filtered.length===0 && <div className="no-issues">No schools found</div>}
            {filtered.map(s => {
              const c = allCounts[s.id]
              const isMySchool = auth.role==='school' && auth.schoolId===s.id
              const isEdited = !!overrides[s.id]
              return (
                <div key={s.id} className={`school-item ${selected?.id===s.id?'active':''}`} onClick={() => selectSchool(s)}>
                  {isMySchool && <div style={{position:'absolute',left:8,top:8,fontSize:9,background:'#f59e0b',color:'#fff',borderRadius:4,padding:'1px 5px',fontWeight:700,letterSpacing:'0.03em'}}>MY</div>}
                  <div className="school-name" style={isMySchool?{paddingTop:14}:{}}>{s.name}</div>
                  <div className="school-addr">{s.address_en}</div>
                  <div style={{display:'flex',gap:5,marginTop:4,flexWrap:'wrap',alignItems:'center'}}>
                    <span className="school-type">Type {s.type||'N/A'} · {s.medium==='සිංහල'?'Sinhala':s.medium==='දෙමළ'?'Tamil':'Bilingual'}</span>
                    {isEdited && <span style={{fontSize:9,background:'#eff6ff',color:'#1a56db',borderRadius:4,padding:'1px 5px',fontWeight:700,border:'1px solid #bfdbfe'}}>EDITED</span>}
                  </div>
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

        {/* MAIN */}
        <main className="main-area">
          {!selected ? (
            <div className="empty-state">
              <div className="big-icon">🏫</div>
              <p>{auth.role==='school' ? 'Loading your school...' : 'Select a school to view issues'}</p>
            </div>
          ) : (
            <>
              {/* School Header Card */}
              <div className="school-header-card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <h2>{schoolData.name}</h2>
                    <div className="school-header-sub">{schoolData.address} · {schoolData.address_en}</div>
                  </div>
                  {/* Admin edit button */}
                  {auth.role==='admin' && (
                    <div style={{display:'flex',gap:8,flexShrink:0}}>
                      {hasOverride && (
                        <span style={{fontSize:10,background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.7)',padding:'3px 8px',borderRadius:6,fontWeight:600,alignSelf:'flex-start',whiteSpace:'nowrap'}}>
                          ✏️ Edited
                        </span>
                      )}
                      <button onClick={openEditModal} style={{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,padding:'7px 14px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,transition:'background .18s',whiteSpace:'nowrap'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
                        ✏️ Edit Details
                      </button>
                    </div>
                  )}
                </div>
                <div className="school-meta-grid">
                  <div className="meta-pill"><span>Principal</span><strong>{schoolData.principal||'—'}</strong></div>
                  <div className="meta-pill"><span>Type</span><strong>{schoolData.type||'—'}</strong></div>
                  <div className="meta-pill"><span>Medium</span><strong>{schoolData.medium==='සිංහල'?'Sinhala':schoolData.medium==='දෙමළ'?'Tamil':schoolData.medium||'—'}</strong></div>
                  <div className="meta-pill"><span>Students</span><strong>{((schoolData.students_m||0)+(schoolData.students_f||0)).toLocaleString()}</strong></div>
                  <div className="meta-pill"><span>Teachers</span><strong>{schoolData.teachers||'—'}</strong></div>
                  <div className="meta-pill"><span>Grade</span><strong>{schoolData.classification||'—'}</strong></div>
                </div>
              </div>

              <div className="section-label">
                All Issues <span className="count">{issues.length}</span>
              </div>

              {/* Add issue */}
              {userCanEdit ? (
                <div className="add-box">
                  <textarea placeholder="Describe the issue... (Ctrl+Enter to submit)"
                    value={newText} onChange={e=>setNewText(e.target.value)}
                    onKeyDown={e=>{if(e.ctrlKey&&e.key==='Enter')addIssue()}} />
                  {imagePreview && (
                    <div style={{margin:'8px 0',position:'relative',display:'inline-block'}}>
                      <img src={imagePreview} alt="preview" style={{maxHeight:96,maxWidth:'100%',borderRadius:8,border:'1.5px solid #e5e7eb'}}/>
                      <button onClick={clearImage} style={{position:'absolute',top:-8,right:-8,width:22,height:22,borderRadius:'50%',background:'#dc2626',color:'#fff',border:'none',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✕</button>
                    </div>
                  )}
                  <div className="add-box-row">
                    <button className="btn btn-ghost btn-sm" onClick={()=>fileRef.current?.click()}>📷 {imageFile?'Change':'Add Photo'}</button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={handleImageSelect}/>
                    <div style={{flex:1}}/>
                    <button className="btn btn-ghost btn-sm" onClick={()=>{setNewText('');clearImage()}}>Clear</button>
                    <button className="btn btn-primary btn-sm" onClick={addIssue} disabled={adding||!newText.trim()}>
                      {uploading?'Uploading...':adding?'Adding...':'+ Add Issue'}
                    </button>
                  </div>
                </div>
              ) : authChecked && (
                <div className="readonly-notice">
                  👁️ View only —
                  <Link href="/login" style={{color:'#1a56db',fontWeight:600,textDecoration:'none',marginLeft:4}}>Sign in to edit →</Link>
                </div>
              )}

              {loading && <div className="loading-text">Loading issues...</div>}

              {openIssues.length>0 && <div className="section-label" style={{marginTop:4}}>Open <span className="count red">{openIssues.length}</span></div>}
              {openIssues.map(i => <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={canEdit(i.school_id)}/>)}

              {doneIssues.length>0 && <div className="section-label" style={{marginTop:18}}>Resolved <span className="count green">{doneIssues.length}</span></div>}
              {doneIssues.map(i => <IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={canEdit(i.school_id)}/>)}

              {!loading && issues.length===0 && <div className="no-issues">🎉 No issues recorded for this school</div>}
            </>
          )}
        </main>
      </div>

      {/* ── EDIT SCHOOL DETAILS MODAL ── */}
      {editModal && (
        <div onClick={()=>setEditModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(4px)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:20,padding:'28px 28px 24px',width:'100%',maxWidth:540,boxShadow:'0 24px 64px rgba(0,0,0,0.18)',animation:'fadeUp .2s ease',maxHeight:'90vh',overflowY:'auto'}}>
            {/* Modal header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:800,color:'#111827',letterSpacing:'-0.02em',marginBottom:2}}>Edit School Details</h2>
                <p className="si" style={{fontSize:12,color:'#6b7280'}}>{selected?.name}</p>
              </div>
              <button onClick={()=>setEditModal(false)} style={{background:'#f3f4f6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280'}}>✕</button>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Principal */}
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Principal Name</label>
                <input className="input" type="text" placeholder="Full name..."
                  value={editForm.principal||''} onChange={e=>setEditForm(f=>({...f,principal:e.target.value}))} style={{fontFamily:'var(--font-si)'}}/>
              </div>

              {/* Type + Medium */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>School Type</label>
                  <select className="input" style={{cursor:'pointer'}} value={editForm.type||''} onChange={e=>setEditForm(f=>({...f,type:e.target.value}))}>
                    <option value="">Select type...</option>
                    {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Medium</label>
                  <select className="input" style={{cursor:'pointer'}} value={editForm.medium||''} onChange={e=>setEditForm(f=>({...f,medium:e.target.value}))}>
                    <option value="">Select...</option>
                    {MEDIUMS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Students */}
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Students</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <label style={{fontSize:11,color:'#9ca3af',display:'block',marginBottom:4}}>Male</label>
                    <input className="input" type="number" min="0" value={editForm.students_m||0} onChange={e=>setEditForm(f=>({...f,students_m:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'#9ca3af',display:'block',marginBottom:4}}>Female</label>
                    <input className="input" type="number" min="0" value={editForm.students_f||0} onChange={e=>setEditForm(f=>({...f,students_f:e.target.value}))}/>
                  </div>
                </div>
                <div style={{marginTop:6,fontSize:12,color:'#9ca3af',fontWeight:500}}>
                  Total: {(Number(editForm.students_m||0) + Number(editForm.students_f||0)).toLocaleString()} students
                </div>
              </div>

              {/* Teachers */}
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Number of Teachers</label>
                <input className="input" type="number" min="0" style={{maxWidth:180}} value={editForm.teachers||0} onChange={e=>setEditForm(f=>({...f,teachers:e.target.value}))}/>
              </div>

              {/* Grade / Classification */}
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Classification (Grade)</label>
                <select className="input" style={{cursor:'pointer'}} value={editForm.classification||''} onChange={e=>setEditForm(f=>({...f,classification:e.target.value}))}>
                  <option value="">Select...</option>
                  {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div style={{display:'flex',gap:10,marginTop:22,alignItems:'center',borderTop:'1.5px solid #f3f4f6',paddingTop:18}}>
              {hasOverride && (
                <button onClick={resetToOriginal} className="btn btn-danger btn-sm" style={{marginRight:'auto'}}>
                  ↺ Reset to Original
                </button>
              )}
              <div style={{flex:1}}/>
              <button onClick={()=>setEditModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={saveEditModal} className="btn btn-primary btn-sm" disabled={editSaving} style={{minWidth:90}}>
                {editSaving ? '⏳ Saving...' : editFeedback==='saved' ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>

            {editFeedback==='error' && (
              <div className="error-msg" style={{marginTop:12}}>⚠️ Failed to save. Please try again.</div>
            )}
          </div>
        </div>
      )}
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
          onClick={()=>canEdit&&onToggle(issue)}
          style={!canEdit?{cursor:'default',opacity:0.5}:{}}
          title={canEdit?(issue.done?'Reopen':'Mark as resolved'):'Sign in to edit'}>
          {issue.done?'✓':''}
        </button>
        <div className="issue-body">
          <div className="issue-text">{issue.text}</div>
          {issue.image_url && (
            <div style={{marginTop:8}}>
              <img src={issue.image_url} alt="issue" style={{maxHeight:72,maxWidth:180,borderRadius:8,border:'1.5px solid #e5e7eb',cursor:'pointer',objectFit:'cover',transition:'transform .18s'}}
                onClick={()=>setImgOpen(true)} onMouseEnter={e=>e.target.style.transform='scale(1.03)'} onMouseLeave={e=>e.target.style.transform='scale(1)'} title="Click to enlarge"/>
            </div>
          )}
          <div className="issue-meta">
            <span className={`badge ${issue.done?'badge-done':'badge-open'}`}>{issue.done?'✓ Resolved':'⚠ Open'}</span>
            <span className="issue-date">{date}</span>
          </div>
        </div>
        {canEdit && <button className="del-btn" onClick={()=>onDelete(issue)} title="Delete">✕</button>}
      </div>
      {imgOpen && (
        <div onClick={()=>setImgOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,cursor:'pointer',backdropFilter:'blur(6px)'}}>
          <div style={{position:'relative',maxWidth:'90vw',maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>
            <img src={issue.image_url} alt="issue" style={{maxWidth:'100%',maxHeight:'82vh',borderRadius:14,display:'block',boxShadow:'0 32px 80px rgba(0,0,0,0.5)'}}/>
            <button onClick={()=>setImgOpen(false)} style={{position:'absolute',top:-12,right:-12,width:32,height:32,borderRadius:'50%',background:'#fff',border:'none',cursor:'pointer',fontSize:15,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>✕</button>
            <div style={{marginTop:12,textAlign:'center',color:'rgba(255,255,255,0.55)',fontSize:13,maxWidth:480,lineHeight:1.6}}>{issue.text}</div>
          </div>
        </div>
      )}
    </>
  )
}
