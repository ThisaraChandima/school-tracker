'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const pct = stats ? Math.round((stats.done / (stats.total || 1)) * 100) : 0

  return (
    <div className="home-page">
      {/* NAV */}
      <nav className="nav">
        <a href="/" className="nav-brand">
          <div className="nav-emblem">🏫</div>
          <div>
            <div className="nav-title">School Tracker</div>
            <div className="nav-subtitle si">මාවනැල්ල අධ්‍යාපන කලාපය</div>
          </div>
        </a>
        <div className="nav-actions">
          <Link href="/login" className="btn btn-gold btn-sm">🔐 පිවිසෙන්න</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">📋 2025 ශාලා නාමාවලිය</div>
        <h1 className="serif">School Issue Tracker</h1>
        <p className="hero-sub si">මාවනැල්ල අධ්‍යාපන කලාපයේ පාසල් ගැටළු නිරීක්ෂණ පද්ධතිය</p>
        <div className="hero-actions">
          <Link href="/login" className="btn btn-gold">🔐 පිවිසෙන්න</Link>
          <a href="#stats" className="btn btn-ghost" style={{color:'rgba(255,255,255,0.8)', borderColor:'rgba(255,255,255,0.25)'}}>
            📊 සංඛ්‍යාලේඛන
          </a>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section" id="stats">
        <h2 className="section-title serif">සමස්ත ප්‍රගතිය</h2>

        {/* Progress bar */}
        <div style={{background:'var(--white)',borderRadius:16,padding:'20px 24px',border:'1.5px solid var(--border)',marginBottom:20,boxShadow:'var(--shadow)'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontFamily:'Noto Sans Sinhala',fontSize:13,color:'var(--muted)'}}>විසඳූ ගැටළු</span>
            <span style={{fontWeight:700,color:'var(--navy)',fontSize:14}}>{loading ? '...' : `${pct}%`}</span>
          </div>
          <div style={{background:'var(--cream2)',borderRadius:20,height:10,overflow:'hidden'}}>
            <div style={{
              height:'100%', borderRadius:20, transition:'width 1s ease',
              width:`${pct}%`,
              background:'linear-gradient(90deg, #15803d, #22c55e)'
            }}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
            <span style={{fontSize:12,color:'var(--muted)'}}>
              {loading ? '' : `${stats?.done || 0} / ${stats?.total || 0} ගැටළු`}
            </span>
            <span style={{fontSize:12,color:'var(--muted)',fontFamily:'Noto Sans Sinhala'}}>
              {loading ? '' : `${stats?.schoolsAllDone || 0} පාසල් සම්පූර්ණයි`}
            </span>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { icon:'🏫', num: 134, label:'මුළු පාසල් ගණන', color:'' },
            { icon:'📋', num: loading ? '...' : stats?.total ?? 0, label:'මුළු ගැටළු ගණන', color:'gold' },
            { icon:'⚠️', num: loading ? '...' : stats?.open ?? 0, label:'විසඳීමට ඇති', color:'red' },
            { icon:'✅', num: loading ? '...' : stats?.done ?? 0, label:'විසඳූ ගැටළු', color:'green' },
            { icon:'🏛️', num: loading ? '...' : stats?.schoolsWithIssues ?? 0, label:'ගැටළු ඇති පාසල්', color:'' },
            { icon:'🌟', num: loading ? '...' : stats?.schoolsAllDone ?? 0, label:'සම්පූර්ණ පාසල්', color:'green' },
          ].map((s,i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className={`stat-num ${s.color}`}>{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <h2 className="section-title serif">මෙම පද්ධතිය මගින්</h2>
        <div className="features-grid">
          {[
            { icon:'🔍', title:'පාසල් සෙවීම', desc:'ඕනෑම පාසලක් ඉක්මනින් සොයා ගෙන එහි ගැටළු බලන්න' },
            { icon:'📝', title:'ගැටළු ලේඛනය', desc:'ගුරු හිඟය, විද්‍යාගාර, පුස්තකාල, පරිගණක ගැටළු ලේඛනගත කරන්න' },
            { icon:'✅', title:'විසඳීම සටහන් කිරීම', desc:'ගැටළු විසඳූ විට "Done" ලෙස සලකුණු කරන්න' },
            { icon:'📊', title:'ප්‍රගති නිරීක්ෂණය', desc:'සමස්ත කලාපයේ ප්‍රගතිය තත්‍ය කාලයෙන් නිරීක්ෂණය කරන්න' },
            { icon:'🔐', title:'ආරක්ෂිත ප්‍රවේශය', desc:'මුරපද ආරක්ෂාව සහිත ව්‍යවස්ථාපිත ප්‍රවේශය' },
            { icon:'📱', title:'ජංගම හා PC', desc:'ජංගම දුරකථනය හෝ පරිගණකය ඕනෑම උපකරණයකින් භාවිත කරන්න' },
          ].map((f,i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 මාවනැල්ල අධ්‍යාපන කලාප කාර්යාලය — School Issue Tracker</p>
      </footer>
    </div>
  )
}
