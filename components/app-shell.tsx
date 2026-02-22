"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Home, Calendar, ListTodo, Menu, X, LogOut, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/shift", label: "シフト登録", icon: Calendar },
  { href: "/tasks", label: "タスク一覧", icon: ListTodo },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentProfile, logout, isLoading } = useApp()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  const displayName = currentProfile?.name ?? "ユーザー"
  const displayRole = currentProfile?.role ?? ""

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar text-sidebar-foreground">
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
              {"K"}
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-sidebar-foreground">
                カジシフト
              </h1>
              <p className="text-xs text-sidebar-foreground/60">シフト連動 家庭タスク管理</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-bold">
                {displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{displayName}</p>
                <p className="text-xs text-sidebar-foreground/60">{displayRole}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">ログアウト</span>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            {"K"}
          </div>
          <h1 className="text-base font-bold text-foreground">カジシフト</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{displayName}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="h-9 w-9"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">メニュー</span>
          </Button>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setMobileNavOpen(false)}>
          <nav
            className="absolute top-[57px] left-0 right-0 bg-card border-b border-border p-4 space-y-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={() => {
                logout()
                setMobileNavOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-5 w-5" />
              ログアウト
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
