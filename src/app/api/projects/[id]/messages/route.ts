import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const chapter = searchParams.get("chapter")

    const where: Record<string, unknown> = { projectId: id }
    if (chapter) {
      where.chapterNumber = parseInt(chapter)
    }

    const messages = await prisma.message.findMany({
      where: where as any,
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(messages)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
