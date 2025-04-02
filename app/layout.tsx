import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Devtecia',
  description: 'Devtecia',
  generator: 'Devtecia',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
