"use client"
import Link from 'next/link'
import { Users, TrendingUp, CheckCircle2, Target, ArrowRight, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalLeads: 127, newLeads: 12, pursuingLeads: 23, wonLeads: 8, avgDemandScore: 67, pendingApprovals: 4 })
  const [agentFeed, setAgentFeed] = useState<any[]>([])
  useEffect(() => {
    setStats({ totalLeads: 127, newLeads: 12, pursuingLeads: 23, wonLeads: 8, avgDemandScore: 67, pendingApprovals: 4 })
    setAgentFeed([
      { time: '10:42 AM', agent: 'Qualification Agent', message: 'Scraped acme.com — 75 employees. Recommendation: PURSUE' },
      { time: '10:40 AM', agent: 'Demand Analyst', message: 'Identified pain points: manual data entry, reporting bottlenecks' },
      { time: '10:38 AM', agent: 'Triage Board', message: 'Demand score 78/100. Thesis: Strong enterprise fit' },
    ])
  }, [])
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div><h2 className="text-3xl font-bold">Dashboard</h2><p className="text-muted-foreground mt-1">AI sales force at work.</p></div>
        <Link href="/triage" className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium">
          <Target className="w-4 h-4" /> Triage Queue ({stats.pendingApprovals})
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ icon: <Users className="w-5 h-5 text-blue-400" />, label: 'Total Leads', value: stats.totalLeads }, { icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, label: 'Pursuing', value: stats.pursuingLeads }, { icon: <CheckCircle2 className="w-5 h-5 text-violet-400" />, label: 'Closed Won', value: stats.wonLeads }, { icon: <Target className="w-5 h-5 text-amber-400" />, label: 'Avg Score', value: stats.avgDemandScore }].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between">{s.icon}</div>
            <div className="mt-3"><span className="text-3xl font-bold">{s.value}</span></div>
            <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Pipeline Overview</h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {['NEW: 12', 'QUALIFYING: 5', 'TRIAGE: 4', 'OFFER_DRAFT: 3', 'PRESENTATION: 2', 'NEGOTIATING: 2', 'WON: 8', 'LOST: 5'].map(s => <div key={s} className="p-2 bg-secondary/30 rounded">{s}</div>)}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="relative h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>Agent Activity</h3>
          <div className="space-y-3 text-sm">
            {agentFeed.map((f, i) => <div key={i} className="flex gap-3"><span className="text-muted-foreground font-mono text-xs">{f.time}</span><div><div className="font-medium">{f.agent}</div><div className="text-muted-foreground">{f.message}</div></div></div>)}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/triage" className="block p-5 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40">
          <h3 className="font-semibold text-lg">Triage Queue</h3><p className="text-sm text-muted-foreground mt-1">Review AI recommendations.</p>
          <div className="mt-4 text-sm text-primary flex items-center">{stats.pendingApprovals} pending <ArrowRight className="w-4 h-4 ml-1"/></div>
        </Link>
        <Link href="/pipeline" className="block p-5 bg-gradient-to-br from-violet-900/20 to-violet-800/10 border border-violet-500/20 rounded-xl hover:border-violet-500/40">
          <h3 className="font-semibold text-lg">Full Pipeline</h3><p className="text-sm text-muted-foreground mt-1">All 11 stages.</p>
          <div className="mt-4 text-sm text-primary flex items-center">View <ArrowRight className="w-4 h-4 ml-1"/></div>
        </Link>
        <Link href="/handover" className="block p-5 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border border-cyan-500/20 rounded-xl hover:border-cyan-500/40">
          <h3 className="font-semibold text-lg">Handover Briefs</h3><p className="text-sm text-muted-foreground mt-1">Push to delivery.</p>
          <div className="mt-4 text-sm text-primary flex items-center">1 ready <ArrowRight className="w-4 h-4 ml-1"/></div>
        </Link>
      </div>
    </div>
  )
}
