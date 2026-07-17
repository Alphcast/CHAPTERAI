"use client"

import { useQuery } from "@tanstack/react-query"
import { FileText, Loader2 } from "lucide-react"
import type { Chapter } from "@/types"

interface ChapterViewProps {
  projectId: string
  chapterNumber: number
}

export function ChapterView({ projectId, chapterNumber }: ChapterViewProps) {
  const { data: chapters = [], isLoading } = useQuery<Chapter[]>({
    queryKey: ["chapters", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) return []
      const data = await res.json()
      return data.chapters || []
    },
  })

  const chapter = chapters.find((c) => c.chapterNumber === chapterNumber)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!chapter || !chapter.content) {
    return null
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/50 px-4 py-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">
          Chapter {chapter.chapterNumber}: {chapter.title}
        </span>
        {chapter.status === "GENERATING" && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating...
          </span>
        )}
        {chapter.status === "COMPLETE" && (
          <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
            Complete
          </span>
        )}
      </div>
      <div className="p-6 text-sm leading-relaxed whitespace-pre-wrap">
        {chapter.content}
      </div>
    </div>
  )
}
