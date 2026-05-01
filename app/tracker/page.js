'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

export default function TrackerPage() {
  const [query, setQuery]           = useState('')
  const [selected, setSelected]     = useState(null)
  const [issues, setIssues]         = useState([])
  const [allCounts, setAllCounts]   = useState({})
  const [newText, setNewText]       = useState('')
  const [imgFile, setImgFile]       = useState(null)
  const [imgPrev, setImgPrev]       = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [adding, setAdding]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [sideOpen, setSideOpen]     = useState(false)
  const [auth, setAuth]             = useState({ loggedIn: false, role: 'guest', schoolId: null })
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
      const s = SCHOOLS.find(s => s.id === auth.schoolId)
      if (s && !selected) selectSchool(s)
    }
  }, [auth])

  const canEdit = (sid) => {
    if (!auth.loggedIn) return false
    if (auth.role === 'admin') return true
    if (auth.role === 'school') return auth.schoolId === sid
    return false
  }

  const filtered = query
    ? SCHOOLS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.address.toLowerCase().includes(query.toLowerCase()) ||
        s.search_en.includes(query.toLowerCase()) ||
        s.address_en.toLowerCase().includes(query.toLowerCase()) ||
        String(s.id).includes(query))
    : SCHOOLS

  const loadIssues = useCallback(async (sid) => {
    setLoading(true)
    const res = await fetch(`/api/issues?school_id=${sid}`)
    const d = await res.json()
    setIssues(Array.isArray(d) ? d : [])
    setLoading(false)
  }, [])

  const selectSchool = (s) => {
    setSelected(s); setNewText(''); setImgFile(null); setImgPrev(null)
    loadIssues(s.id); setSideOpen(false)
  }

  const clearImg = () => { setImgFile(null); setImgPrev(null); if (fileRef.current) fileRef.current.value = '' }

  const handleImg = (e) => {
    const f = e.target.files[0]; if (!f) return
    setImgFile(f)
    const r = new FileReader(); r.onload = ev => setImgPrev(ev.target.result); r.readAsDataURL(f)
  }

  const addIssue = async () => {
    if (!newText.trim() || !selected || adding || !canEdit(selected.id)) return
    setAdding(true)
    let image_url = null
    if (imgFile) {
      setUploading(true)
      const fd = new FormData(); fd.append('file', imgFile); fd.append('school_id', String(selected.id))
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (up.ok) { const d = await up.json(); image_url = d.url }
      setUploading(false)
    }
    const res = await fetch('/api/issues', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ school_id:selected.id, text:newText.trim(), image_url }) })
    if (res.ok) {
      const issue = await res.json()
      setIssues(p => [issue, ...p])
      setAllCounts(p => ({ ...p, [selected.id]: { open:(p[selected.id]?.open||0)+1, done:p[selected.id]?.done||0 } }))
      setNewText(''); clearImg()
    }
    setAdding(false)
  }

  const toggleIssue = async (issue) => {
    if (!canEdit(issue.school_id)) return
    const res = await fetch(`/api/issues/${issue.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ done:!issue.done }) })
    if (res.ok) {
      setIssues(p => p.map(i => i.id===issue.id ? {...i,done:!i.done} : i))
      setAllCounts(p => {
        const c = {...(p[selected.id]||{open:0,done:0})}
        issue.done ? (c.open++,c.done--) : (c.done++,c.open--)
        return {...p,[selected.id]:c}
      })
    }
  }

  const deleteIssue = async (issue) => {
    if (!canEdit(issue.school_id) || !confirm('Delete this issue?')) return
    const res = await fetch(`/api/issues/${issue.id}`, { method:'DELETE' })
    if (res.ok) {
      setIssues(p => p.filter(i => i.id!==issue.id))
      setAllCounts(p => {
        const c = {...(p[selected.id]||{open:0,done:0})}
        issue.done ? c.done-- : c.open--
        return {...p,[selected.id]:c}
      })
    }
  }

  const logout = async () => { await fetch('/api/auth',{method:'DELETE'}); setAuth({loggedIn:false,role:'guest',schoolId:null}); router.push('/') }

  const totalOpen = Object.values(allCounts).reduce((a,c)=>a+(c.open||0),0)
  const totalDone = Object.values(allCounts).reduce((a,c)=>a+(c.done||0),0)
  const openIssues = issues.filter(i=>!i.done)
  const doneIssues = issues.filter(i=>i.done)
  const userCanEdit = selected ? canEdit(selected.id) : false

  return (
    <div className="tracker-page">
      <header className="topbar">
        <button className="menu-toggle" onClick={()=>setSideOpen(true)}>☰</button>
        <div style={{display:'flex',alignItems:'center',gap:9,flex:1,minWidth:0}}>
          <div className="topbar-logo">🏫</div>
          <span className="topbar-title serif">Issue Tracker</span>
        </div>
        <div className="topbar-chips">
          <div className="topbar-chip"><div className="n">{SCHOOLS.length}</div><div className="l">Schools</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'var(--red)'}}>{totalOpen}</div><div className="l">Open</div></div>
          <div className="topbar-chip"><div className="n" style={{color:'var(--green)'}}>{totalDone}</div><div className="l">Done</div></div>
        </div>
        <div style={{display:'flex',gap:7,marginLeft:'auto',alignItems:'center'}}>
          {authChecked && (auth.loggedIn ? (
            <>
              <span style={{fontSize:11,color:'var(--text2)',display:'flex',alignItems:'center',gap:5,fontWeight:600}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>
                {auth.role==='admin'?'Admin':'School'}
              </span>
              {auth.role==='admin' && <Link href="/admin" className="btn btn-ghost btn-xs">⚙ Admin</Link>}
              <button onClick={logout} className="btn btn-ghost btn-xs">Sign Out</button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-xs">Sign In</Link>
          ))}
          <Link href="/" className="btn btn-ghost btn-xs">🏠</Link>
        </div>
      </header>

      <div className="tracker-body">
        <div className={`mobile-overlay ${sideOpen?'show':''}`} onClick={()=>setSideOpen(false)}/>

        <aside className={`sidebar ${sideOpen?'open':''}`}>
          <button className="sidebar-close" onClick={()=>setSideOpen(false)}>✕</button>
          {/* Mobile stats */}
          <div style={{display:'flex',gap:7,padding:'10px 10px 7px',borderBottom:'1px solid var(--border)'}}>
            {[{n:totalOpen,l:'Open',c:'var(--red)'},{n:totalDone,l:'Done',c:'var(--green)'},{n:SCHOOLS.length,l:'Schools',c:'var(--text)'}].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:'center',background:'var(--bg)',borderRadius:9,padding:'7px 4px'}}>
                <div style={{fontFamily:'Instrument Serif,serif',fontSize:18,color:s.c,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:9,color:'var(--text3)',marginTop:2,fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em'}}>{s.l}</div>
              </div>
            ))}
          </div>

          <div className="sidebar-search">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" type="text" placeholder="Search schools..." value={query} onChange={e=>setQuery(e.target.value)}/>
            </div>
            {query && <div style={{fontSize:11,color:'var(--text2)',marginTop:5,paddingLeft:2,fontWeight:500}}>{filtered.length} result{filtered.length!==1?'s':''}</div>}
          </div>

          <div className="school-list">
            {filtered.length===0 && <div className="no-issues">No schools found</div>}
            {filtered.map(s => {
              const c = allCounts[s.id]
              const isMine = auth.role==='school' && auth.schoolId===s.id
              return (
                <div key={s.id} className={`school-item ${selected?.id===s.id?'active':''}`} onClick={()=>selectSchool(s)}>
                  {isMine && <div style={{position:'absolute',left:8,top:8,fontSize:9,background:'var(--gold)',color:'#fff',borderRadius:4,padding:'1px 5px',fontWeight:700,letterSpacing:'.02em'}}>MY SCHOOL</div>}
                  <div className="school-name" style={isMine?{paddingTop:14}:{}}>{s.name}</div>
                  <div className="school-addr">{s.address_en}</div>
                  <div className="school-type">Type {s.type||'N/A'} · {s.medium==='සිංහල'?'Sinhala':s.medium==='දෙමළ'?'Tamil':'Bilingual'}</div>
                  {c && (c.open>0||c.done>0) && (
                    <div className="issue-dots">
                      {c.open>0&&<div className="dot dot-red"/>}
                      {c.done>0&&<div className="dot dot-green"/>}
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
              <p>{auth.role==='school'?'Loading your school...':'Select a school to view issues'}</p>
            </div>
          ) : (
            <>
              <div className="school-header-card">
                <h2 className="serif">{selected.name}</h2>
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

              <div className="section-label serif">
                All Issues <span className="count">{issues.length}</span>
              </div>

              {userCanEdit ? (
                <div className="add-box">
                  <textarea placeholder="Describe the issue... (Ctrl+Enter to submit)"
                    value={newText} onChange={e=>setNewText(e.target.value)}
                    onKeyDown={e=>{if(e.ctrlKey&&e.key==='Enter')addIssue()}}/>
                  {imgPrev && (
                    <div style={{margin:'8px 0',position:'relative',display:'inline-block'}}>
                      <img src={imgPrev} alt="preview" style={{maxHeight:90,maxWidth:'100%',borderRadius:9,border:'1px solid var(--border)'}}/>
                      <button onClick={clearImg} style={{position:'absolute',top:-7,right:-7,width:20,height:20,borderRadius:'50%',background:'var(--red)',color:'#fff',border:'none',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800}}>✕</button>
                    </div>
                  )}
                  <div className="add-box-row">
                    <button className="btn btn-ghost btn-xs" onClick={()=>fileRef.current?.click()}>📷 {imgFile?'Change':'Add Photo'}</button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={handleImg}/>
                    <div style={{flex:1}}/>
                    <button className="btn btn-ghost btn-xs" onClick={()=>{setNewText('');clearImg()}}>Clear</button>
                    <button className="btn btn-primary btn-xs" onClick={addIssue} disabled={adding||!newText.trim()}>
                      {uploading?'Uploading…':adding?'Adding…':'+ Add Issue'}
                    </button>
                  </div>
                </div>
              ) : (
                authChecked && (
                  <div className="readonly-notice">
                    👁 View only —
                    <Link href="/login" style={{color:'var(--blue)',fontWeight:600,textDecoration:'none',marginLeft:4}}>Sign in to edit →</Link>
                  </div>
                )
              )}

              {loading && <div className="loading-text">Loading…</div>}

              {openIssues.length>0 && <div className="section-label serif" style={{marginTop:4}}>Open <span className="count red">{openIssues.length}</span></div>}
              {openIssues.map(i=><IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={canEdit(i.school_id)}/>)}

              {doneIssues.length>0 && <div className="section-label serif" style={{marginTop:16}}>Resolved <span className="count green">{doneIssues.length}</span></div>}
              {doneIssues.map(i=><IssueCard key={i.id} issue={i} onToggle={toggleIssue} onDelete={deleteIssue} canEdit={canEdit(i.school_id)}/>)}

              {!loading && issues.length===0 && <div className="no-issues">🎉 No issues for this school</div>}
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
        <button className={`check-btn ${issue.done?'checked':''}`} onClick={()=>canEdit&&onToggle(issue)} style={!canEdit?{cursor:'default',opacity:.5}:{}} title={canEdit?(issue.done?'Reopen':'Mark resolved'):'Sign in to edit'}>
          {issue.done?'✓':''}
        </button>
        <div className="issue-body">
          <div className="issue-text">{issue.text}</div>
          {issue.image_url && (
            <div style={{marginTop:8}}>
              <img src={issue.image_url} alt="issue" style={{maxHeight:70,maxWidth:170,borderRadius:8,border:'1px solid var(--border)',cursor:'pointer',objectFit:'cover',transition:'transform .2s'}}
                onClick={()=>setImgOpen(true)} onMouseEnter={e=>e.target.style.transform='scale(1.04)'} onMouseLeave={e=>e.target.style.transform='scale(1)'} title="Click to enlarge"/>
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
        <div onClick={()=>setImgOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,cursor:'pointer',backdropFilter:'blur(8px)',animation:'fadeIn .2s ease'}}>
          <div style={{position:'relative',maxWidth:'90vw',maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>
            <img src={issue.image_url} alt="issue" style={{maxWidth:'100%',maxHeight:'82vh',borderRadius:14,display:'block',boxShadow:'0 40px 80px rgba(0,0,0,.5)'}}/>
            <button onClick={()=>setImgOpen(false)} style={{position:'absolute',top:-13,right:-13,width:30,height:30,borderRadius:'50%',background:'#fff',border:'none',cursor:'pointer',fontSize:15,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(0,0,0,.25)'}}>✕</button>
            <p style={{marginTop:12,textAlign:'center',color:'rgba(255,255,255,.55)',fontSize:13,lineHeight:1.6}}>{issue.text}</p>
          </div>
        </div>
      )}
    </>
  )
}
