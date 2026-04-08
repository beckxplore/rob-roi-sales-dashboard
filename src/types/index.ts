export type LeadStatus = 'NEW' | 'QUALIFYING' | 'ANALYZING' | 'TRIAGE' | 'OFFER_DRAFT' | 'REVIEW' | 'PRESENTATION' | 'NEGOTIATING' | 'CLOSED_WON' | 'CLOSED_LOST' | 'HANDOVER'
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'
export type Recommendation = 'PURSUE' | 'JUNK' | 'REVIEW_MANUAL'
export interface AgentResult {
  success: boolean
  leadId: string
  nextStatus?: LeadStatus
  message: string
}
