"use client"
import { useState } from 'react'
import { Users, Plus, Shield, Mail } from 'lucide-react'

const teamMembers = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@robroi.com', role: 'EXECUTIVE', status: 'active' },
  { id: '2', name: 'Marcus Johnson', email: 'marcus@robroi.com', role: 'SALES_LEAD', status: 'active' },
  { id: '3', name: 'Emily Rodriguez', email: 'emily@robroi.com', role: 'SALES_TEAM', status: 'active' },
  { id: '4', name: 'David Kim', email: 'david@robroi.com', role: 'PROJECT_MANAGER', status: 'active' },
]

const roleColors: Record<string, string> = {
  EXECUTIVE: 'text-violet-400 bg-violet-500/20',
  SALES_LEAD: 'text-blue-400 bg-blue-500/20',
  SALES_TEAM: 'text-emerald-400 bg-emerald-500/20',
  PROJECT_MANAGER: 'text-amber-400 bg-amber-500/20',
}

export default function TeamPage() {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage team members and their roles</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium">Member</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Role</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Status</th>
              <th className="text-right px-6 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teamMembers.map(member => (
              <tr key={member.id} className="hover:bg-secondary/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-medium">{member.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[member.role]}`}>
                    {member.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm text-primary hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium text-amber-400">Role Permissions</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• <strong>Executive:</strong> Full access, approve deals, view all data</li>
              <li>• <strong>Sales Lead:</strong> Manage team, approve offers, view pipeline</li>
              <li>• <strong>Sales Team:</strong> Manage own leads, create assets</li>
              <li>• <strong>Project Manager:</strong> View handover stages only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
