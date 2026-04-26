'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

export default function LoginPage() {
  const [tab, setTab] = useState('school') // 'admin' | 'school'
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
    if (tab === 'school' && !selectedSchoolId) { setError('පාසල තෝරන්න'); return }
    setLoading(true); setError('')

    try {
      const body = tab === 'admin'
        ? { type: 'admin', password }
        : { type: 'school', schoolId: Number(selectedSchoolId), password }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/tracker')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch { setError('Connection error') }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-emblem">🏫</div>
        <h1 className="login-title serif">School Tracker</h1>
        <p className="login-sub si">මාවනැල්ල අධ්‍යාපන කලාපය</p>

        {/* TAB SWITCHER */}
        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'school' ? 'active' : ''}`}
            onClick={() => { setTab('school'); setError(''); setPassword('') }}
          >
            🏫 School Login
          </button>
          <button
            className={`login-tab ${tab === 'admin' ? 'active' : ''}`}
            onClick={() => { setTab('admin'); setError(''); setPassword('') }}
          >
            🔐 Admin
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>

          {/* SCHOOL SELECT */}
          {tab === 'school' && (
            <div>
              <label className="input-label">🏫 ඔබේ පාසල</label>
              <div style={{position:'relative'}}>
                <input
                  className="input"
                  type="text"
                  placeholder="Search school / පාසල සොයන්න..."
                  value={selectedSchool ? selectedSchool.name : schoolQuery}
                  onChange={e => {
                    setSchoolQuery(e.target.value)
                    setSelectedSchoolId('')
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  autoComplete="off"
                />
                {selectedSchool && (
                  <button type="button" onClick={() => { setSelectedSchoolId(''); setSchoolQuery(''); }}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:16}}>✕</button>
                )}
                {showDropdown && !selectedSchool && (
                  <div className="school-dropdown">
                    {filteredSchools.length === 0
                      ? <div className="dropdown-empty">No schools found</div>
                      : filteredSchools.map(s => (
                        <div key={s.id} className="dropdown-item" onMouseDown={() => { setSelectedSchoolId(String(s.id)); setSchoolQuery(''); setShowDropdown(false); }}>
                          <div className="dropdown-name si">{s.name}</div>
                          <div className="dropdown-sub">{s.address_en} · {s.type}</div>
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

          {/* PASSWORD */}
          <div>
            <label className="input-label">
              {tab === 'admin' ? '🔐 Admin Password' : '🔑 School Password'}
            </label>
            <div className="input-wrap">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="Password..."
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoFocus={tab === 'admin'}
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <button type="submit" className="btn btn-primary"
            style={{width:'100%',padding:'12px',fontSize:'15px',marginTop:4}}
            disabled={loading || !password.trim() || (tab==='school' && !selectedSchoolId)}>
            {loading ? '⏳ Logging in...' : '🔓 Login'}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:20}}>
          <Link href="/" style={{fontSize:13,color:'var(--muted)',textDecoration:'none'}}>← Back to Home</Link>
        </div>
      </div>

      <p style={{color:'rgba(255,255,255,0.3)',fontSize:12,marginTop:20,textAlign:'center'}}>
        © 2025 මාවනැල්ල අධ්‍යාපන කලාප කාර්යාලය
      </p>
    </div>
  )
}
