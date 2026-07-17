"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Search,
  Plus,
  LayoutDashboard,
  BookOpen,
  Moon,
  Sun,
  ArrowRight,
  FileText,
  FlaskConical,
  BarChart3,
  Bookmark,
  FolderOpen,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "@/lib/theme-provider"
import { cn } from "@/lib/utils"
import type { Project } from "@/types"

interface Action {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { theme, toggle: toggleTheme } = useTheme()

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) return []
      return res.json()
    },
  })

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "New Research Project",
          academicLevel: "UNDERGRADUATE",
          department: "",
          institution: "",
          country: "",
          methodology: "QUANTITATIVE",
          citationStyle: "APA",
        }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setOpen(false)
      router.push(`/dashboard/research/${data.id}`)
    },
  })

  const isInProject = pathname.startsWith("/dashboard/research/")
  const projectId = isInProject ? pathname.split("/dashboard/research/")[1] : null

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const run = useCallback((fn: () => void) => {
    setOpen(false)
    fn()
  }, [])

  const chapterIcons: Record<number, React.ReactNode> = {
    1: <BookOpen className="h-4 w-4" />,
    2: <FileText className="h-4 w-4" />,
    3: <FlaskConical className="h-4 w-4" />,
    4: <BarChart3 className="h-4 w-4" />,
    5: <FileText className="h-4 w-4" />,
    6: <Bookmark className="h-4 w-4" />,
    7: <FolderOpen className="h-4 w-4" />,
  }

  const actions: Action[] = [
    {
      id: "new-project",
      label: "Create new project",
      description: "Start a new research project",
      icon: <Plus className="h-4 w-4" />,
      shortcut: "N",
      action: () => createProject.mutate(),
    },
    {
      id: "dashboard",
      label: "Go to Dashboard",
      description: "View all projects",
      icon: <LayoutDashboard className="h-4 w-4" />,
      shortcut: "G D",
      action: () => router.push("/dashboard"),
    },
    {
      id: "toggle-theme",
      label: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
      icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      shortcut: "T",
      action: () => toggleTheme(),
    },
    ...(isInProject
      ? [1, 2, 3, 4, 5, 6, 7].map((num) => ({
          id: `chapter-${num}`,
          label: `Go to Chapter ${num}`,
          description: `Navigate to chapter ${num}`,
          icon: chapterIcons[num] || <FileText className="h-4 w-4" />,
          shortcut: `${num}`,
          action: () => {
            const main = document.querySelector("[data-chapter-nav]")
            const btn = main?.querySelector(`[data-chapter="${num}"]`) as HTMLButtonElement
            btn?.click()
          },
        }))
      : []),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      label: p.topic,
      description: `${p.academicLevel} · ${p.methodology.replace(/_/g, " ")}`,
      icon: <ArrowRight className="h-4 w-4" />,
      action: () => router.push(`/dashboard/research/${p.id}`),
    })),
  ]

  const filtered = query.trim()
    ? actions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase())
      )
    : actions

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const el = listRef.current.children[selectedIndex] as HTMLElement
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault()
      run(filtered[selectedIndex].action)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="w-full max-w-lg rounded-xl border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions and projects..."
            className="flex-1 py-3.5 text-sm bg-transparent outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-72 overflow-y-auto p-2 space-y-0.5"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                onClick={() => run(item.action)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  i === selectedIndex
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                  {item.description && (
                    <span
                      className={cn(
                        "block truncate text-xs mt-0.5",
                        i === selectedIndex
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </span>
                  )}
                </div>
                {item.shortcut && (
                  <kbd
                    className={cn(
                      "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono",
                      i === selectedIndex
                        ? "border-primary-foreground/30 text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        <div className="border-t px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  )
}
