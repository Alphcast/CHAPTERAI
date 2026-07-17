import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getModel, createStreamResponse } from "@/lib/ai"
import { processUserPrompt, getAgentForChapter } from "@/agents"
import type { AgentContext } from "@/agents/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, chapterNumber, content } = body as {
      projectId: string
      chapterNumber: number
      content: string
    }

    console.log("[Chat API] Received request:", { projectId, chapterNumber, contentLength: content?.length })

    const apiKey = process.env.OPENROUTER_API_KEY
    console.log("[Chat API] OPENROUTER_API_KEY present:", !!apiKey, apiKey ? `(${apiKey.substring(0, 15)}...)` : "(empty)")

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      console.log("[Chat API] Project not found:", projectId)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log("[Chat API] Project found:", { topic: project.topic, methodology: project.methodology })

    await prisma.message.create({
      data: {
        projectId,
        chapterNumber,
        role: "user",
        content,
      },
    })

    const previousMessages = await prisma.message.findMany({
      where: { projectId, chapterNumber },
      orderBy: { createdAt: "asc" },
      take: 20,
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
      previousMessages: previousMessages.map((m) => ({ role: m.role, content: m.content })),
    }

    const model = getModel()
    console.log("[Chat API] Model obtained:", !!model)

    if (model) {
      const agent = getAgentForChapter(chapterNumber)
      const system = agent.systemPrompt(agentContext)
      console.log("[Chat API] Agent for chapter", chapterNumber, ":", agent.name)
      console.log("[Chat API] System prompt length:", system.length)

      const isFullChapterRequest =
        content.toLowerCase().includes("generate complete") ||
        content.toLowerCase().includes("write chapter") ||
        content.toLowerCase().includes("generate full chapter")

      let prompt = content

      if (isFullChapterRequest) {
        prompt = `Generate the complete content for Chapter ${chapterNumber} of my research on "${project.topic}".
Use ${project.citationStyle} citation style throughout.
I am a ${project.academicLevel.toLowerCase()} student in ${project.department} at ${project.institution}.
My research uses ${project.methodology.replace(/_/g, " ")} methodology.
Please generate comprehensive, well-structured academic content with all required sections properly formatted.`
      }

      console.log("[Chat API] Starting stream...")

      const stream = createStreamResponse({
        model,
        system,
        prompt,
      })

      if (stream) {
        let fullResponse = ""

        const encoder = new TextEncoder()

        const responseStream = new ReadableStream({
          async start(controller) {
            try {
              let chunkCount = 0
              for await (const chunk of stream.fullStream) {
                chunkCount++
                if (chunk.type === "text-delta" && chunk.textDelta) {
                  fullResponse += chunk.textDelta
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({ type: "text", content: chunk.textDelta }) + "\n"
                    )
                  )
                } else if (chunk.type === "error") {
                  console.error("[Chat API] Stream error chunk:", JSON.stringify(chunk))
                }
              }
              console.log("[Chat API] Stream complete. Chunks:", chunkCount, "Response length:", fullResponse.length)

              if (fullResponse.length === 0) {
                console.error("[Chat API] WARNING: Empty response from AI!")
              }

              if (isFullChapterRequest) {
                await prisma.chapter.updateMany({
                  where: { projectId, chapterNumber },
                  data: { content: fullResponse, status: "COMPLETE" },
                })
              }

              await prisma.message.create({
                data: {
                  projectId,
                  chapterNumber,
                  role: "assistant",
                  content: fullResponse,
                },
              })

              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "done", messageId: "stream-complete" }) + "\n"
                )
              )
              controller.close()
            } catch (error) {
              console.error("[Chat API] Stream error:", error)
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "error", content: "Failed to generate response" }) + "\n"
                )
              )
              controller.close()
            }
          },
        })

        return new Response(responseStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
          },
        })
      }
    }

    console.log("[Chat API] Falling back to processUserPrompt (no model or no stream)")
    const { content: agentResponse } = await processUserPrompt(agentContext, content)

    if (
      content.toLowerCase().includes("generate complete") ||
      content.toLowerCase().includes("generate full chapter")
    ) {
      await prisma.chapter.updateMany({
        where: { projectId, chapterNumber },
        data: { content: agentResponse, status: "COMPLETE" },
      })
    }

    await prisma.message.create({
      data: {
        projectId,
        chapterNumber,
        role: "assistant",
        content: agentResponse,
      },
    })

    return NextResponse.json({ success: true, content: agentResponse })
  } catch (error) {
    console.error("[Chat API] Fatal error:", error)
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    )
  }
}
