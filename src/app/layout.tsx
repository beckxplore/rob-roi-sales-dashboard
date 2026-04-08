import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = { title: 'Rob ROI Sales', description: 'AI-driven agentic sales pipeline' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card/50 sticky top-0 z-50 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center"><span className="text-white font-bold text-sm">R</span></div>
                <h1 className="font-semibold text-lg">Rob ROI Sales</h1>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Agentic Mode</span>
              </div>
              <a href="/pipeline" className="text-sm text-primary hover:text-primary/80 font-medium">Full Pipeline</a>
            </div>
          </header>
          <main className="container mx-auto px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
