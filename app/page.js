'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function CountUp({ target, duration = 1600 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current && target > 0) {
        started.current = true
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 4)
          setCount(Math.round(ease * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count}</span>
}

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {})
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pct = stats ? Math.round((stats.done / (stats.total || 1)) * 100) : 0

  return (
    <div className="home-page">
      {/* NAV */}
      <nav className="nav" style={scrolled ? {boxShadow:'0 1px 20px rgba(0,0,0,0.06)'} : {}}>
        <a href="/" className="nav-brand">
          <div className="nav-emblem">🏫</div>
          <div>
            <div className="nav-title display">School Tracker</div>
          </div>
        </a>
        <div className="nav-actions">
          <Link href="/tracker" className="btn btn-ghost btn-sm">View Issues</Link>
          <Link href="/login" className="btn btn-primary btn-sm">Sign In</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span>🏛️</span> Mawanella Education Zone · 2026
          </div>
          <h1 className="display">
            Track. Resolve.<br />
            <span className="accent">Improve.</span>
          </h1>
          <p className="hero-sub">
            A modern platform to monitor and resolve infrastructure issues
            across all 134 schools in the Mawanella education zone.
          </p>
          <div className="hero-actions">
            <Link href="/tracker" className="btn btn-blue" style={{padding:'13px 28px',fontSize:16}}>
              View All Issues →
            </Link>
            <Link href="/login" className="btn btn-glass" style={{padding:'13px 28px',fontSize:16}}>
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section" id="stats">
        <p className="section-eyebrow">Live Statistics</p>
        <h2 className="section-title display">Zone-wide Progress</h2>

        {/* Progress bar */}
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">Issues Resolved</span>
            <span className="progress-pct display">{stats ? `${pct}%` : '—'}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{width:`${pct}%`}} />
          </div>
          <div className="progress-footer">
            <span className="progress-stat">{stats ? `${stats.done} of ${stats.total} issues resolved` : 'Loading...'}</span>
            <span className="progress-stat">{stats ? `${stats.schoolsAllDone} schools fully cleared` : ''}</span>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { icon:'🏫', num: 134,                        label:'Total Schools',          color:'' },
            { icon:'📋', num: stats?.total ?? 0,           label:'Total Issues Logged',    color:'blue' },
            { icon:'⚠️', num: stats?.open ?? 0,            label:'Open Issues',            color:'red' },
            { icon:'✅', num: stats?.done ?? 0,            label:'Resolved Issues',        color:'green' },
            { icon:'🏛️', num: stats?.schoolsWithIssues??0, label:'Schools with Issues',    color:'' },
            { icon:'🌟', num: stats?.schoolsAllDone ?? 0,  label:'Fully Cleared Schools',  color:'gold' },
          ].map((s,i) => (
            <div key={i} className="stat-card" style={{animationDelay:`${i*0.07}s`}}>
              <span className="stat-icon">{s.icon}</span>
              <div className={`stat-num ${s.color}`}>
                {stats ? <CountUp target={Number(s.num)} duration={1200 + i*100} /> : '—'}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <p className="section-eyebrow">What We Offer</p>
        <h2 className="section-title display">Built for Education</h2>
        <div className="features-grid">
          {[
            { icon:'🔍', title:'Smart Search',        desc:'Find any school instantly by name, area, or school type in both English and Sinhala.' },
            { icon:'📝', title:'Issue Logging',       desc:'Document teacher shortages, labs, libraries, computers, and facility issues with optional photos.' },
            { icon:'✅', title:'Resolve & Track',     desc:'Mark issues as resolved and track your progress in real time across the entire zone.' },
            { icon:'📊', title:'Live Dashboard',      desc:'Zone-wide progress stats update automatically as issues are logged and resolved.' },
            { icon:'🔐', title:'Role-based Access',   desc:'Admin controls the system. Individual schools can log in to manage their own issues.' },
            { icon:'📱', title:'Works Everywhere',    desc:'Fully responsive — works beautifully on phones, tablets, and desktop computers.' },
          ].map((f,i) => (
            <div key={i} className="feature-card" style={{animationDelay:`${i*0.08}s`}}>
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title display">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'20px 24px 80px',textAlign:'center'}}>
        <div style={{
          background:'linear-gradient(135deg,#0a0a0a,#1a1a2e)',
          borderRadius:32,padding:'56px 32px',maxWidth:700,margin:'0 auto',
          position:'relative',overflow:'hidden'
        }}>
          <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,113,227,0.3),transparent 70%)',pointerEvents:'none'}}/>
          <h2 className="display" style={{color:'#fff',fontSize:'clamp(24px,4vw,36px)',fontWeight:800,letterSpacing:'-0.03em',marginBottom:12}}>
            Ready to get started?
          </h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:15,marginBottom:32,maxWidth:400,margin:'0 auto 32px'}}>
            Sign in as admin to manage school access, log issues, and track resolutions.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/login" className="btn btn-blue" style={{padding:'13px 28px',fontSize:16}}>Get Started →</Link>
            <Link href="/tracker" className="btn btn-glass" style={{padding:'13px 28px',fontSize:16}}>Browse Issues</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 Mawanella Education Zone · School Issue Tracker</p>
      </footer>
    </div>
  )
}
