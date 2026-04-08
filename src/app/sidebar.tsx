"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Folder,
  CheckCircle2,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Zap
} from 'lucide-react'
import { useState } from 'react'

const mainNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Users },
  { href: '/approvals', label: 'Approvals', icon: CheckCircle2, badge: 'pending' },
  { href: '/assets', label: 'Asset Library', icon: Folder },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
]

const roleColors: Record<string, string> = {
  EXECUTIVE: 'text-violet-400',
  SALES_LEAD: 'text-blue-400',
  SALES_TEAM: 'text-emerald-400',
  PROJECT_MANAGER: 'text-amber-400',
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const user = session?.user as any
  const role = user?.role || 'SALES_TEAM'
  const name = user?.name || 'Guest'
  const email = user?.email || 'guest@example.com'

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg">Rob ROI</span>
            <span className="block text-xs text-muted-foreground">Sales Agentic</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Main Menu
        </div>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge === 'pending' && (
                <span className="ml-auto px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  0
                </span>
              )}
            </Link>
          )
        })}

        {/* Notifications shortcut */}
        <div className="pt-3 mt-3 border-t border-border">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Notifications
          </div>
          <Link
            href="/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Alerts</span>
            <span className="ml-auto w-2 h-2 bg-destructive rounded-full" />
          </Link>
        </div>
      </nav>

      {/* Bottom Section: Settings & Profile */}
      <div className="p-3 border-t border-border space-y-1">
        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {settingsOpen && (
          <div className="pl-4 space-y-1">
            <Link href="/settings/team" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
              Team Management
            </Link>
            <Link href="/settings/integrations" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
              Integrations
            </Link>
            <Link href="/settings/llm" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
              LLM Configuration
            </Link>
            <Link href="/settings/notifications" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
              Notification Settings
            </Link>
          </div>
        )}

        {/* Profile */}
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-medium">{name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">{name}</div>
            <div className={`text-xs ${roleColors[role] || 'text-muted-foreground'}`}>
              {role.replace('_', ' ')}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>

        {profileOpen && (
          <div className="pl-4 space-y-1">
            <Link href="/profile" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
              View Profile
            </Link>
            <Link href="/profile/edit" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
              Edit Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
