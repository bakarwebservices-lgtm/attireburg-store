import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Attireburg - Premium German Clothing',
  description: 'Premium deutsche Kleidung für höchste Ansprüche. Zeitloses Design trifft auf erstklassige Qualität.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}