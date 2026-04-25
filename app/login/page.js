'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/tracker')
      } else {
        const d = await res.json()
        setError(d.error || 'වැරදි මුරපදය')
      }
    } catch {
      setError('සේවාදායකය සමඟ සම්බන්ධ විය නොහැක')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-emblem">🏫</div>
        <h1 className="login-title serif">School Tracker</h1>
        <p className="login-sub">මාවනැල්ල අධ්‍යාපන කලාපය</p>

        <form className="login-form" onSubmit={handleLogin}>
          <div>
            <label className="input-label">🔐 මුරපදය</label>
            <div className="input-wrap">
              <input
                className="input"
                type={show ? 'text' : 'password'}
                placeholder="මුරපදය ඇතුළු කරන්න..."
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoFocus
              />
              <button type="button" className="eye-btn" onClick={() => setShow(!show)}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-msg">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{width:'100%', padding:'12px', fontSize:'15px', marginTop:4}}
            disabled={loading || !password.trim()}
          >
            {loading ? '⏳ පිවිසෙමින්...' : '🔓 පිවිසෙන්න'}
          </button>
        </form>

        <div style={{textAlign:'center', marginTop:20}}>
          <Link href="/" style={{fontSize:13, color:'var(--muted)', textDecoration:'none'}}>
            ← මුල් පිටුවට
          </Link>
        </div>
      </div>

      <p style={{color:'rgba(255,255,255,0.3)', fontSize:12, marginTop:20, textAlign:'center'}}>
        © 2025 මාවනැල්ල අධ්‍යාපන කලාප කාර්යාලය
      </p>
    </div>
  )
}
