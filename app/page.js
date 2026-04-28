'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SCHOOLS from '@/lib/schools'

/* ── Count-up hook ── */
function useCountUp(target, duration = 1400) {
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
          const ease = 1 - Math.pow(1 - p, 4)
          setCount(Math.round(ease * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return [count, ref]
}

function StatNum({ target, suffix = '' }) {
  const [n, ref] = useCountUp(target)
  return <span ref={ref}>{n}{suffix}</span>
}

/* ── Floating particle dot ── */
function Particle({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />
}

/* ── School marquee row ── */
function SchoolMarquee({ schools, reverse = false, speed = 40 }) {
  const doubled = [...schools, ...schools]
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg,transparent,black 10%,black 90%,transparent)' }}>
      <div style={{
        display: 'flex', gap: 10, width: 'max-content',
        animation: `marquee${reverse ? 'R' : ''} ${speed}s linear infinite`,
      }}>
        {doubled.map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 980, padding: '7px 16px', whiteSpace: 'nowrap',
            fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500, backdropFilter: 'blur(6px)',
          }}>
            🏫 {s.name}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Bento card ── */
function BentoCard({ children, style = {}, className = '' }) {
  return (
    <div className={`bento-card ${className}`} style={style}>
      {children}
    </div>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {})
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    setTimeout(() => setHeroVisible(true), 80)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pct = stats ? Math.round((stats.done / (stats.total || 1)) * 100) : 0
  const row1 = SCHOOLS.slice(0, 34)
  const row2 = SCHOOLS.slice(34, 68)
  const row3 = SCHOOLS.slice(68, 102)

  return (
    <div className="home-page" style={{ overflowX: 'hidden' }}>

      {/* ── GLOBAL STYLE FOR THIS PAGE ── */}
      <style>{`
        @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeR { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes gridPulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        @keyframes heroFadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spinSlow { to{transform:rotate(360deg)} }
        @keyframes borderGlow { 0%,100%{box-shadow:0 0 0 0 rgba(0,113,227,0)} 50%{box-shadow:0 0 32px 4px rgba(0,113,227,0.18)} }
        .bento-card {
          background: var(--bg2); border-radius: 24px; border: 1px solid var(--border);
          box-shadow: var(--shadow-sm); overflow: hidden; position: relative;
          transition: transform .3s cubic-bezier(.25,.46,.45,.94), box-shadow .3s;
        }
        .bento-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .hero-grid-line { position: absolute; background: rgba(255,255,255,0.04); pointer-events: none; }
        .scroll-reveal { opacity: 0; transform: translateY(24px); transition: opacity .6s ease, transform .6s cubic-bezier(.25,.46,.45,.94); }
        .scroll-reveal.visible { opacity: 1; transform: translateY(0); }
        .glow-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav" style={scrolled ? { boxShadow: '0 1px 24px rgba(0,0,0,0.07)' } : {}}>
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

      {/* ═══════════════════════════════
          HERO
      ═══════════════════════════════ */}
      <section ref={heroRef} style={{
        position: 'relative', overflow: 'hidden', minHeight: '92vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: 'linear-gradient(170deg,#05050a 0%,#0d1220 40%,#0a1a3a 70%,#071530 100%)',
      }}>
        {/* GRID LINES */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`v${i}`} className="hero-grid-line" style={{
            left: `${(i / 11) * 100}%`, top: 0, bottom: 0, width: 1,
            animation: `gridPulse ${3 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`h${i}`} className="hero-grid-line" style={{
            top: `${(i / 7) * 100}%`, left: 0, right: 0, height: 1,
            animation: `gridPulse ${4 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}

        {/* GLOW ORBS */}
        <div className="glow-orb" style={{ width: 600, height: 600, top: -200, right: -150, background: 'radial-gradient(circle,rgba(0,113,227,0.35),transparent 65%)', animation: 'float 9s ease-in-out infinite' }} />
        <div className="glow-orb" style={{ width: 500, height: 500, bottom: -150, left: -100, background: 'radial-gradient(circle,rgba(245,166,35,0.2),transparent 65%)', animation: 'float 11s ease-in-out infinite reverse' }} />
        <div className="glow-orb" style={{ width: 300, height: 300, top: '40%', left: '30%', background: 'radial-gradient(circle,rgba(40,205,65,0.12),transparent 65%)', animation: 'float 13s ease-in-out infinite 3s' }} />

        {/* FLOATING PARTICLES */}
        {[
          { width: 5, height: 5, top: '18%', left: '12%', background: '#0071e3', opacity: 0.7, animation: 'float 6s ease-in-out infinite' },
          { width: 4, height: 4, top: '72%', left: '78%', background: '#f5a623', opacity: 0.6, animation: 'float 8s ease-in-out infinite 2s' },
          { width: 6, height: 6, top: '35%', right: '15%', background: '#28cd41', opacity: 0.5, animation: 'float 7s ease-in-out infinite 1s' },
          { width: 3, height: 3, top: '60%', left: '22%', background: '#fff', opacity: 0.3, animation: 'float 9s ease-in-out infinite 4s' },
          { width: 5, height: 5, top: '25%', right: '35%', background: '#0071e3', opacity: 0.4, animation: 'float 10s ease-in-out infinite 0.5s' },
          { width: 4, height: 4, bottom: '20%', left: '55%', background: '#f5a623', opacity: 0.5, animation: 'float 7.5s ease-in-out infinite 3s' },
        ].map((p, i) => <Particle key={i} style={p} />)}

        {/* HERO CONTENT */}
        <div style={{ position: 'relative', zIndex: 2, padding: '80px 24px 40px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,113,227,0.12)', border: '1px solid rgba(0,113,227,0.3)',
            borderRadius: 980, padding: '7px 18px', marginBottom: 28,
            fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', backdropFilter: 'blur(8px)',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.6s cubic-bezier(.25,.46,.45,.94) 0.05s',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#28cd41', display: 'inline-block', boxShadow: '0 0 8px #28cd41' }} />
            Mawanella Education Zone · 2026
          </div>

          <h1 className="display" style={{
            fontSize: 'clamp(40px,8vw,88px)', fontWeight: 800, color: '#fff',
            lineHeight: 1.02, letterSpacing: '-0.04em', marginBottom: 20,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.7s cubic-bezier(.25,.46,.45,.94) 0.15s',
          }}>
            Track Issues.<br />
            <span style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', background: 'linear-gradient(135deg,#0071e3,#34aadc,#28cd41)' }}>
              Drive Change.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px,2.2vw,20px)', color: 'rgba(255,255,255,0.5)',
            maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.65,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s cubic-bezier(.25,.46,.45,.94) 0.25s',
          }}>
            A unified platform to monitor infrastructure issues across
            all 134 schools — log, track, and resolve in real time.
          </p>

          {/* HERO BUTTONS */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.7s cubic-bezier(.25,.46,.45,.94) 0.35s',
          }}>
            <Link href="/tracker" className="btn btn-blue" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 14 }}>
              Browse Issues →
            </Link>
            <Link href="/login" className="btn btn-glass" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 14 }}>
              Sign In
            </Link>
          </div>

          {/* LIVE STATS STRIP */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 0,
            marginTop: 64, flexWrap: 'wrap',
            opacity: heroVisible ? 1 : 0,
            transition: 'all 0.7s cubic-bezier(.25,.46,.45,.94) 0.5s',
          }}>
            {[
              { label: 'Schools', value: 134, color: '#fff' },
              { label: 'Issues Logged', value: stats?.total ?? 0, color: '#34aadc' },
              { label: 'Open', value: stats?.open ?? 0, color: '#ff6b6b' },
              { label: 'Resolved', value: stats?.done ?? 0, color: '#28cd41' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '20px 32px', textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div className="display" style={{ fontSize: 36, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.04em' }}>
                  {stats || s.label === 'Schools' ? <StatNum target={Number(s.value)} /> : '—'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCHOOL NAME MARQUEES */}
        <div style={{ position: 'relative', zIndex: 2, paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SchoolMarquee schools={row1} speed={45} />
          <SchoolMarquee schools={row2} speed={38} reverse />
          <SchoolMarquee schools={row3} speed={50} />
        </div>

        {/* SCROLL INDICATOR */}
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.4, animation: 'float 2s ease-in-out infinite' }}>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.6))' }} />
          <div style={{ fontSize: 10, color: '#fff', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</div>
        </div>
      </section>

      {/* ═══════════════════════════════
          PROGRESS SECTION
      ═══════════════════════════════ */}
      <RevealSection>
        <div style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <p className="section-eyebrow">Live Progress</p>
          <h2 className="section-title display">Zone-wide Overview</h2>

          {/* BENTO GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 14 }}>

            {/* Big progress card */}
            <BentoCard style={{ gridColumn: 'span 8', padding: '32px 36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Overall Completion</p>
                  <div className="display" style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text)', lineHeight: 1 }}>
                    {stats ? <StatNum target={pct} suffix="%" /> : '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Issues resolved</div>
                  <div className="display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--green-dark)' }}>
                    {stats ? <StatNum target={stats.done} /> : '—'}
                    <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 500 }}> / {stats?.total ?? '—'}</span>
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 980, height: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{
                  height: '100%', borderRadius: 980, width: `${pct}%`,
                  background: 'linear-gradient(90deg,var(--blue),var(--green))',
                  transition: 'width 1.4s cubic-bezier(.4,0,.2,1)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)', animation: 'shimmer 2.5s infinite', backgroundSize: '200% 100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { dot: 'var(--green)', label: `${stats?.done ?? 0} Resolved` },
                  { dot: 'var(--red)', label: `${stats?.open ?? 0} Open` },
                  { dot: 'var(--blue)', label: `${stats?.schoolsWithIssues ?? 0} Schools tracked` },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.dot, flexShrink: 0 }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Cleared schools */}
            <BentoCard style={{ gridColumn: 'span 4', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--navy)' }}>
              <div style={{ fontSize: 32 }}>🌟</div>
              <div>
                <div className="display" style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8 }}>
                  {stats ? <StatNum target={stats.schoolsAllDone} /> : '—'}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Schools fully cleared</div>
              </div>
              <div style={{ width: '100%', height: 4, borderRadius: 980, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats ? (stats.schoolsAllDone / 134) * 100 : 0}%`, background: 'var(--gold)', borderRadius: 980, transition: 'width 1.2s ease' }} />
              </div>
            </BentoCard>

            {/* Stat cards row */}
            {[
              { icon: '🏫', label: 'Schools', value: 134, col: 3, color: 'var(--text)' },
              { icon: '📋', label: 'Logged', value: stats?.total ?? 0, col: 3, color: 'var(--blue)' },
              { icon: '⚠️', label: 'Open', value: stats?.open ?? 0, col: 3, color: 'var(--red)' },
              { icon: '✅', label: 'Resolved', value: stats?.done ?? 0, col: 3, color: 'var(--green-dark)' },
            ].map((s, i) => (
              <BentoCard key={i} style={{ gridColumn: `span ${s.col}`, padding: '22px' }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{s.icon}</div>
                <div className="display" style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>
                  {stats || s.label === 'Schools' ? <StatNum target={Number(s.value)} /> : '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, letterSpacing: '0.02em' }}>{s.label}</div>
              </BentoCard>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════
          FEATURE BENTO
      ═══════════════════════════════ */}
      <RevealSection delay={0.1}>
        <div style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <p className="section-eyebrow">Platform Features</p>
          <h2 className="section-title display">Everything you need</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 14 }}>

            {/* Wide feature */}
            <BentoCard style={{ gridColumn: 'span 7', padding: '36px', background: 'linear-gradient(135deg,#0a0a0a,#1a1a2e)', border: 'none' }}>
              <div style={{ fontSize: 44, marginBottom: 20 }}>🔍</div>
              <h3 className="display" style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 12 }}>
                Smart Search in English & Sinhala
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 340 }}>
                Search schools by area name, type, or census ID. Works in both English (Mawanella, Rambukkana) and Sinhala script.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
                {['Mawanella', 'Rambukkana', 'Aranayaka', '1AB', 'Primary', 'Tamil'].map(t => (
                  <span key={t} style={{ background: 'rgba(0,113,227,0.15)', border: '1px solid rgba(0,113,227,0.25)', borderRadius: 980, padding: '4px 12px', fontSize: 12, color: '#34aadc', fontWeight: 600 }}>
                    {t}
                  </span>
                ))}
              </div>
            </BentoCard>

            <BentoCard style={{ gridColumn: 'span 5', padding: '32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 40 }}>📷</div>
              <div>
                <h3 className="display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Photo Evidence</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                  Attach photos to any issue. Click to view full-size in a lightbox.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['JPG', 'PNG', 'WEBP'].map(t => (
                  <span key={t} style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{t}</span>
                ))}
              </div>
            </BentoCard>

            <BentoCard style={{ gridColumn: 'span 4', padding: '28px', background: 'var(--blue)', border: 'none' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🔐</div>
              <h3 className="display" style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Role-based Access</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                Admin manages all schools. Each school gets their own login to manage their issues.
              </p>
            </BentoCard>

            <BentoCard style={{ gridColumn: 'span 4', padding: '28px' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>📊</div>
              <h3 className="display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Live Dashboard</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                Real-time stats update as issues are logged and resolved across the zone.
              </p>
            </BentoCard>

            <BentoCard style={{ gridColumn: 'span 4', padding: '28px', background: '#f0fdf4', border: '1px solid #d1fae5' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>✅</div>
              <h3 className="display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-dark)', marginBottom: 8 }}>Track Resolution</h3>
              <p style={{ fontSize: 13, color: 'var(--green-dark)', opacity: 0.7, lineHeight: 1.6 }}>
                Mark issues resolved, reopen if needed. Full audit trail with dates.
              </p>
            </BentoCard>

            <BentoCard style={{ gridColumn: 'span 12', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ fontSize: 48 }}>📱</div>
                <div>
                  <h3 className="display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Works on every device</h3>
                  <p style={{ fontSize: 14, color: 'var(--text2)' }}>Fully responsive — phone, tablet, or desktop. Optimised for every screen.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['iPhone', 'iPad', 'MacBook', 'Windows'].map(d => (
                  <div key={d} style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text2)', textAlign: 'center' }}>
                    {d}
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════
          CTA
      ═══════════════════════════════ */}
      <RevealSection delay={0.05}>
        <div style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{
            background: 'linear-gradient(135deg,#05050a,#0d1220,#0a1a3a)',
            borderRadius: 32, padding: 'clamp(40px,6vw,72px) 40px',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            animation: 'borderGlow 4s ease-in-out infinite',
          }}>
            <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,113,227,0.2),transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,166,35,0.12),transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Get Started Today</p>
              <h2 className="display" style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>
                Ready to improve your schools?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
                Sign in as admin to start tracking and resolving issues across all 134 schools in the Mawanella zone.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" className="btn btn-blue" style={{ padding: '14px 36px', fontSize: 16, borderRadius: 14 }}>
                  Admin Sign In →
                </Link>
                <Link href="/tracker" className="btn btn-glass" style={{ padding: '14px 36px', fontSize: 16, borderRadius: 14 }}>
                  Public Tracker
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <footer className="footer">
        <p>© 2026 Mawanella Education Zone Office · School Issue Tracker</p>
      </footer>
    </div>
  )
}

/* ── Scroll reveal wrapper ── */
function RevealSection({ children, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.08 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity .7s ease ${delay}s, transform .7s cubic-bezier(.25,.46,.45,.94) ${delay}s`,
    }}>
      {children}
    </div>
  )
}
