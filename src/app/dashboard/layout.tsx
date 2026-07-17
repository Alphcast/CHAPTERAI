"use client"

import { useState } from "react"
import { PanelLeft } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto bg-background relative">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed left-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-lg border bg-background hover:bg-muted transition-colors md:hidden"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        {children}
      </main>
    </div>
  )
}
