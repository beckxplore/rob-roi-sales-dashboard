"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Plus, Filter } from 'lucide-react'

const stages = [
  { key: 'QUALIFICATION', label: 'Qualification', color: 'bg-blue-500' },
  { key: 'ANALYSIS', label: 'Analysis', color: 'bg-blue-500' },
  { key: 'TRIAGE', label: 'Triage', color: 'bg-amber-500' },
  { key: 'STRATEGY', label: 'Strategy', color: 'bg-violet-500' },
  { key: 'PRESENTATION', label: 'Presentation', color: 'bg-emerald-500' },
  { key: 'NEGOTIATING', label: 'Negotiation', color: 'bg-orange-500' },
  { key: 'CLOSED_WON', label: 'Won', color: 'bg-emerald-500' },
  { key: 'CLOSED_LOST', label: 'Lost', color: 'bg-rose-500' },
  { key: 'PM_HANDOFF', label: 'PM Handoff', color: 'bg-cyan-500' },
]

interface Lead {
  id: string
  companyName: string
  status: string
  stage?: string
  email: string
  contactName?: string
  updatedAt: string
  demandAnalysis?: { demandScore: number }
  offerDraft?: { proposedPriceMid: number }
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads?limit=100')
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter(l => 
    l.companyName.toLowerCase().includes(filter.toLowerCase()) ||
    l.email.toLowerCase().includes(filter.toLowerCase())
  )

  const getLeadsByStage = (stage: string) => {
    return filteredLeads.filter(l => (l.stage || l.status) === stage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground mt-1">{leads.length} total leads</p>
        </div>
        <Link
          href="/leads/new"
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6">
        {stages.map(stage => {
          const stageLeads = getLeadsByStage(stage.key)
          return (
            <div key={stage.key} className="flex-shrink-0 w-72 bg-card border border-border rounded-xl flex flex-col">
              <div className={`${stage.color} h-1 rounded-t-xl`} />
              <div className="p-3 border-b border-border flex justify-between items-center">
                <span className="font-semibold text-sm">{stage.label}</span>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded">{stageLeads.length}</span>
              </div>
              <div className="flex-1 p-2 space-y-2 min-h-48">
                {stageLeads.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-8">No leads</div>
                ) : (
                  stageLeads.map(lead => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="block p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-transparent hover:border-border transition-all"
                    >
                      <div className="font-medium text-sm">{lead.companyName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{lead.contactName || lead.email}</div>
                      <div className="flex items-center justify-between mt-2">
                        {lead.demandAnalysis?.demandScore ? (
                          <span className="text-xs font-mono">
                            Score: {lead.demandAnalysis.demandScore}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">New</span>
                        )}
                        {lead.offerDraft?.proposedPriceMid && (
                          <span className="text-xs font-mono">
                            ${(lead.offerDraft.proposedPriceMid / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
