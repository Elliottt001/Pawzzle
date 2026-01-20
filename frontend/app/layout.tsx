import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pawzzle',
  description: 'Logic Decoupled, Physical Monolith for Pet Adoption',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
