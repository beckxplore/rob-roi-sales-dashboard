"use client"
import Link from 'next/link'
import { Sparkles, CheckCircle2, Send } from 'lucide-react'

export default function HandoverPage() {
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Link href="/" className="text-sm text-primary hover:underline mb-2 inline-block">Back to Dashboard</Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-cyan-400" />
          Handover Briefs
        </h1>
        <p className="text-muted-foreground mt-2">Signed contracts ready for delivery team.</p>
      </div>
      
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
        <h2 className="text-xl font-bold mb-2">No pending handovers</h2>
        <p className="text-muted-foreground mb-4">When contracts are signed, handover briefs will appear here.</p>
        <div className="flex justify-center gap-3">
          <Link href="/pipeline" className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium">View Pipeline</Link>
        </div>
      </div>
    </div>
  )
}
