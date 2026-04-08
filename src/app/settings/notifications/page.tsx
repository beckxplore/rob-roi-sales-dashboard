"use client"
import { useState } from 'react'
import { Bell, Mail, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react'

const notificationTypes = [
  { id: 'approval_required', name: 'Approval Required', description: 'When a deal needs executive approval', defaultEnabled: true },
  { id: 'deal_closed_won', name: 'Deal Won', description: 'When a deal is successfully closed', defaultEnabled: true },
  { id: 'deal_closed_lost', name: 'Deal Lost', description: 'When a deal is lost', defaultEnabled: true },
  { id: 'stagnation_alert', name: 'Stagnation Alert', description: 'When a lead has no activity for 7+ days', defaultEnabled: true },
  { id: 'pipeline_update', name: 'Daily Pipeline Update', description: 'Daily summary of pipeline status', defaultEnabled: true },
  { id: 'critical_agent_alert', name: 'Critical Agent Alert', description: 'When Critical Agent flags a high-risk lead', defaultEnabled: true },
  { id: 'team_performance', name: 'Weekly Performance', description: 'Weekly team performance digest', defaultEnabled: false },
]

const channels = [
  { id: 'telegram', name: 'Telegram', icon: MessageSquare },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'dashboard', name: 'Dashboard', icon: Bell },
]

export default function NotificationsPage() {
  const [settings, setSettings] = useState<Record<string, { enabled: boolean; channels: string[] }>>(
    Object.fromEntries(notificationTypes.map(n => [n.id, { enabled: n.defaultEnabled, channels: ['dashboard'] }]))
  )

  const toggleNotification = (id: string) => {
    setSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled }
    }))
  }

  const toggleChannel = (notifId: string, channelId: string) => {
    setSettings(prev => {
      const current = prev[notifId].channels
      const updated = current.includes(channelId)
        ? current.filter(c => c !== channelId)
        : [...current, channelId]
      return { ...prev, [notifId]: { ...prev[notifId], channels: updated } }
    })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">Configure how and when you receive alerts</p>
      </div>

      <div className="space-y-4">
        {notificationTypes.map(notif => {
          const setting = settings[notif.id] || { enabled: false, channels: [] }
          
          return (
            <div key={notif.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium">{notif.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.description}</p>
                </div>
                <button
                  onClick={() => toggleNotification(notif.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    setting.enabled ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    setting.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {setting.enabled && (
                <div className="flex flex-wrap gap-2">
                  {channels.map(ch => {
                    const Icon = ch.icon
                    const isActive = setting.channels.includes(ch.id)
                    return (
                      <button
                        key={ch.id}
                        onClick={() => toggleChannel(notif.id, ch.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {ch.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
