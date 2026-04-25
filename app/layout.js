import { Noto_Sans_Sinhala, DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-serif' })
const sinhala = Noto_Sans_Sinhala({ subsets: ['sinhala'], weight: ['400','500','600','700'], variable: '--font-si' })

export const metadata = {
  title: 'School Issue Tracker — මාවනැල්ල 2025',
  description: 'Mawanella Education Zone School Issue Tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="si">
      <body className={`${dmSans.variable} ${dmSerif.variable} ${sinhala.variable}`}>
        {children}
      </body>
    </html>
  )
}
