import { cn } from "@/lib/utils"

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
    </div>
  )
}

export function ProjectListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn("flex gap-3 rounded-lg p-4", isUser ? "bg-primary/5" : "bg-muted/50")}>
      <Skeleton className={cn(
        "h-8 w-8 rounded-full shrink-0",
        isUser ? "bg-secondary" : "bg-primary"
      )} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export function ChatListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <ChatMessageSkeleton key={i} isUser={i % 2 === 0} />
      ))}
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full p-3 space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}

export function ChapterNavSkeleton() {
  return (
    <div className="w-56 border-r p-3 space-y-2">
      <Skeleton className="h-4 w-16" />
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}

export function ResearchPanelSkeleton() {
  return (
    <div className="w-72 border-l p-4 space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  )
}
