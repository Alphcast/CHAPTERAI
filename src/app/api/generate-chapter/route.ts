import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runChapterAgent, getAgentForChapter } from "@/agents"
import type { AgentContext } from "@/agents/types"
import { getModel, createStreamResponse } from "@/lib/ai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, chapterNumber } = body as {
      projectId: string
      chapterNumber: number
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await prisma.chapter.updateMany({
      where: { projectId, chapterNumber },
      data: { status: "GENERATING" },
    })

    const agentContext: AgentContext = {
      projectId,
      topic: project.topic,
      academicLevel: project.academicLevel,
      methodology: project.methodology,
      citationStyle: project.citationStyle,
      department: project.department,
      institution: project.institution,
      country: project.country,
      chapterNumber,
    }

    const model = getModel()

    if (model) {
      const agent = getAgentForChapter(chapterNumber)
      const system = agent.systemPrompt(agentContext)

      const prompt = `Generate the complete Chapter ${chapterNumber} for my research on "${project.topic}".
I am a ${project.academicLevel.toLowerCase()} student in ${project.department} at ${project.institution}.
Methodology: ${project.methodology.replace(/_/g, " ")}.
Citation: ${project.citationStyle} style.
Generate comprehensive academic content with all required sections, properly formatted.`

      const stream = createStreamResponse({
        model,
        system,
        prompt,
      })

      if (stream) {
        let fullContent = ""
        for await (const chunk of stream.fullStream) {
          if (chunk.type === "text-delta" && chunk.textDelta) {
            fullContent += chunk.textDelta
          }
        }

        if (fullContent) {
          await prisma.chapter.updateMany({
            where: { projectId, chapterNumber },
            data: { content: fullContent, status: "COMPLETE" },
          })

          await prisma.message.create({
            data: {
              projectId,
              chapterNumber,
              role: "user",
              content: `Generate complete Chapter ${chapterNumber}`,
            },
          })

          await prisma.message.create({
            data: {
              projectId,
              chapterNumber,
              role: "assistant",
              content: fullContent,
            },
          })

          return NextResponse.json({ success: true, content: fullContent, chapterNumber })
        }
      }
    }

    const { content } = await runChapterAgent(agentContext)

    await prisma.chapter.updateMany({
      where: { projectId, chapterNumber },
      data: { content, status: "COMPLETE" },
    })

    await prisma.message.create({
      data: {
        projectId,
        chapterNumber,
        role: "user",
        content: `Generate complete Chapter ${chapterNumber}`,
      },
    })

    await prisma.message.create({
      data: {
        projectId,
        chapterNumber,
        role: "assistant",
        content,
      },
    })

    return NextResponse.json({ success: true, content, chapterNumber })
  } catch (error) {
    console.error("Generate chapter error:", error)
    return NextResponse.json(
      { error: "Failed to generate chapter" },
      { status: 500 }
    )
  }
}
