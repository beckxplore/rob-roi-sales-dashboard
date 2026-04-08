"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Building2, Mail, Phone, Globe, Clock, Target, DollarSign } from 'lucide-react'

interface LeadDetail {
  id: string
  companyName: string
  email: string
  contactName?: string
  phone?: string
  website?: string
  source: string
  status: string
  stage?: string
  priority: string
  notes?: string
  qualification?: { qualityScore: number; recommendation: string; reasoning: string }
  demandAnalysis?: { demandScore: number; estimatedBudget: string; decisionMakerLevel: string; currentTools: string; painPoints: string; expectedSalesCycle: number }
  triageReview?: { thesis: string; recommendedAction: string; demandScore: number }
  offerDraft?: { proposedPriceLow: number; proposedPriceMid: number; proposedPriceHigh: number; valueProposition: string }
}

export default function LeadDetailPage() {
  const params = useParams()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchLead()
  }, [params.id])

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setLead(data)
      }
    } catch (err) {
      console.error('Failed to fetch lead:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold">Lead not found</h2>
        <Link href="/pipeline" className="text-primary hover:underline mt-2 inline-block">
          Back to Pipeline
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'offer', label: 'Offer' },
  ]

  return (
    <div className="min-h-full">
      <Link href="/pipeline" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Pipeline
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{lead.companyName}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            {lead.contactName && <span>{lead.contactName}</span>}
            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {lead.email}</span>
            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {lead.phone}</span>}
            {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary"><Globe className="w-4 h-4" /> Website</a>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium">
            {lead.stage || lead.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Qualification
            </h3>
            {lead.qualification ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quality Score</span>
                  <span className="text-2xl font-bold">{lead.qualification.qualityScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommendation</span>
                  <span className={`font-medium ${lead.qualification.recommendation === 'PURSUE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {lead.qualification.recommendation}
                  </span>
                </div>
                <p className="text-sm mt-3">{lead.qualification.reasoning}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Not yet qualified</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Demand Analysis
            </h3>
            {lead.demandAnalysis ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Demand Score</span>
                  <span className="text-2xl font-bold">{lead.demandAnalysis.demandScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-mono uppercase text-sm">{lead.demandAnalysis.estimatedBudget.replace('_', '-')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Cycle</span>
                  <span>{lead.demandAnalysis.expectedSalesCycle} weeks</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Not yet analyzed</p>
            )}
          </div>

          {lead.triageReview && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3">AI Triage Thesis</h3>
              <p className="text-sm mb-3">{lead.triageReview.thesis}</p>
              <span className={`px-2 py-1 rounded text-sm font-medium ${lead.triageReview.recommendedAction === 'PROCEED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {lead.triageReview.recommendedAction}
              </span>
            </div>
          )}

          {lead.notes && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="bg-card border border-border rounded-xl p-6">
          {lead.demandAnalysis ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(lead.demandAnalysis.currentTools || '[]').map((t: string) => (
                    <span key={t} className="px-2 py-1 bg-secondary rounded text-sm">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Pain Points</h4>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(lead.demandAnalysis.painPoints || '[]').map((p: string) => (
                    <span key={p} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-sm">{p.replace('_', ' ')}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Analysis not available</p>
          )}
        </div>
      )}

      {activeTab === 'offer' && (
        <div className="bg-card border border-border rounded-xl p-6">
          {lead.offerDraft ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground">Starter</div>
                <div className="text-2xl font-bold mt-1">${lead.offerDraft.proposedPriceLow?.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary">
                <div className="text-sm text-primary">Recommended</div>
                <div className="text-2xl font-bold mt-1">${lead.offerDraft.proposedPriceMid?.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground">Enterprise</div>
                <div className="text-2xl font-bold mt-1">${lead.offerDraft.proposedPriceHigh?.toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">Offer not yet drafted</p>
          )}
        </div>
      )}
    </div>
  )
}
