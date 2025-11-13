import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DeLorean Machine - Sistema de Controle de Horas',
  description: 'Sistema de controle de horas para freelancers e times',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
