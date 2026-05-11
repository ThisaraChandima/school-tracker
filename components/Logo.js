import Image from 'next/image'

export function LogoMark({ size = 34, rounded = 8 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: rounded,
      overflow: 'hidden', flexShrink: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Image src="/logo.png" alt="Mawanella Zone Logo" width={size} height={size}
        style={{ objectFit: 'cover', width: size, height: size }} priority />
    </div>
  )
}
