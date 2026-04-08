"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'

const stages = [
  { key: 'NEW', label: 'New Inbound', color: 'bg-gray-500' },
  { key: 'QUALIFYING', label: 'Qualifying', color: 'bg-blue-500' },
  { key: 'ANALYZING', label: 'Analyzing', color: 'bg-blue-500' },
  { key: 'TRIAGE', label: 'Triage', color: 'bg-amber-500' },
  { key: 'OFFER_DRAFT', label: 'Offer', color: 'bg-violet-500' },
  { key: 'REVIEW', label: 'Review', color: 'bg-amber-500' },
  { key: 'PRESENTATION', label: 'Present', color: 'bg-emerald-500' },
  { key: 'NEGOTIATING', label: 'Negotiate', color: 'bg-orange-500' },
  { key: 'CLOSED_WON', label: 'Won', color: 'bg-emerald-500' },
  { key: 'HANDOVER', label: 'Handover', color: 'bg-cyan-500' },
]

export default function PipelinePage() {
  const [leads, setLeads] = useState<any[]>([])
  useEffect(() => { fetch('/api/leads').then(r => r.json()).then(d => setLeads(d.leads || [])).catch(() => {}) }, [])
  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold">Pipeline</h1><p className="text-muted-foreground">Agentic lead progression</p></div>
        <Link href="/" className="text-sm text-primary hover:underline">Back to Dashboard</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(s => (
          <div key={s.key} className="flex-shrink-0 w-64 bg-card border border-border rounded-xl flex flex-col">
            <div className={`${s.color} h-1 rounded-t-xl`}/>
            <div className="p-3 border-b border-border flex justify-between">
              <span className="font-semibold text-sm">{s.label}</span>
              <span className="text-xs bg-secondary px-2 rounded">{leads.filter(l => l.status === s.key).length}</span>
            </div>
            <div className="p-2 min-h-32"><div className="text-xs text-muted-foreground text-center py-4">-</div></div>
          </div>
        ))}
      </div>
    </div>
  )
}
