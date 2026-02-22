"use client"

import { AppProvider } from "@/lib/store"
import { AppShell } from "@/components/app-shell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  )
}
