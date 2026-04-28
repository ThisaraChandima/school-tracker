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
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      if (!d.loggedIn || d.role !== 'admin') { router.push('/login'); return }
      setAuthChecked(true)
      loadAccounts()
    })
  }, [])

  const loadAccounts = async () => {
    const res = await fetch('/api/schools')
    if (res.ok) {
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    }
  }

  const saveAccount = async (school) => {
    const pw = passwords[school.id]
    if (!pw?.trim()) return
    setSaving(school.id)
    const res = await fetch('/api/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: school.id, school_name: school.name, password: pw.trim() }),
    })
    if (res.ok) {
      setFeedback(prev => ({ ...prev, [school.id]: 'saved' }))
      setPasswords(prev => ({ ...prev, [school.id]: '' }))
      setTimeout(() => setFeedback(prev => ({ ...prev, [school.id]: '' })), 2000)
      loadAccounts()
    } else {
      setFeedback(prev => ({ ...prev, [school.id]: 'error' }))
    }
    setSaving(null)
  }

  const removeAccount = async (school) => {
    if (!confirm(`Remove access for ${school.name}?`)) return
    await fetch('/api/schools', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: school.id }),
    })
    loadAccounts()
  }

  const accountMap = Object.fromEntries(accounts.map(a => [a.school_id, a]))

  const filtered = query
    ? SCHOOLS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.search_en.includes(query.toLowerCase()) ||
        s.address_en.toLowerCase().includes(query.toLowerCase())
      )
    : SCHOOLS

  if (!authChecked) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="loading-text">Checking access...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--cream)'}}>
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-emblem">⚙️</div>
          <div><div className="topbar-title">Admin Panel — School Access</div></div>
        </div>
        <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
          <Link href="/tracker" className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>
            📋 Tracker
          </Link>
          <Link href="/" className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>
            🏠 Home
          </Link>
        </div>
      </header>

      <div style={{maxWidth:900,margin:'0 auto',padding:'24px 16px'}}>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:24}}>
          {[
            {icon:'🏫', n:SCHOOLS.length, l:'Total Schools'},
            {icon:'🔑', n:accounts.length, l:'Schools with Access'},
            {icon:'🔒', n:SCHOOLS.length - accounts.length, l:'No Access Yet'},
          ].map((s,i) => (
            <div key={i} className="stat-card" style={{padding:'16px',textAlign:'center'}}>
              <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
              <div style={{fontSize:26,fontWeight:700,color:'var(--navy)',lineHeight:1}}>{s.n}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{marginBottom:16}}>
          <div className="search-wrap" style={{position:'relative'}}>
            <span className="search-icon" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--muted)'}}>🔍</span>
            <input className="input" style={{paddingLeft:38}} type="text"
              placeholder="Search schools / පාසල සොයන්න..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        <div style={{fontSize:13,color:'var(--muted)',marginBottom:12}}>
          Showing {filtered.length} schools · Set a password to give a school edit access
        </div>

        {/* SCHOOL LIST */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map(school => {
            const acc = accountMap[school.id]
            const hasAccess = !!acc
            const pw = passwords[school.id] || ''
            const fb = feedback[school.id]

            return (
              <div key={school.id} className="card" style={{padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                  {/* School info */}
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span className="si" style={{fontWeight:600,fontSize:14,color:'var(--navy)'}}>{school.name}</span>
                      {hasAccess && (
                        <span style={{background:'#dcfce7',color:'#16a34a',fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600}}>
                          ✓ Access Granted
                        </span>
                      )}
                    </div>
                    <div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>
                      {school.address_en} · {school.type} · ID: {school.id}
                    </div>
                    {hasAccess && (
                      <div style={{fontSize:12,color:'var(--muted)',marginTop:3,display:'flex',alignItems:'center',gap:4}}>
                        🔑 Password: <span style={{
                          background:'var(--cream2)',padding:'1px 8px',borderRadius:6,
                          fontFamily:'monospace',letterSpacing:showPass[school.id] ? 0 : 2
                        }}>
                          {showPass[school.id] ? acc.password : '••••••••'}
                        </span>
                        <button onClick={() => setShowPass(p=>({...p,[school.id]:!p[school.id]}))}
                          style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--muted)'}}>
                          {showPass[school.id] ? '🙈' : '👁️'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Password input + actions */}
                  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',flexShrink:0}}>
                    <input
                      className="input" type="text"
                      style={{width:160,padding:'8px 12px',fontSize:13}}
                      placeholder={hasAccess ? 'New password...' : 'Set password...'}
                      value={pw}
                      onChange={e => setPasswords(p => ({...p, [school.id]: e.target.value}))}
                      onKeyDown={e => e.key === 'Enter' && saveAccount(school)}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => saveAccount(school)}
                      disabled={saving === school.id || !pw.trim()}
                      style={{minWidth:70}}
                    >
                      {saving === school.id ? '⏳' : fb === 'saved' ? '✓ Saved' : hasAccess ? '🔄 Update' : '🔑 Grant'}
                    </button>
                    {hasAccess && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeAccount(school)}>
                        🗑 Remove
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
