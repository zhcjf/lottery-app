import { Link, useLocation } from 'react-router'
import { Settings, Trophy, ListChecks, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/', label: '配置', icon: Settings },
  { path: '/lottery', label: '开奖', icon: Trophy },
  { path: '/records', label: '记录', icon: ListChecks },
]

export function NavBar() {
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold text-foreground">
            抽奖助手
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
