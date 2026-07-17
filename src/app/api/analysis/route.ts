import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, type, data } = body

    const analysis = await prisma.analysis.create({
      data: {
        projectId,
        type,
        data: data || {},
        results: [],
      },
    })

    return NextResponse.json(analysis, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to create analysis" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      )
    }

    const analyses = await prisma.analysis.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(analyses)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
