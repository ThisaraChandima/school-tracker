'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

/* ── Count-up animation ── */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current && target > 0) {
        started.current = true
        const t0 = performance.now()
        const tick = (now) => {
          const p = Math.min((now - t0) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setCount(Math.round(ease * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return [count, ref]
}

function Num({ value }) {
  const [n, ref] = useCountUp(Number(value) || 0)
  return <span ref={ref}>{n}</span>
}

/* ── Marquee row ── */
function Marquee({ items, reverse = false, speed = 40 }) {
  const doubled = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)' }}>
      <div style={{ display: 'flex', gap: 10, width: 'max-content', animation: `${reverse ? 'marqueeR' : 'marquee'} ${speed}s linear infinite` }}>
        {doubled.map((s, i) => (
          <span key={i} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 100, padding: '6px 15px', whiteSpace: 'nowrap',
            fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500,
          }}>
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Scroll reveal ── */
function Reveal({ children, delay = 0, y = 20 }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity .65s ease ${delay}s, transform .65s cubic-bezier(.22,1,.36,1) ${delay}s`,
    }}>
      {children}
    </div>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    setTimeout(() => setVis(true), 100)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pct = stats ? Math.round((stats.done / (stats.total || 1)) * 100) : 0
  const schoolRows = [SCHOOLS.slice(0, 45), SCHOOLS.slice(45, 90), SCHOOLS.slice(90)]

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#111', fontFamily: "'Figtree',sans-serif" }}>
      <style>{`
        @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeR { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .hover-lift { transition: transform .25s ease, box-shadow .25s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.10); }
        .feature-icon { animation: float 5s ease-in-out infinite; }
        .feature-card:nth-child(2) .feature-icon { animation-delay: -1.5s; }
        .feature-card:nth-child(3) .feature-icon { animation-delay: -3s; }
        .feature-card:nth-child(4) .feature-icon { animation-delay: -0.8s; }
        .feature-card:nth-child(5) .feature-icon { animation-delay: -2.5s; }
        .feature-card:nth-child(6) .feature-icon { animation-delay: -4s; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🏫</div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>School Tracker</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/tracker" style={{ padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, color: '#444', textDecoration: 'none', transition: 'background .2s' }}
            onMouseEnter={e => e.target.style.background='#f5f5f5'}
            onMouseLeave={e => e.target.style.background='transparent'}>
            View Issues
          </Link>
          <Link href="/login" style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: '#111', color: '#fff', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: '#0a0a0f', position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
        {/* Subtle radial glow */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '60%', background: 'radial-gradient(ellipse,rgba(0,100,200,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '100px 24px 72px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100,
            padding: '6px 16px', marginBottom: 28,
            fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.05em',
            opacity: vis ? 1 : 0, transition: 'all 0.6s ease 0.05s',
            transform: vis ? 'translateY(0)' : 'translateY(10px)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0 }} />
            Mawanella Education Zone · 2026
          </div>

          {/* Headline — plain text, no gradient fill issues */}
          <h1 style={{
            fontFamily: 'Syne,sans-serif',
            fontSize: 'clamp(38px,7vw,78px)',
            fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05,
            color: '#fff', margin: '0 0 20px',
            opacity: vis ? 1 : 0, transition: 'all 0.7s ease 0.15s',
            transform: vis ? 'translateY(0)' : 'translateY(18px)',
          }}>
            Track Issues.<br />
            <span style={{ color: '#3b82f6' }}>Drive Change.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.7, maxWidth: 480, margin: '0 auto 40px',
            opacity: vis ? 1 : 0, transition: 'all 0.7s ease 0.25s',
            transform: vis ? 'translateY(0)' : 'translateY(14px)',
          }}>
            A unified platform to monitor and resolve infrastructure issues
            across all 134 schools in real time.
          </p>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap',
            opacity: vis ? 1 : 0, transition: 'all 0.7s ease 0.35s',
            transform: vis ? 'translateY(0)' : 'translateY(12px)',
          }}>
            <Link href="/tracker" style={{ padding: '12px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, background: '#3b82f6', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity .2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              Browse Issues →
            </Link>
            <Link href="/login" style={{ padding: '12px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}>
              Admin Login
            </Link>
          </div>

          {/* Stats strip */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginTop: 64,
            borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 32,
            opacity: vis ? 1 : 0, transition: 'all 0.7s ease 0.45s',
          }}>
            {[
              { label: 'Schools',       value: 134,           color: '#fff' },
              { label: 'Issues Logged', value: stats?.total ?? 0, color: '#60a5fa' },
              { label: 'Open',          value: stats?.open ?? 0,  color: '#f87171' },
              { label: 'Resolved',      value: stats?.done ?? 0,  color: '#4ade80' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 12px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.04em' }}>
                  <Num value={s.value} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School marquees */}
        <div style={{ paddingBottom: 52, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
          <Marquee items={schoolRows[0]} speed={50} />
          <Marquee items={schoolRows[1]} speed={42} reverse />
          <Marquee items={schoolRows[2]} speed={55} />
        </div>
      </section>

      {/* ── PROGRESS ── */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <Reveal>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>Live Stats</p>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 40 }}>Zone-wide Progress</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="hover-lift" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '28px 32px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>Overall completion</p>
                <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 44, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, color: '#111' }}>
                  {stats ? `${pct}%` : '—'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Issues resolved</p>
                <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 700, color: '#16a34a' }}>
                  {stats?.done ?? '—'} <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>/ {stats?.total ?? '—'}</span>
                </p>
              </div>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 100, height: 8, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{
                height: '100%', borderRadius: 100, width: `${pct}%`,
                background: 'linear-gradient(90deg,#3b82f6,#22c55e)',
                transition: 'width 1.4s cubic-bezier(.4,0,.2,1)',
                backgroundSize: '200% 100%', animation: 'shimmer 3s infinite',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { dot: '#3b82f6', text: `${stats?.open ?? 0} issues open` },
                { dot: '#22c55e', text: `${stats?.done ?? 0} resolved` },
                { dot: '#f59e0b', text: `${stats?.schoolsAllDone ?? 0} schools fully cleared` },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.dot, flexShrink: 0 }} />
                  {l.text}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          {[
            { icon: '🏫', label: 'Total Schools',      value: 134,               col: '' },
            { icon: '📋', label: 'Issues Logged',       value: stats?.total ?? 0,  col: '#2563eb' },
            { icon: '⚠️', label: 'Open Issues',         value: stats?.open ?? 0,   col: '#dc2626' },
            { icon: '✅', label: 'Resolved',            value: stats?.done ?? 0,   col: '#16a34a' },
            { icon: '🏛️', label: 'Schools Tracked',     value: stats?.schoolsWithIssues ?? 0, col: '' },
            { icon: '🌟', label: 'Fully Cleared',       value: stats?.schoolsAllDone ?? 0,    col: '#d97706' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="hover-lift" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: s.col || '#111', marginBottom: 4 }}>
                  <Num value={s.value} />
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.02em' }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: '#f9fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>Features</p>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 40 }}>Everything you need</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
            {[
              { icon: '🔍', title: 'Smart Search',      desc: 'Find schools by name or area in English and Sinhala. Works with type, medium, and census ID too.' },
              { icon: '📝', title: 'Issue Logging',     desc: 'Document teacher shortages, missing labs, computers, and facilities with optional photo evidence.' },
              { icon: '✅', title: 'Track Resolutions', desc: 'Mark issues resolved, reopen if needed. Full history with dates for every change.' },
              { icon: '📊', title: 'Live Dashboard',    desc: 'Real-time zone-wide stats update as issues are logged and resolved.' },
              { icon: '🔐', title: 'Role-based Access', desc: 'Admin manages all 134 schools. Individual schools log in to manage only their own issues.' },
              { icon: '📱', title: 'Works Everywhere',  desc: 'Fully responsive design — optimised for phones, tablets, and desktops.' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="feature-card hover-lift" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '24px' }}>
                  <div className="feature-icon" style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                  <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', marginBottom: 7 }}>{f.title}</h3>
                  <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '72px 24px' }}>
        <Reveal>
          <div style={{
            maxWidth: 700, margin: '0 auto', textAlign: 'center',
            background: '#0a0a0f', borderRadius: 28, padding: 'clamp(40px,6vw,64px) 32px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '80%', background: 'radial-gradient(ellipse,rgba(59,130,246,0.15),transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Get Started</p>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(26px,4.5vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: 14, lineHeight: 1.1 }}>
                Ready to improve your schools?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.65 }}>
                Sign in as admin to start tracking and resolving issues across all 134 schools in the zone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" style={{ padding: '12px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, background: '#3b82f6', color: '#fff', textDecoration: 'none' }}>
                  Admin Sign In →
                </Link>
                <Link href="/tracker" style={{ padding: '12px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
                  Public Tracker
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0a0f', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>© 2026 Mawanella Education Zone · School Issue Tracker</p>
      </footer>
    </div>
  )
}
