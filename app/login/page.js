'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

export default function LoginPage() {
  const [tab, setTab] = useState('school')
  const [password, setPassword] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [schoolQuery, setSchoolQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const filteredSchools = schoolQuery
    ? SCHOOLS.filter(s =>
        s.name.toLowerCase().includes(schoolQuery.toLowerCase()) ||
        s.search_en.includes(schoolQuery.toLowerCase()) ||
        s.address_en.toLowerCase().includes(schoolQuery.toLowerCase())
      ).slice(0, 8)
    : SCHOOLS.slice(0, 8)

  const selectedSchool = SCHOOLS.find(s => s.id === Number(selectedSchoolId))

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!password.trim()) return
    if (tab === 'school' && !selectedSchoolId) { setError('Please select your school'); return }
    setLoading(true); setError('')
    try {
      const body = tab === 'admin'
        ? { type: 'admin', password }
        : { type: 'school', schoolId: Number(selectedSchoolId), password }
      const res = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) { router.push('/tracker') }
      else { setError(data.error || 'Invalid credentials') }
    } catch { setError('Connection error. Please try again.') }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-emblem">🏫</div>
        <h1 className="login-title display">Welcome Back</h1>
        <p className="login-sub">Mawanella Education Zone · 2026</p>

        <div className="login-tabs">
          <button className={`login-tab ${tab==='school'?'active':''}`}
            onClick={() => { setTab('school'); setError(''); setPassword('') }}>
            🏫 School Login
          </button>
          <button className={`login-tab ${tab==='admin'?'active':''}`}
            onClick={() => { setTab('admin'); setError(''); setPassword('') }}>
            🔐 Admin
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {tab === 'school' && (
            <div>
              <label className="input-label">Your School</label>
              <div style={{position:'relative'}}>
                <input className="input" type="text" autoComplete="off"
                  placeholder="Search school by name or area..."
                  value={selectedSchool ? selectedSchool.name : schoolQuery}
                  onChange={e => { setSchoolQuery(e.target.value); setSelectedSchoolId(''); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {selectedSchool && (
                  <button type="button" onClick={() => { setSelectedSchoolId(''); setSchoolQuery('') }}
                    style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:16,lineHeight:1}}>✕</button>
                )}
                {showDropdown && !selectedSchool && (
                  <div className="school-dropdown">
                    {filteredSchools.length === 0
                      ? <div className="dropdown-empty">No schools found</div>
                      : filteredSchools.map(s => (
                          <div key={s.id} className="dropdown-item"
                            onMouseDown={() => { setSelectedSchoolId(String(s.id)); setSchoolQuery(''); setShowDropdown(false) }}>
                            <div className="dropdown-name si">{s.name}</div>
                            <div className="dropdown-sub">{s.address_en} · Type {s.type || 'N/A'}</div>
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
              {selectedSchool && (
                <div className="selected-school-badge">
                  ✓ {selectedSchool.name} — {selectedSchool.address_en}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="input-label">{tab === 'admin' ? 'Admin Password' : 'School Password'}</label>
            <div className="input-wrap">
              <input className="input" type={showPass?'text':'password'} placeholder="Enter password..."
                value={password} onChange={e => { setPassword(e.target.value); setError('') }} autoFocus={tab==='admin'} />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <button type="submit" className="btn btn-primary"
            style={{width:'100%',padding:'13px',fontSize:'15px',marginTop:4,borderRadius:14}}
            disabled={loading || !password.trim() || (tab==='school' && !selectedSchoolId)}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:20}}>
          <Link href="/" style={{fontSize:13,color:'var(--text3)',textDecoration:'none',fontWeight:500}}>
            ← Back to Home
          </Link>
        </div>
      </div>

      <p style={{color:'rgba(255,255,255,0.25)',fontSize:12,marginTop:24,textAlign:'center',position:'relative',zIndex:1}}>
        © 2026 Mawanella Education Zone
      </p>
    </div>
  )
}
