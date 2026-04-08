"use client"
import { useState } from 'react'
import { Plug, CheckCircle2, XCircle, Bell, MessageSquare, Zap } from 'lucide-react'

const integrations = [
  { id: 'telegram', name: 'Telegram Bot', description: 'Send notifications and alerts to Telegram', icon: MessageSquare, connected: false },
  { id: 'slack', name: 'Slack', description: 'Post updates to Slack channels', icon: Bell, connected: false },
  { id: 'linear', name: 'Linear', description: 'Create projects in Linear', icon: Zap, connected: false },
  { id: 'github', name: 'GitHub', description: 'Create issues for handoffs', icon: Plug, connected: false },
]

export default function IntegrationsPage() {
  const [configs, setConfigs] = useState<Record<string, { enabled: boolean; token?: string; channel?: string }>>({})

  const toggleIntegration = (id: string) => {
    setConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id]?.enabled }
    }))
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect external services to automate your workflow</p>
      </div>

      <div className="space-y-4">
        {integrations.map(int => {
          const Icon = int.icon
          const config = configs[int.id] || { enabled: false }
          
          return (
            <div key={int.id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{int.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{int.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleIntegration(int.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    config.enabled 
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {config.enabled ? 'Configured' : 'Configure'}
                </button>
              </div>

              {config.enabled && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">API Token</label>
                    <input
                      type="password"
                      placeholder="Enter token..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Channel / Channel ID</label>
                    <input
                      type="text"
                      placeholder="@your-channel or channel ID"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
