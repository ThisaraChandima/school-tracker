'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

export default function AdminPage() {
  const [accounts, setAccounts] = useState([])
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(null)
  const [passwords, setPasswords] = useState({})
  const [showPass, setShowPass] = useState({})
  const [feedback, setFeedback] = useState({})
  const [authChecked, setAuthChecked] = useState(false)
  const [filter, setFilter] = useState('all') // all | access | no-access
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      if (!d.loggedIn || d.role !== 'admin') { router.push('/login'); return }
      setAuthChecked(true); loadAccounts()
    })
  }, [])

  const loadAccounts = async () => {
    const res = await fetch('/api/schools')
    if (res.ok) { const data = await res.json(); setAccounts(Array.isArray(data)?data:[]) }
  }

  const saveAccount = async (school) => {
    const pw = passwords[school.id]
    if (!pw?.trim()) return
    setSaving(school.id)
    const res = await fetch('/api/schools', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ school_id:school.id, school_name:school.name, password:pw.trim() }),
    })
    if (res.ok) {
      setFeedback(p => ({...p,[school.id]:'saved'}))
      setPasswords(p => ({...p,[school.id]:''}))
      setTimeout(() => setFeedback(p => ({...p,[school.id]:''})), 2500)
      loadAccounts()
    } else setFeedback(p => ({...p,[school.id]:'error'}))
    setSaving(null)
  }

  const removeAccount = async (school) => {
    if (!confirm(`Remove login access for ${school.name}?`)) return
    await fetch('/api/schools', {
      method:'DELETE', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ school_id: school.id }),
    })
    loadAccounts()
  }

  const logout = async () => {
    await fetch('/api/auth', { method:'DELETE' })
    router.push('/')
  }

  const accountMap = Object.fromEntries(accounts.map(a => [a.school_id, a]))

  const filtered = SCHOOLS.filter(s => {
    const q = query.toLowerCase()
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.search_en.includes(q) || s.address_en.toLowerCase().includes(q)
    const hasAcc = !!accountMap[s.id]
    if (filter === 'access' && !hasAcc) return false
    if (filter === 'no-access' && hasAcc) return false
    return matchQ
  })

  if (!authChecked) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="loading-text">Checking access...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-emblem" style={{background:'var(--blue)',borderRadius:8}}>⚙️</div>
          <div><div className="topbar-title display">Admin Panel</div></div>
        </div>
        <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
          <Link href="/tracker" className="btn btn-ghost btn-sm">📋 Tracker</Link>
          <Link href="/" className="btn btn-ghost btn-sm">🏠</Link>
          <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
        </div>
      </header>

      <div style={{maxWidth:960,margin:'0 auto',padding:'28px 16px'}}>

        {/* HEADER */}
        <div style={{marginBottom:28}}>
          <p style={{fontSize:13,fontWeight:600,color:'var(--blue)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:6}}>
            Administration
          </p>
          <h1 className="display" style={{fontSize:28,fontWeight:800,letterSpacing:'-0.03em',color:'var(--text)',marginBottom:6}}>
            School Access Control
          </h1>
          <p style={{fontSize:14,color:'var(--text2)'}}>
            Grant or revoke login access for individual schools. Schools can only edit their own issues.
          </p>
        </div>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:28}}>
          {[
            {icon:'🏫',n:SCHOOLS.length,l:'Total Schools',c:''},
            {icon:'🔑',n:accounts.length,l:'Access Granted',c:'green'},
            {icon:'🔒',n:SCHOOLS.length-accounts.length,l:'No Access',c:''},
          ].map((s,i)=>(
            <div key={i} className="stat-card">
              <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
              <div className={`stat-num ${s.c}`} style={{fontSize:28}}>{s.n}</div>
              <div className="stat-label">{s.l}</div>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTER */}
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <div className="search-wrap" style={{position:'relative',flex:1,minWidth:200}}>
            <span className="search-icon" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}>🔍</span>
            <input className="input" style={{paddingLeft:38,fontSize:14}} type="text"
              placeholder="Search schools..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div style={{display:'flex',gap:6}}>
            {[['all','All'],['access','Has Access'],['no-access','No Access']].map(([v,l])=>(
              <button key={v} onClick={() => setFilter(v)}
                className={`btn btn-sm ${filter===v?'btn-primary':'btn-ghost'}`}
                style={{borderRadius:980}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{fontSize:13,color:'var(--text2)',marginBottom:14,fontWeight:500}}>
          Showing {filtered.length} school{filtered.length!==1?'s':''}
        </div>

        {/* SCHOOL LIST */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map((school,idx) => {
            const acc = accountMap[school.id]
            const hasAccess = !!acc
            const pw = passwords[school.id] || ''
            const fb = feedback[school.id]
            return (
              <div key={school.id} className="card" style={{padding:'16px 20px',animation:`fadeUp 0.3s ease ${idx*0.03}s both`}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:14,flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:180}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                      <span className="si" style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{school.name}</span>
                      {hasAccess
                        ? <span style={{background:'#f0fdf4',color:'var(--green-dark)',fontSize:11,padding:'2px 9px',borderRadius:980,fontWeight:700}}>✓ Access Granted</span>
                        : <span style={{background:'var(--bg)',color:'var(--text3)',fontSize:11,padding:'2px 9px',borderRadius:980,fontWeight:600}}>No Access</span>
                      }
                    </div>
                    <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>
                      {school.address_en} · Type {school.type} · ID: {school.id}
                    </div>
                    {hasAccess && (
                      <div style={{fontSize:12,color:'var(--text2)',display:'flex',alignItems:'center',gap:6}}>
                        <span>Password:</span>
                        <span style={{
                          background:'var(--bg)',padding:'2px 10px',borderRadius:8,
                          fontFamily:'monospace',letterSpacing:showPass[school.id]?0:3,
                          fontSize:13,
                        }}>
                          {showPass[school.id] ? acc.password : '••••••••'}
                        </span>
                        <button onClick={() => setShowPass(p=>({...p,[school.id]:!p[school.id]}))}
                          style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:14,lineHeight:1,padding:2,borderRadius:4}}>
                          {showPass[school.id]?'🙈':'👁️'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',flexShrink:0}}>
                    <input className="input" type="text" style={{width:160,padding:'8px 12px',fontSize:13}}
                      placeholder={hasAccess?'New password...':'Set password...'}
                      value={pw}
                      onChange={e => setPasswords(p=>({...p,[school.id]:e.target.value}))}
                      onKeyDown={e => e.key==='Enter' && saveAccount(school)} />
                    <button className={`btn btn-sm ${fb==='saved'?'btn-ghost':'btn-primary'}`}
                      onClick={() => saveAccount(school)}
                      disabled={saving===school.id || !pw.trim()}
                      style={{minWidth:80}}>
                      {saving===school.id ? '⏳' : fb==='saved' ? '✓ Saved' : hasAccess ? 'Update' : 'Grant Access'}
                    </button>
                    {hasAccess && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeAccount(school)}>
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
