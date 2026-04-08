"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { 
  Users, TrendingUp, CheckCircle2, Target, AlertTriangle, 
  Clock, ArrowRight, FileText, MessageSquare, Bell, LogOut,
  Sparkles, Shield, Briefcase
} from 'lucide-react'

interface Stats {
  totalLeads: number
  pendingApprovals: number
  inPipeline: number
  closedWon: number
  closedWonValue: number
  closingRate: number
  stagnant: number
}

interface PendingApproval {
  id: string
  stage: string
  lead: { companyName: string; demandScore?: number }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login'
      return
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      const [leadsRes, approvalsRes] = await Promise.all([
        fetch('/api/leads?limit=100'),
        fetch('/api/approvals')
      ])
      
      const leadsData = await leadsRes.json()
      const approvalsData = await approvalsRes.json()
      
      const leads = leadsData.leads || []
      
      const inPipeline = leads.filter((l: any) => !['CLOSED_WON', 'CLOSED_LOST'].includes(l.status)).length
      const closedWon = leads.filter((l: any) => l.status === 'CLOSED_WON').length
      const closedWonValue = leads.filter((l: any) => l.status === 'CLOSED_WON')
        .reduce((sum: number, l: any) => sum + (l.offerDraft?.proposedPriceMid || 0), 0)
      const stagnant = leads.filter((l: any) => {
        const daysSince = (Date.now() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        return daysSince > 7 && !['CLOSED_WON', 'CLOSED_LOST'].includes(l.status)
      }).length
      
      setStats({
        totalLeads: leads.length,
        pendingApprovals: approvalsData.approvals?.length || 0,
        inPipeline,
        closedWon,
        closedWonValue,
        closingRate: closedWon + leads.filter((l: any) => l.status === 'CLOSED_LOST').length > 0 
          ? (closedWon / (closedWon + leads.filter((l: any) => l.status === 'CLOSED_LOST').length)) * 100 
          : 0,
        stagnant,
      })
      
      setPendingApprovals(approvalsData.approvals?.slice(0, 5) || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const userRole = (session?.user as any)?.role || 'SALES_TEAM'
  const userName = session?.user?.name || 'User'

  const roleLabels: Record<string, string> = {
    EXECUTIVE: 'Executive',
    SALES_LEAD: 'Sales Lead',
    SALES_TEAM: 'Sales Team',
    PROJECT_MANAGER: 'Project Manager',
  }

  const roleColors: Record<string, string> = {
    EXECUTIVE: 'text-violet-400 bg-violet-500/20',
    SALES_LEAD: 'text-blue-400 bg-blue-500/20',
    SALES_TEAM: 'text-emerald-400 bg-emerald-500/20',
    PROJECT_MANAGER: 'text-amber-400 bg-amber-500/20',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[userRole]}`}>
              {roleLabels[userRole]}
            </span>
            <span className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <Link 
          href="/leads/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
        >
          + Add Lead
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-400" />} label="Total Leads" value={stats?.totalLeads || 0} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} label="In Pipeline" value={stats?.inPipeline || 0} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-violet-400" />} label="Closed Won" value={stats?.closedWon || 0} />
        <StatCard 
          icon={<Target className="w-5 h-5 text-amber-400" />} 
          label="Closing Rate" 
          value={`${(stats?.closingRate || 0).toFixed(1)}%`} 
        />
      </div>

      {/* Pending Approvals (Executive/Sales Lead only) */}
      {['EXECUTIVE', 'SALES_LEAD'].includes(userRole) && stats?.pendingApprovals ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Pending Approvals
              {stats.pendingApprovals > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                  {stats.pendingApprovals}
                </span>
              )}
            </h2>
            <Link href="/approvals" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {pendingApprovals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending approvals</p>
          ) : (
            <div className="space-y-2">
              {pendingApprovals.map((a) => (
                <Link key={a.id} href={`/approvals?id=${a.id}`} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50">
                  <div>
                    <div className="font-medium">{a.lead.companyName}</div>
                    <div className="text-xs text-muted-foreground">{a.stage.replace('_', ' ')}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Project Manager View */}
      {userRole === 'PROJECT_MANAGER' && (
        <div className="bg-card border border-cyan-500/30 rounded-xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            Your Projects
          </h2>
          <p className="text-sm text-muted-foreground">
            View leads in PM Handover and Solution Deployment stages.
          </p>
          <Link href="/pipeline?role=pm" className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
            View Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/pipeline" className="group block p-5 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40">
          <h3 className="font-semibold text-lg">Pipeline</h3>
          <p className="text-sm text-muted-foreground mt-1">View all leads across stages</p>
          <div className="mt-3 text-sm text-primary flex items-center">
            Open Pipeline <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link href="/assets" className="group block p-5 bg-gradient-to-br from-violet-900/20 to-violet-800/10 border border-violet-500/20 rounded-xl hover:border-violet-500/40">
          <h3 className="font-semibold text-lg">Asset Library</h3>
          <p className="text-sm text-muted-foreground mt-1">Presentations, proposals, contracts</p>
          <div className="mt-3 text-sm text-primary flex items-center">
            Browse Assets <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link href="/chat" className="group block p-5 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/20 rounded-xl hover:border-emerald-500/40">
          <h3 className="font-semibold text-lg">AI Chat</h3>
          <p className="text-sm text-muted-foreground mt-1">Chat with Critical Agent</p>
          <div className="mt-3 text-sm text-primary flex items-center">
            Start Chat <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>

      {/* Alerts */}
      {stats?.stagnant ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium text-amber-400">Lead Stagnation Alert</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.stagnant} lead{stats.stagnant > 1 ? 's have' : ' has'} no activity for 7+ days.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between">{icon}</div>
      <div className="mt-3">
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
