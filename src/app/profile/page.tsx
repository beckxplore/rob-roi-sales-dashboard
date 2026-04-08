"use client"
import { useSession } from 'next-auth/react'
import { Save, User } from 'lucide-react'
import { useState } from 'react'

const roleLabels: Record<string, string> = {
  EXECUTIVE: 'Executive',
  SALES_LEAD: 'Sales Lead',
  SALES_TEAM: 'Sales Team',
  PROJECT_MANAGER: 'Project Manager',
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as any
  
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In production, save to database
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">{name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">{name || 'User'}</h2>
            <span className="px-2 py-1 bg-secondary rounded text-sm mt-1 inline-block">
              {roleLabels[user?.role] || 'Sales Team'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="bg-secondary/30 border border-border rounded-xl p-6">
        <h3 className="font-medium mb-2">Account Information</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Role: <span className="text-foreground">{roleLabels[user?.role] || 'Sales Team'}</span></p>
          <p>Member since: <span className="text-foreground">March 2024</span></p>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 p-4 bg-emerald-500 text-white rounded-lg shadow-lg flex items-center gap-2">
          <Save className="w-5 h-5" />
          Profile saved!
        </div>
      )}
    </div>
  )
}
