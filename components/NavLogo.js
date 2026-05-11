// Use this in any nav/topbar to show the zone logo
// Usage: <NavLogo size={34} />
import Image from 'next/image'

export function NavLogo({ size = 34 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.24), overflow: 'hidden', flexShrink: 0 }}>
      <Image src="/logo.png" alt="Mawanella Zone" width={size} height={size} style={{ objectFit: 'cover' }} priority />
    </div>
  )
}

export function TopbarEmblem({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
      <Image src="/logo.png" alt="Logo" width={size} height={size} style={{ objectFit: 'cover' }} />
    </div>
  )
}
