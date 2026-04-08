"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Target, Sparkles, Check, X, Clock } from 'lucide-react'

export default function TriagePage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/leads?status=TRIAGE').then(r => r.json()).then(d => { setLeads(d.leads || []); setLoading(false) }).catch(() => setLoading(false)) }, [])
  const handleDecision = async (id: string, decision: string) => {
    const res = await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: decision === 'PROCEED' ? 'OFFER_DRAFT' : 'CLOSED_LOST' }) })
    if (res.ok) setLeads(leads.filter(l => l.id !== id))
  }
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Link href="/" className="text-sm text-primary hover:underline mb-2 inline-block">Back to Dashboard</Link>
        <h1 className="text-3xl font-bold">Triage Queue</h1>
        <p className="text-muted-foreground mt-2">Review AI recommendations — approve or kill deals.</p>
      </div>
      {loading ? <div className="flex justify-center py-12"><Clock className="w-6 h-6 animate-spin"/></div> :
       leads.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Target className="w-12 h-12 mx-auto mb-3 opacity-50"/><p>No leads in triage.</p></div> :
       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {leads.map(l => (
           <div key={l.id} className="p-5 rounded-xl border border-border bg-card">
             <div className="flex justify-between mb-3">
               <div><h3 className="font-bold">{l.companyName}</h3><p className="text-xs text-muted-foreground">{l.email}</p></div>
               <div className={`text-lg font-bold ${(l.demandAnalysis?.demandScore || 0) >= 70 ? 'text-emerald-400' : (l.demandAnalysis?.demandScore || 0) >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{l.demandAnalysis?.demandScore || '-'}</div>
             </div>
             {l.triageReview && (
               <div className="bg-secondary/30 rounded p-3 mb-4">
                 <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3"/>AI Thesis</div>
                 <p className="text-sm">{l.triageReview.thesis}</p>
               </div>
             )}
             <div className="flex gap-2">
               <button onClick={() => handleDecision(l.id, 'KILL')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-sm"><X className="w-4 h-4"/>Kill</button>
               <button onClick={() => handleDecision(l.id, 'PROCEED')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-sm"><Check className="w-4 h-4"/>Proceed</button>
             </div>
           </div>
         ))}
       </div>
      }
    </div>
  )
}
