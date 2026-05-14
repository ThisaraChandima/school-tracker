'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SCHOOLS from '@/lib/schools'

const TABS = ['Access Control', 'Issue Stats', 'Bulk Actions', 'Schools']

export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [accounts, setAccounts] = useState([])
  const [allIssues, setAllIssues] = useState([])
  const [customSchools, setCustomSchools] = useState([])
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
  // Add school form
  const [addForm, setAddForm] = useState({ id:'', name:'', address:'', address_en:'', type:'', medium:'Sinhala', principal:'', students_m:0, students_f:0, teachers:0, classification:'' })
  const [addLoading, setAddLoading] = useState(false)
  const [addMsg, setAddMsg] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      if (!d.loggedIn || d.role !== 'admin') { router.push('/login'); return }
      setAuthChecked(true); loadAll()
    })
  }, [])

  const loadAll = async () => {
    const [accRes, issRes, csRes] = await Promise.all([
      fetch('/api/schools'),
      fetch('/api/issues'),
      fetch('/api/admin/schools'),
    ])
    if (accRes.ok) setAccounts(await accRes.json())
    if (issRes.ok) setAllIssues(await issRes.json())
    if (csRes.ok) setCustomSchools(await csRes.json())
  }

  const accountMap = useMemo(() => Object.fromEntries(accounts.map(a => [a.school_id, a])), [accounts])
  const issuesBySchool = useMemo(() => {
    const m = {}
    allIssues.forEach(i => {
      if (!m[i.school_id]) m[i.school_id] = { open:0, done:0, total:0, hasImage:0 }
      m[i.school_id].total++
      i.done ? m[i.school_id].done++ : m[i.school_id].open++
      if (i.image_url) m[i.school_id].hasImage++
    })
    return m
  }, [allIssues])

  const logout = async () => { await fetch('/api/auth', { method:'DELETE' }); router.push('/') }

  const saveAccount = async (school) => {
    const pw = passwords[school.id]; if (!pw?.trim()) return
    setSaving(school.id)
    const res = await fetch('/api/schools', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ school_id:school.id, school_name:school.name, password:pw.trim() }) })
    if (res.ok) {
      setFeedback(p=>({...p,[school.id]:'saved'}))
      setPasswords(p=>({...p,[school.id]:''}))
      setTimeout(()=>setFeedback(p=>({...p,[school.id]:''})), 2500)
      loadAll()
    }
    setSaving(null)
  }

  const removeAccount = async (school) => {
    if (!confirm(`Revoke access for ${school.name}?`)) return
    await fetch('/api/schools', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ school_id:school.id }) })
    loadAll()
  }

  const doIssueAction = async (school, action) => {
    const labels = { reset_issues:'Delete ALL issues', mark_all_done:'Mark ALL as resolved', mark_all_open:'Reopen ALL issues' }
    if (!confirm(`${labels[action]} for ${school.name}?`)) return
    setIssueAction(p=>({...p,[school.id]:action}))
    await fetch('/api/admin/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action, school_id:school.id }) })
    await loadAll()
    setIssueAction(p=>({...p,[school.id]:null}))
  }

  const doBulk = async (action) => {
    if (!selected.size) { setBulkMsg('Select at least one school'); return }
    if (action==='grant' && !bulkPw.trim()) { setBulkMsg('Enter a password'); return }
    if (action==='revoke' && !confirm(`Revoke access for ${selected.size} school(s)?`)) return
    setBulkLoading(true); setBulkMsg('')
    const schoolsData = Object.fromEntries([...selected].map(id=>[id, SCHOOLS.find(s=>s.id===id)?.name||String(id)]))
    const res = await fetch('/api/admin/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action, school_ids:[...selected], password:bulkPw, schools_data:schoolsData }) })
    const d = await res.json()
    setBulkMsg(res.ok ? `✓ Done — ${d.count} school(s) updated` : `Error: ${d.error}`)
    if (res.ok) { setSelected(new Set()); setBulkPw(''); loadAll() }
    setBulkLoading(false)
  }

  const addSchool = async () => {
    if (!addForm.id || !addForm.name.trim()) { setAddMsg('School ID and name are required'); return }
    setAddLoading(true); setAddMsg('')
    const res = await fetch('/api/admin/schools', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(addForm) })
    const d = await res.json()
    if (res.ok) {
      setAddMsg('✓ School added successfully!')
      setAddForm({ id:'', name:'', address:'', address_en:'', type:'', medium:'Sinhala', principal:'', students_m:0, students_f:0, teachers:0, classification:'' })
      setShowAddForm(false)
      loadAll()
    } else { setAddMsg(`Error: ${d.error}`) }
    setAddLoading(false)
  }

  const removeCustomSchool = async (school) => {
    if (!confirm(`Remove "${school.name}" and ALL its issues? This cannot be undone.`)) return
    await fetch(`/api/admin/schools/${school.id}`, { method:'DELETE' })
    loadAll()
  }

  const exportCSV = () => window.open('/api/admin/export', '_blank')

  const filteredSchools = useMemo(() => SCHOOLS.filter(s => {
    const q = query.toLowerCase()
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.search_en?.includes(q) || s.address_en?.toLowerCase().includes(q)
    const hasAcc = !!accountMap[s.id]
    if (filter==='access' && !hasAcc) return false
    if (filter==='no-access' && hasAcc) return false
    if (filter==='has-issues' && !issuesBySchool[s.id]) return false
    return matchQ
  }), [query, filter, accountMap, issuesBySchool])

  const totalOpen = allIssues.filter(i=>!i.done).length
  const totalDone = allIssues.filter(i=>i.done).length

  const inputStyle = { width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, fontFamily:'var(--font)', outline:'none', color:'#111827', background:'#fff' }
  const labelStyle = { fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }

  if (!authChecked) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="loading-text">Checking access...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <header className="topbar">
        <div className="topbar-brand">
          <div style={{width:30,height:30,borderRadius:7,overflow:'hidden',flexShrink:0}}>
            <Image src="/logo.png" alt="Logo" width={30} height={30} style={{objectFit:'cover'}} />
          </div>
          <div><div className="topbar-title">Admin Panel</div></div>
        </div>
        <div style={{display:'flex',gap:8,marginLeft:'auto',flexWrap:'wrap'}}>
          <Link href="/admin/analytics" style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:700,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',textDecoration:'none'}}>
            🤖 AI Analytics
          </Link>
          <button onClick={exportCSV} className="btn btn-ghost btn-sm">📥 Export CSV</button>
          <Link href="/tracker" className="btn btn-ghost btn-sm">📋 Tracker</Link>
          <Link href="/" className="btn btn-ghost btn-sm">🏠</Link>
          <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
        </div>
      </header>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 16px'}}>

        {/* Header */}
        <div style={{marginBottom:24}}>
          <p style={{fontSize:12,fontWeight:700,color:'var(--blue)',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:5}}>Administration</p>
          <h1 style={{fontSize:30,fontWeight:800,letterSpacing:'-0.03em',color:'var(--text)',marginBottom:4}}>Control Panel</h1>
          <p style={{fontSize:14,color:'var(--text2)'}}>Manage school access, monitor issues, run bulk actions and export data.</p>
        </div>

        {/* AI Analytics banner */}
        <div style={{background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',border:'1.5px solid #c4b5fd',borderRadius:16,padding:'16px 20px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,background:'#7c3aed',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🤖</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:'#4c1d95',marginBottom:2}}>AI Issue Analytics</div>
              <div style={{fontSize:13,color:'#7c3aed'}}>Search issues in English, view charts, AI zone summary & category analysis</div>
            </div>
          </div>
          <Link href="/admin/analytics" style={{padding:'9px 20px',borderRadius:9,fontSize:14,fontWeight:700,background:'#7c3aed',color:'#fff',textDecoration:'none',whiteSpace:'nowrap'}}>
            Open Analytics →
          </Link>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:24}}>
          {[
            {icon:'🏫', n:SCHOOLS.length + customSchools.length, l:'Total Schools', c:''},
            {icon:'🔑', n:accounts.length, l:'Access Granted', c:'green'},
            {icon:'📋', n:allIssues.length, l:'Total Issues', c:'blue'},
            {icon:'⚠️', n:totalOpen, l:'Open', c:'red'},
            {icon:'✅', n:totalDone, l:'Resolved', c:'green'},
          ].map((s,i)=>(
            <div key={i} className="stat-card" style={{padding:'14px'}}>
              <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
              <div className={`stat-num ${s.c}`} style={{fontSize:22}}>{s.n}</div>
              <div className="stat-label" style={{fontSize:11}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,background:'var(--bg2)',borderRadius:12,padding:4,marginBottom:20,border:'1.5px solid var(--border)',overflowX:'auto'}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,minWidth:'max-content',padding:'9px 12px',border:'none',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'var(--font)',transition:'all .2s',background:tab===i?'var(--navy)':'transparent',color:tab===i?'#fff':'var(--text2)',boxShadow:tab===i?'0 2px 8px rgba(0,0,0,0.12)':'none'}}>
              {t}
            </button>
          ))}
        </div>

        {/* Search + filter (tabs 0,1) */}
        {tab < 2 && (
          <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none'}}>🔍</span>
              <input className="input" style={{paddingLeft:38,fontSize:14}} type="text" placeholder="Search schools..." value={query} onChange={e=>setQuery(e.target.value)}/>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[['all','All'],['access','Has Access'],['no-access','No Access'],['has-issues','Has Issues']].map(([v,l])=>(
                <button key={v} onClick={()=>setFilter(v)} className={`btn btn-sm ${filter===v?'btn-primary':'btn-ghost'}`} style={{borderRadius:980,fontSize:12}}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 0: ACCESS CONTROL ── */}
        {tab===0 && (
          <div>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:12,fontWeight:500}}>{filteredSchools.length} schools shown</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filteredSchools.map(school=>{
                const acc=accountMap[school.id]; const pw=passwords[school.id]||''; const fb=feedback[school.id]
                return (
                  <div key={school.id} className="card" style={{padding:'15px 18px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                      <div style={{flex:1,minWidth:180}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:3}}>
                          <span className="si" style={{fontWeight:700,fontSize:13.5,color:'var(--text)'}}>{school.name}</span>
                          {acc ? <span style={{background:'#f0fdf4',color:'var(--green)',fontSize:10,padding:'2px 8px',borderRadius:980,fontWeight:700}}>✓ Access</span>
                               : <span style={{background:'var(--bg)',color:'var(--text3)',fontSize:10,padding:'2px 8px',borderRadius:980,fontWeight:600}}>No Access</span>}
                        </div>
                        <div style={{fontSize:11,color:'var(--text2)'}}>{school.address_en} · Type {school.type} · #{school.id}</div>
                        {acc && (
                          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:5,fontSize:12}}>
                            <span style={{color:'var(--text2)'}}>Password:</span>
                            <span style={{background:'var(--bg)',padding:'1px 8px',borderRadius:6,fontFamily:'monospace',letterSpacing:showPass[school.id]?0:3,fontSize:12}}>
                              {showPass[school.id]?acc.password:'••••••••'}
                            </span>
                            <button onClick={()=>setShowPass(p=>({...p,[school.id]:!p[school.id]}))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:13,padding:2}}>{showPass[school.id]?'🙈':'👁️'}</button>
                          </div>
                        )}
                      </div>
                      <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap',flexShrink:0}}>
                        <input className="input" type="text" style={{width:150,padding:'7px 11px',fontSize:13}} placeholder={acc?'New password...':'Set password...'} value={pw} onChange={e=>setPasswords(p=>({...p,[school.id]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&saveAccount(school)}/>
                        <button className={`btn btn-sm ${fb==='saved'?'btn-ghost':'btn-primary'}`} onClick={()=>saveAccount(school)} disabled={saving===school.id||!pw.trim()} style={{minWidth:76,fontSize:12}}>
                          {saving===school.id?'⏳':fb==='saved'?'✓ Saved':acc?'Update':'Grant'}
                        </button>
                        {acc && <button className="btn btn-danger btn-sm" onClick={()=>removeAccount(school)} style={{fontSize:12}}>Revoke</button>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB 1: ISSUE STATS ── */}
        {tab===1 && (
          <div>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:12,fontWeight:500}}>{filteredSchools.filter(s=>issuesBySchool[s.id]).length} schools with issues</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filteredSchools.map(school=>{
                const c=issuesBySchool[school.id]; const pct=c?Math.round((c.done/c.total)*100):0; const act=issueAction[school.id]
                return (
                  <div key={school.id} className="card" style={{padding:'15px 18px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                      <div style={{flex:1,minWidth:160}}>
                        <span className="si" style={{fontWeight:700,fontSize:13.5,color:'var(--text)',display:'block',marginBottom:2}}>{school.name}</span>
                        <span style={{fontSize:11,color:'var(--text2)'}}>{school.address_en} · Type {school.type}</span>
                      </div>
                      {c ? (
                        <>
                          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                            <span style={{background:'#fef2f2',color:'var(--red)',padding:'3px 10px',borderRadius:980,fontSize:12,fontWeight:700}}>⚠ {c.open}</span>
                            <span style={{background:'#f0fdf4',color:'var(--green)',padding:'3px 10px',borderRadius:980,fontSize:12,fontWeight:700}}>✓ {c.done}</span>
                            {c.hasImage>0&&<span style={{background:'var(--blue-light)',color:'var(--blue)',padding:'3px 10px',borderRadius:980,fontSize:12,fontWeight:600}}>📷 {c.hasImage}</span>}
                          </div>
                          <div style={{width:80}}>
                            <div style={{fontSize:10,color:'var(--text2)',marginBottom:3,textAlign:'right',fontWeight:600}}>{pct}%</div>
                            <div style={{background:'var(--bg)',borderRadius:980,height:6,overflow:'hidden'}}>
                              <div style={{width:`${pct}%`,height:'100%',background:'linear-gradient(90deg,var(--blue),var(--green))',borderRadius:980,transition:'width .8s ease'}}/>
                            </div>
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button className="btn btn-sm btn-ghost" onClick={()=>doIssueAction(school,'mark_all_done')} disabled={!!act} style={{fontSize:11}}>{act==='mark_all_done'?'⏳':'✓ All Done'}</button>
                            <button className="btn btn-sm btn-ghost" onClick={()=>doIssueAction(school,'mark_all_open')} disabled={!!act} style={{fontSize:11}}>{act==='mark_all_open'?'⏳':'↺ Reopen'}</button>
                            <button className="btn btn-sm btn-danger" onClick={()=>doIssueAction(school,'reset_issues')} disabled={!!act} style={{fontSize:11}}>{act==='reset_issues'?'⏳':'🗑 Clear'}</button>
                          </div>
                        </>
                      ) : <span style={{fontSize:12,color:'var(--text3)',fontStyle:'italic'}}>No issues logged</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: BULK ACTIONS ── */}
        {tab===2 && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="card" style={{padding:'24px 26px'}}>
              <h3 style={{fontSize:17,fontWeight:800,marginBottom:4}}>Bulk Access Management</h3>
              <p style={{fontSize:13,color:'var(--text2)',marginBottom:18}}>Select schools then grant or revoke access at once.</p>
              <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
                <input className="input" type="text" style={{width:200,fontSize:13}} placeholder="Password for bulk grant..." value={bulkPw} onChange={e=>setBulkPw(e.target.value)}/>
                <button className="btn btn-primary btn-sm" onClick={()=>doBulk('grant')} disabled={bulkLoading}>{bulkLoading?'⏳':`🔑 Grant ${selected.size>0?`(${selected.size})`:''}`}</button>
                <button className="btn btn-danger btn-sm" onClick={()=>doBulk('revoke')} disabled={bulkLoading}>{bulkLoading?'⏳':`🗑 Revoke ${selected.size>0?`(${selected.size})`:''}`}</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(new Set(SCHOOLS.map(s=>s.id)))}>Select All</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(new Set())}>Clear</button>
              </div>
              {bulkMsg && <div style={{background:bulkMsg.startsWith('✓')?'#f0fdf4':'#fef2f2',color:bulkMsg.startsWith('✓')?'var(--green)':'var(--red)',padding:'10px 14px',borderRadius:10,fontSize:13,fontWeight:600,marginBottom:14}}>{bulkMsg}</div>}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:8,maxHeight:400,overflowY:'auto',padding:'4px'}}>
                {SCHOOLS.map(s=>{
                  const isSel=selected.has(s.id); const hasAcc=!!accountMap[s.id]
                  return (
                    <div key={s.id} onClick={()=>setSelected(p=>{const n=new Set(p);isSel?n.delete(s.id):n.add(s.id);return n})} style={{padding:'10px 12px',borderRadius:12,cursor:'pointer',border:`1.5px solid ${isSel?'var(--blue)':'var(--border)'}`,background:isSel?'var(--blue-light)':'var(--bg)',display:'flex',alignItems:'center',gap:10,transition:'all .15s'}}>
                      <div style={{width:18,height:18,borderRadius:6,border:`2px solid ${isSel?'var(--blue)':'var(--border2)'}`,background:isSel?'var(--blue)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:800,flexShrink:0}}>{isSel?'✓':''}</div>
                      <div style={{minWidth:0}}>
                        <div className="si" style={{fontSize:12,fontWeight:600,color:'var(--text)',lineHeight:1.3}}>{s.name}</div>
                        <div style={{fontSize:10,color:'var(--text2)',marginTop:1}}>{s.address_en}{hasAcc&&<span style={{color:'var(--green)',marginLeft:5,fontWeight:600}}>· Access ✓</span>}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="card" style={{padding:'22px 26px'}}>
              <h3 style={{fontSize:17,fontWeight:800,marginBottom:4}}>Export Data</h3>
              <p style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>Download all issues as a CSV file.</p>
              <button className="btn btn-primary" onClick={exportCSV}>📥 Download Issues CSV</button>
            </div>
          </div>
        )}

        {/* ── TAB 3: SCHOOLS MANAGEMENT ── */}
        {tab===3 && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* Add school */}
            <div className="card" style={{padding:'22px 24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:showAddForm?18:0}}>
                <div>
                  <h3 style={{fontSize:17,fontWeight:800,color:'var(--text)',marginBottom:3}}>➕ Add New School</h3>
                  <p style={{fontSize:13,color:'var(--text2)'}}>Add a school not in the original 2026 Excel directory</p>
                </div>
                <button className={`btn btn-sm ${showAddForm?'btn-ghost':'btn-primary'}`} onClick={()=>setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'Cancel' : '+ Add School'}
                </button>
              </div>

              {showAddForm && (
                <div style={{display:'flex',flexDirection:'column',gap:14,borderTop:'1.5px solid var(--border)',paddingTop:18}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
                    <div>
                      <label style={labelStyle}>School ID <span style={{color:'var(--red)'}}>*</span></label>
                      <input style={inputStyle} type="number" placeholder="e.g. 24999" value={addForm.id} onChange={e=>setAddForm(f=>({...f,id:e.target.value}))} />
                      <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>Must be unique. Use 5-digit number.</div>
                    </div>
                    <div>
                      <label style={labelStyle}>School Name (Sinhala) <span style={{color:'var(--red)'}}>*</span></label>
                      <input style={{...inputStyle,fontFamily:'var(--font-si)'}} type="text" placeholder="e.g. නව ම.ම.වි" value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Address (Sinhala)</label>
                      <input style={{...inputStyle,fontFamily:'var(--font-si)'}} type="text" placeholder="e.g. මාවනැල්ල" value={addForm.address} onChange={e=>setAddForm(f=>({...f,address:e.target.value}))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Address (English)</label>
                      <input style={inputStyle} type="text" placeholder="e.g. Mawanella" value={addForm.address_en} onChange={e=>setAddForm(f=>({...f,address_en:e.target.value}))} />
                    </div>
                    <div>
                      <label style={labelStyle}>School Type</label>
                      <select style={{...inputStyle,cursor:'pointer'}} value={addForm.type} onChange={e=>setAddForm(f=>({...f,type:e.target.value}))}>
                        <option value="">Select...</option>
                        {['1AB','1C','2','3'].map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Medium</label>
                      <select style={{...inputStyle,cursor:'pointer'}} value={addForm.medium} onChange={e=>setAddForm(f=>({...f,medium:e.target.value}))}>
                        {['Sinhala','Tamil','Bilingual'].map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Principal Name</label>
                      <input style={{...inputStyle,fontFamily:'var(--font-si)'}} type="text" placeholder="Full name..." value={addForm.principal} onChange={e=>setAddForm(f=>({...f,principal:e.target.value}))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Teachers</label>
                      <input style={inputStyle} type="number" min="0" value={addForm.teachers} onChange={e=>setAddForm(f=>({...f,teachers:e.target.value}))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Students (Male)</label>
                      <input style={inputStyle} type="number" min="0" value={addForm.students_m} onChange={e=>setAddForm(f=>({...f,students_m:e.target.value}))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Students (Female)</label>
                      <input style={inputStyle} type="number" min="0" value={addForm.students_f} onChange={e=>setAddForm(f=>({...f,students_f:e.target.value}))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Classification</label>
                      <select style={{...inputStyle,cursor:'pointer'}} value={addForm.classification} onChange={e=>setAddForm(f=>({...f,classification:e.target.value}))}>
                        <option value="">Select...</option>
                        {['ව.ප්‍රි.ම','ප්‍රි.ම','ප්‍රි.ම.නො','දුෂ්කර','අති දුෂ්කර'].map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  {addMsg && (
                    <div style={{background:addMsg.startsWith('✓')?'#f0fdf4':'#fef2f2',color:addMsg.startsWith('✓')?'var(--green)':'var(--red)',padding:'10px 14px',borderRadius:10,fontSize:13,fontWeight:600}}>
                      {addMsg}
                    </div>
                  )}

                  <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>{setShowAddForm(false);setAddMsg('')}}>Cancel</button>
                    <button className="btn btn-primary" onClick={addSchool} disabled={addLoading||!addForm.id||!addForm.name.trim()}>
                      {addLoading ? '⏳ Adding...' : '✓ Add School'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom schools list */}
            <div className="card" style={{padding:'22px 24px'}}>
              <h3 style={{fontSize:17,fontWeight:800,color:'var(--text)',marginBottom:4}}>📋 Custom Schools Added</h3>
              <p style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>Schools you have added beyond the original Excel directory.</p>

              {customSchools.length === 0 ? (
                <div style={{textAlign:'center',padding:'28px',border:'1.5px dashed var(--border)',borderRadius:12,color:'var(--text3)'}}>
                  <div style={{fontSize:32,marginBottom:8}}>🏫</div>
                  <p style={{fontSize:14,fontWeight:500}}>No custom schools added yet</p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {customSchools.map(school => (
                    <div key={school.id} style={{background:'#f9fafb',border:'1.5px solid var(--border)',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                      <div style={{flex:1,minWidth:180}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                          <span className="si" style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{school.name}</span>
                          <span style={{background:'#eff6ff',color:'var(--blue)',fontSize:10,padding:'2px 8px',borderRadius:980,fontWeight:700,border:'1px solid #bfdbfe'}}>CUSTOM</span>
                        </div>
                        <div style={{fontSize:12,color:'var(--text2)',marginBottom:2}}>{school.address_en} · Type {school.type||'N/A'} · ID: {school.id}</div>
                        <div style={{fontSize:12,color:'var(--text2)'}}>
                          Medium: {school.medium} · Teachers: {school.teachers} · Students: {(school.students_m+school.students_f).toLocaleString()}
                        </div>
                        {issuesBySchool[school.id] && (
                          <div style={{display:'flex',gap:8,marginTop:6}}>
                            <span style={{background:'#fef2f2',color:'var(--red)',padding:'2px 9px',borderRadius:980,fontSize:11,fontWeight:700}}>⚠ {issuesBySchool[school.id].open} open</span>
                            <span style={{background:'#f0fdf4',color:'var(--green)',padding:'2px 9px',borderRadius:980,fontSize:11,fontWeight:700}}>✓ {issuesBySchool[school.id].done} done</span>
                          </div>
                        )}
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={()=>removeCustomSchool(school)} style={{flexShrink:0}}>
                        🗑 Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info about removing Excel schools */}
            <div style={{background:'#fffbeb',border:'1.5px solid #fde68a',borderRadius:14,padding:'16px 20px',display:'flex',gap:12}}>
              <div style={{fontSize:20,flexShrink:0}}>ℹ️</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#92400e',marginBottom:4}}>About the original 134 schools</div>
                <div style={{fontSize:13,color:'#b45309',lineHeight:1.6}}>
                  The original 134 schools from the 2026 Excel directory are built into the app and cannot be deleted here. You can edit their details (principal, students, teachers) from the tracker page when logged in as admin. To remove a school from the Excel list, you would need to update the <code style={{background:'rgba(0,0,0,0.08)',padding:'1px 5px',borderRadius:4}}>lib/schools.js</code> file in the source code.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
