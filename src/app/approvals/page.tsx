"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Check, X, Clock, ArrowLeft, MessageSquare } from 'lucide-react'

interface Approval {
  id: string
  stage: string
  summary: string
  status: string
  lead: {
    id: string
    companyName: string
    demandScore?: number
    assignedTo?: { name: string }
    offerDraft?: { proposedPriceMid?: number }
  }
  decidedBy?: { name: string }
  decidedAt?: string
  notes?: string
}

const stageLabels: Record<string, string> = {
  REVIEW_BOARD_1: 'Review Board 1',
  OFFER_APPROVAL: 'Offer Approval',
  REVIEW_BOARD_2: 'Review Board 2',
}

const stageDescriptions: Record<string, string> = {
  REVIEW_BOARD_1: 'Executive review of lead viability and demand analysis',
  OFFER_APPROVAL: 'Sales lead approval of the proposed offer and terms',
  REVIEW_BOARD_2: 'Final executive sign-off before client presentation',
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals')
      const data = await res.json()
      setApprovals(data.approvals || [])
    } catch (err) {
      console.error('Failed to fetch approvals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (approvalId: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
    setProcessing(approvalId)
    try {
      await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId, status, notes }),
      })
      setApprovals(approvals.filter(a => a.id !== approvalId))
    } catch (err) {
      console.error('Failed to update approval:', err)
      alert('Failed to process decision')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pending = approvals.filter(a => a.status === 'PENDING')
  const decided = approvals.filter(a => a.status !== 'PENDING')

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8 text-amber-400" />
          Approval Queue
        </h1>
        <p className="text-muted-foreground mt-1">Review and approve leads at critical decision gates</p>
      </div>

      {/* Pending Approvals */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Check className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(approval => (
              <ApprovalCard 
                key={approval.id} 
                approval={approval}
                onApprove={(notes) => handleDecision(approval.id, 'APPROVED', notes)}
                onReject={(notes) => handleDecision(approval.id, 'REJECTED', notes)}
                processing={processing === approval.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recently Decided */}
      {decided.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            Recently Decided ({decided.length})
          </h2>
          <div className="space-y-2">
            {decided.slice(0, 5).map(approval => (
              <div key={approval.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    approval.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {approval.status}
                  </span>
                  <span className="font-medium">{approval.lead.companyName}</span>
                  <span className="text-muted-foreground">{stageLabels[approval.stage]}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  by {approval.decidedBy?.name || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ApprovalCard({ 
  approval, 
  onApprove, 
  onReject, 
  processing 
}: { 
  approval: Approval
  onApprove: (notes?: string) => void
  onReject: (notes?: string) => void
  processing: boolean
}) {
  const [notes, setNotes] = useState('')

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Link href={`/leads/${approval.lead.id}`} className="text-xl font-bold hover:text-primary">
              {approval.lead.companyName}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                {stageLabels[approval.stage]}
              </span>
              {approval.lead.demandScore && (
                <span className="text-sm text-muted-foreground">
                  Demand: {approval.lead.demandScore}/100
                </span>
              )}
              {approval.lead.offerDraft?.proposedPriceMid && (
                <span className="text-sm font-mono">
                  ${approval.lead.offerDraft.proposedPriceMid.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">{stageDescriptions[approval.stage]}</p>
          <p className="text-sm">{approval.summary}</p>
        </div>

        {approval.lead.assignedTo && (
          <div className="text-sm text-muted-foreground mb-4">
            Assigned to: <span className="text-foreground">{approval.lead.assignedTo.name}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
            rows={2}
            placeholder="Add any notes..."
          />
        </div>
      </div>

      <div className="flex border-t border-border">
        <button
          onClick={() => onReject(notes || undefined)}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 hover:bg-rose-500/10 text-rose-400 font-medium transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={() => onApprove(notes || undefined)}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 hover:bg-emerald-500/10 text-emerald-400 font-medium transition-colors disabled:opacity-50 border-l border-border"
        >
          {processing ? (
            <Clock className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Approve
        </button>
      </div>
    </div>
  )
}
