'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

export default function LoginPage() {
  const [tab, setTab]   = useState('school')
  const [pw, setPw]     = useState('')
  const [selId, setSelId] = useState('')
  const [q, setQ]       = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  const filtered = q
    ? SCHOOLS.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.search_en.includes(q.toLowerCase()) || s.address_en.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : SCHOOLS.slice(0, 8)

  const selSchool = SCHOOLS.find(s => s.id === Number(selId))

  const submit = async (e) => {
    e.preventDefault()
    if (!pw.trim()) return
    if (tab === 'school' && !selId) { setError('Please select your school'); return }
    setLoading(true); setError('')
    try {
      const body = tab === 'admin'
        ? { type: 'admin', password: pw }
        : { type: 'school', schoolId: Number(selId), password: pw }
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await res.json()
      if (res.ok) router.push('/tracker')
      else setError(d.error || 'Invalid credentials')
    } catch { setError('Connection error. Please try again.') }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🏫</div>
        <h1 className="login-title serif">Welcome back</h1>
        <p className="login-sub">Mawanella Education Zone · 2026</p>

        <div className="login-tabs">
          <button className={`login-tab ${tab==='school'?'active':''}`} onClick={() => { setTab('school'); setError(''); setPw('') }}>🏫 School</button>
          <button className={`login-tab ${tab==='admin' ?'active':''}`} onClick={() => { setTab('admin');  setError(''); setPw('') }}>🔐 Admin</button>
        </div>

        <form className="login-form" onSubmit={submit}>
          {tab === 'school' && (
            <div>
              <label className="input-label">Your School</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type="text" autoComplete="off"
                  placeholder="Search by name or area..."
                  value={selSchool ? selSchool.name : q}
                  onChange={e => { setQ(e.target.value); setSelId(''); setShowDrop(true) }}
                  onFocus={() => setShowDrop(true)}
                  onBlur={() => setTimeout(() => setShowDrop(false), 180)}
                />
                {selSchool && (
                  <button type="button" onClick={() => { setSelId(''); setQ('') }}
                    style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 15, lineHeight: 1 }}>✕</button>
                )}
                {showDrop && !selSchool && (
                  <div className="school-dropdown">
                    {filtered.length === 0
                      ? <div className="dropdown-empty">No schools found</div>
                      : filtered.map(s => (
                          <div key={s.id} className="dropdown-item" onMouseDown={() => { setSelId(String(s.id)); setQ(''); setShowDrop(false) }}>
                            <div className="dropdown-name si">{s.name}</div>
                            <div className="dropdown-sub">{s.address_en} · Type {s.type || 'N/A'}</div>
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
              {selSchool && <div className="selected-badge">✓ {selSchool.name} — {selSchool.address_en}</div>}
            </div>
          )}

          <div>
            <label className="input-label">{tab === 'admin' ? 'Admin Password' : 'School Password'}</label>
            <div className="input-wrap">
              <input className="input" type={showPw ? 'text' : 'password'} placeholder="Enter password..."
                value={pw} onChange={e => { setPw(e.target.value); setError('') }} autoFocus={tab === 'admin'} />
              <button type="button" className="eye-btn" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {error && <div className="error-msg">⚠ {error}</div>}

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 12, marginTop: 4 }}
            disabled={loading || !pw.trim() || (tab === 'school' && !selId)}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', fontWeight: 500 }}>← Back to Home</Link>
        </div>
      </div>

      <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 20 }}>© 2026 Mawanella Education Zone</p>
    </div>
  )
}
