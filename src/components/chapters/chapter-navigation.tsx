"use client"

import { CheckCircle2, Circle, Loader2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChapterStatus } from "@/types"

interface ChapterNavItem {
  number: number
  title: string
  icon: LucideIcon
}

interface ChapterNavigationProps {
  chapters: ChapterNavItem[]
  activeChapter: number
  onSelect: (number: number) => void
  chapterStatuses?: Record<number, ChapterStatus>
}

const statusConfig: Record<ChapterStatus, { icon: typeof CheckCircle2; className: string }> = {
  COMPLETE: { icon: CheckCircle2, className: "text-green-500" },
  GENERATING: { icon: Loader2, className: "text-yellow-500 animate-spin" },
  DRAFT: { icon: Circle, className: "text-muted-foreground/40" },
}

export function ChapterNavigation({
  chapters,
  activeChapter,
  onSelect,
  chapterStatuses = {},
}: ChapterNavigationProps) {
  return (
    <nav className="w-56 border-r bg-muted/30 p-3 overflow-y-auto shrink-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Chapters
      </p>
      <div className="space-y-1">
        {chapters.map((chapter) => {
          const Icon = chapter.icon
          const status = chapterStatuses[chapter.number] || "DRAFT"
          const StatusIcon = statusConfig[status].icon
          const isActive = activeChapter === chapter.number

          return (
            <button
              key={chapter.number}
              data-chapter={chapter.number}
              onClick={() => onSelect(chapter.number)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors group",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{chapter.title}</span>
              <StatusIcon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isActive
                    ? "text-primary-foreground/70"
                    : statusConfig[status].className
                )}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
