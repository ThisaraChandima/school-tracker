import './globals.css'

export const metadata = {
  title: 'School Issue Tracker — Mawanella Zone 2026',
  description: 'Mawanella Education Zone School Issue Tracker',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
