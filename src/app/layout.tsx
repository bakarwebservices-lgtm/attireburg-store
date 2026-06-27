import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Attireburg - Premium German Clothing',
  description: 'Premium deutsche Kleidung für höchste Ansprüche. Zeitloses Design trifft auf erstklassige Qualität.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        {/* Google Pay API */}
        <script src="https://pay.google.com/gp/p/js/pay.js" async></script>
        {/* Google Identity Services for Google Auth */}
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
          <CookieConsent />
        </ClientLayout>
      </body>
    </html>
  )
}