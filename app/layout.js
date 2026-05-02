import './globals.css'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Plus_Jakarta_Sans, Noto_Sans_Sinhala } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})

const sinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sinhala',
})

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
    <html lang="en" className={`${jakarta.variable} ${sinhala.variable}`}>
      <body>{children}<SpeedInsights /></body>
    </html>
  )
}
