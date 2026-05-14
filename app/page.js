'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SCHOOLS from '@/lib/schools'

function useCountUp(target, duration = 1200) {
  const [n, setN] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current && target > 0) {
        started.current = true
        const t0 = performance.now()
        const tick = now => {
          const p = Math.min((now - t0) / duration, 1)
          setN(Math.round((1 - Math.pow(1 - p, 3)) * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return [n, ref]
}

function Num({ value }) {
  const [n, ref] = useCountUp(Number(value) || 0)
  return <span ref={ref}>{n.toLocaleString()}</span>
}

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.08 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(18px)', transition: `opacity .6s ease ${delay}s, transform .6s cubic-bezier(.22,1,.36,1) ${delay}s` }}>
      {children}
    </div>
  )
}

function Marquee({ items, reverse = false, speed = 44 }) {
  const d = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)' }}>
      <div style={{ display: 'flex', gap: 8, width: 'max-content', animation: `${reverse ? 'marqueeR' : 'marquee'} ${speed}s linear infinite` }}>
        {d.map((s, i) => (
          <span key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 100, padding: '5px 14px', whiteSpace: 'nowrap', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    fetch('/api/stats', { cache: 'no-store' }).then(r => r.json()).then(setStats).catch(() => {})
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    setTimeout(() => setVis(true), 80)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pct = stats ? Math.round((stats.done / (stats.total || 1)) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#111827' }}>
      <style>{`
        @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeR { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .card-hover { transition: transform .22s ease, box-shadow .22s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.09); }
        .feat-icon { animation: float 5s ease-in-out infinite; display: block; }
        .feat:nth-child(2) .feat-icon { animation-delay:-1.5s }
        .feat:nth-child(3) .feat-icon { animation-delay:-3s }
        .feat:nth-child(4) .feat-icon { animation-delay:-.8s }
        .feat:nth-child(5) .feat-icon { animation-delay:-2.5s }
        .feat:nth-child(6) .feat-icon { animation-delay:-4s }
        a.nav-link { padding:7px 14px; border-radius:7px; font-size:14px; font-weight:600; color:#374151; text-decoration:none; transition:background .18s; }
        a.nav-link:hover { background:#f3f4f6; }
      `}</style>

       {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, background: scrolled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1.5px solid #e5e7eb', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'box-shadow .25s', boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.06)' : 'none' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width:34, height:34, borderRadius:8, overflow:'hidden', flexShrink:0 }}><Image src="/logo.png" alt="Logo" width={34} height={34} style={{ objectFit:'cover' }} priority /></div>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>School Tracker</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/tracker" className="nav-link">View Issues</Link>
          <Link 
            href="/login" 
            style={{ 
              padding: '8px 18px', 
              borderRadius: 8, 
              fontSize: 14, 
              fontWeight: 700, 
              background: '#0f1f3d', 
              color: '#fff', 
              textDecoration: 'none', 
              transition: 'opacity .18s',
              whiteSpace: 'nowrap', // Prevents "Sign In" from breaking into two lines
              flexShrink: 0 // Prevents the button from squeezing on tiny screens
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: '#0f1f3d', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 60% 30%, rgba(26,86,219,0.2), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px 64px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Logo mark in hero */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)', transition: 'all .6s ease' }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <Image src="/logo.png" alt="Mawanella Zone" width={72} height={72} style={{ objectFit: 'cover' }} priority />
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.13)', borderRadius: 100, padding: '6px 16px', marginBottom: 28, fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.05em', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)', transition: 'all .6s ease .05s' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0 }} />
            Mawanella Education Zone · 2026
          </div>
          <h1 style={{ fontSize: 'clamp(36px,6.5vw,70px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.06, color: '#fff', margin: '0 0 18px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)', transition: 'all .65s ease .15s' }}>
            Track Issues.<br /><span style={{ color: '#60a5fa' }}>Drive Change.</span>
          </h1>
          <p style={{ fontSize: 'clamp(14px,1.8vw,18px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 36px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(12px)', transition: 'all .65s ease .25s' }}>
            A unified platform to monitor and resolve infrastructure issues across all 134 schools in real time.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)', transition: 'all .65s ease .35s' }}>
            <Link href="/tracker" style={{ padding: '12px 26px', borderRadius: 9, fontSize: 15, fontWeight: 700, background: '#1a56db', color: '#fff', textDecoration: 'none' }}>Browse Issues →</Link>
            <Link href="/login" style={{ padding: '12px 26px', borderRadius: 9, fontSize: 15, fontWeight: 700, background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.14)' }}>Admin Login</Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', opacity: vis ? 1 : 0, transition: 'all .65s ease .45s' }}>
            {[{ label:'Schools',value:134,color:'#fff'},{label:'Issues Logged',value:stats?.total??0,color:'#93c5fd'},{label:'Open',value:stats?.open??0,color:'#fca5a5'},{label:'Resolved',value:stats?.done??0,color:'#86efac'}].map((s,i)=>(
              <div key={i} style={{ flex:'1 0 80px', textAlign:'center', padding:'0 16px', borderRight:i<3?'1px solid rgba(255,255,255,0.07)':'none' }}>
                <div style={{ fontSize:'clamp(26px,3.5vw,38px)', fontWeight:800, color:s.color, lineHeight:1, letterSpacing:'-0.04em' }}><Num value={s.value} /></div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:7, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
          <Marquee items={SCHOOLS.slice(0,45)} speed={50} />
          <Marquee items={SCHOOLS.slice(45,90)} speed={40} reverse />
          <Marquee items={SCHOOLS.slice(90)} speed={55} />
        </div>
      </section>

      {/* PROGRESS */}
      <section style={{ padding: '72px 24px', maxWidth: 880, margin: '0 auto' }}>
        <Reveal>
          <p style={{ fontSize:12,fontWeight:700,color:'#1a56db',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:8,textAlign:'center' }}>Live Statistics</p>
          <h2 style={{ fontSize:'clamp(22px,3.2vw,34px)',fontWeight:800,letterSpacing:'-0.03em',textAlign:'center',marginBottom:36,color:'#111827' }}>Zone-wide Progress</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="card-hover" style={{ background:'#fff',border:'1.5px solid #e5e7eb',borderRadius:18,padding:'26px 30px',marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10 }}>
              <div>
                <p style={{ fontSize:13,color:'#6b7280',marginBottom:4,fontWeight:500 }}>Overall completion</p>
                <p style={{ fontSize:42,fontWeight:800,letterSpacing:'-0.05em',lineHeight:1,color:'#111827' }}>{stats?`${pct}%`:'—'}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:12,color:'#6b7280',marginBottom:4,fontWeight:500 }}>Resolved</p>
                <p style={{ fontSize:22,fontWeight:800,color:'#16a34a',letterSpacing:'-0.03em' }}>
                  {stats?.done??'—'} <span style={{ fontSize:13,color:'#9ca3af',fontWeight:500 }}>/ {stats?.total??'—'}</span>
                </p>
              </div>
            </div>
            <div style={{ background:'#f3f4f6',borderRadius:100,height:8,overflow:'hidden',marginBottom:14 }}>
              <div style={{ height:'100%',borderRadius:100,width:`${pct}%`,background:'linear-gradient(90deg,#1a56db,#16a34a)',transition:'width 1.3s cubic-bezier(.4,0,.2,1)',backgroundSize:'200% 100%',animation:'shimmer 3s linear infinite' }} />
            </div>
            <div style={{ display:'flex',gap:18,flexWrap:'wrap' }}>
              {[{dot:'#1a56db',t:`${stats?.open??0} open`},{dot:'#16a34a',t:`${stats?.done??0} resolved`},{dot:'#f59e0b',t:`${stats?.schoolsAllDone??0} schools fully cleared`}].map((l,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#6b7280',fontWeight:500 }}>
                  <div style={{ width:7,height:7,borderRadius:'50%',background:l.dot }} />{l.t}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10 }}>
          {[{icon:'🏫',label:'Total Schools',value:134,color:''},{icon:'📋',label:'Issues Logged',value:stats?.total??0,color:'#1a56db'},{icon:'⚠️',label:'Open Issues',value:stats?.open??0,color:'#dc2626'},{icon:'✅',label:'Resolved',value:stats?.done??0,color:'#16a34a'},{icon:'🏛️',label:'Schools Tracked',value:stats?.schoolsWithIssues??0,color:''},{icon:'🌟',label:'Fully Cleared',value:stats?.schoolsAllDone??0,color:'#d97706'}].map((s,i)=>(
            <Reveal key={i} delay={i*0.05}>
              <div className="card-hover" style={{ background:'#fff',border:'1.5px solid #e5e7eb',borderRadius:14,padding:'18px 14px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:22,marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:24,fontWeight:800,letterSpacing:'-0.03em',color:s.color||'#111827',marginBottom:4 }}><Num value={s.value} /></div>
                <div style={{ fontSize:11,color:'#9ca3af',fontWeight:600,letterSpacing:'0.02em' }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background:'#fff',padding:'64px 24px',borderTop:'1.5px solid #e5e7eb',borderBottom:'1.5px solid #e5e7eb' }}>
        <div style={{ maxWidth:880,margin:'0 auto' }}>
          <Reveal>
            <p style={{ fontSize:12,fontWeight:700,color:'#1a56db',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:8,textAlign:'center' }}>Platform Features</p>
            <h2 style={{ fontSize:'clamp(22px,3.2vw,34px)',fontWeight:800,letterSpacing:'-0.03em',textAlign:'center',marginBottom:36 }}>Everything you need</h2>
          </Reveal>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14 }}>
            {[{icon:'🔍',title:'Smart Search',desc:'Find schools instantly by name or area in English and Sinhala.'},{icon:'📝',title:'Issue Logging',desc:'Document teacher shortages, missing labs, computers, and facilities with optional photo evidence.'},{icon:'✅',title:'Track Resolutions',desc:'Mark issues resolved, reopen if needed. Full date history for every change.'},{icon:'📊',title:'Live Dashboard',desc:'Real-time zone-wide stats update as issues are logged and resolved.'},{icon:'🔐',title:'Role-based Access',desc:'Admin manages everything. Individual schools log in to manage only their own issues.'},{icon:'📱',title:'Works Everywhere',desc:'Fully responsive — optimised for phones, tablets, and desktop computers.'}].map((f,i)=>(
              <Reveal key={i} delay={i*0.06}>
                <div className="feat card-hover" style={{ background:'#f7f8fa',border:'1.5px solid #e5e7eb',borderRadius:16,padding:'22px' }}>
                  <span className="feat-icon" style={{ fontSize:26,marginBottom:12 }}>{f.icon}</span>
                  <h3 style={{ fontSize:15,fontWeight:700,letterSpacing:'-0.02em',color:'#111827',marginBottom:7 }}>{f.title}</h3>
                  <p style={{ fontSize:13,color:'#6b7280',lineHeight:1.65 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'72px 24px' }}>
        <Reveal>
          <div style={{ maxWidth:680,margin:'0 auto',textAlign:'center',background:'#0f1f3d',borderRadius:24,padding:'clamp(40px,5vw,60px) 32px',position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',top:'-30%',left:'50%',transform:'translateX(-50%)',width:'80%',height:'80%',background:'radial-gradient(ellipse,rgba(26,86,219,0.18),transparent 65%)',pointerEvents:'none' }} />
            <div style={{ position:'relative',zIndex:1 }}>
              <div style={{ display:'flex',justifyContent:'center',marginBottom:20 }}>
                <div style={{ width:56,height:56,borderRadius:14,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
                  <Image src="/logo.png" alt="Logo" width={56} height={56} style={{ objectFit:'cover' }} />
                </div>
              </div>
              <p style={{ fontSize:12,fontWeight:700,color:'#60a5fa',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:10 }}>Get Started</p>
              <h2 style={{ fontSize:'clamp(24px,4vw,40px)',fontWeight:800,letterSpacing:'-0.04em',color:'#fff',marginBottom:14,lineHeight:1.12 }}>Ready to improve your schools?</h2>
              <p style={{ color:'rgba(255,255,255,0.4)',fontSize:15,marginBottom:30,maxWidth:380,margin:'0 auto 30px',lineHeight:1.65 }}>Sign in as admin to track and resolve issues across all 134 schools.</p>
              <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
                <Link href="/login" style={{ padding:'12px 26px',borderRadius:9,fontSize:15,fontWeight:700,background:'#1a56db',color:'#fff',textDecoration:'none' }}>Admin Sign In →</Link>
                <Link href="/tracker" style={{ padding:'12px 26px',borderRadius:9,fontSize:15,fontWeight:700,background:'rgba(255,255,255,0.08)',color:'#fff',textDecoration:'none',border:'1.5px solid rgba(255,255,255,0.14)' }}>Public Tracker</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer style={{ background:'#0f1f3d',padding:'24px',textAlign:'center' }}>
        <p style={{ fontSize:13,color:'rgba(255,255,255,0.25)' }}>© 2026 Mawanella Education Zone · School Issue Tracker</p>
      </footer>
    </div>
  )
}
