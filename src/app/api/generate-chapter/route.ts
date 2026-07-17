import { prisma } from "@/lib/prisma"
import { getChapterModel, createStreamResponse } from "@/lib/ai"
import { getAgentForChapter } from "@/agents"
import type { AgentContext } from "@/agents/types"
import { fetchAndParseProjectUploads, formatUploadsForPrompt } from "@/lib/file-parser"

export const runtime = "nodejs"

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
      return new Response(
        JSON.stringify({ type: "error", content: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
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

    const model = getChapterModel()

    if (model) {
      const agent = getAgentForChapter(chapterNumber)
      const system = agent.systemPrompt(agentContext)

      // For Chapter 4 (Analysis), fetch and parse uploaded research data files
      let uploadDataText = ""
      if (chapterNumber === 4) {
        const uploads = await fetchAndParseProjectUploads(projectId)
        uploadDataText = formatUploadsForPrompt(uploads)
      }

      const prompt = `Generate the complete Chapter ${chapterNumber} for my research on "${project.topic}".
I am a ${project.academicLevel.toLowerCase()} student in ${project.department} at ${project.institution}.
Methodology: ${project.methodology.replace(/_/g, " ")}.
Citation: ${project.citationStyle} style.
Generate comprehensive academic content with all required sections, properly formatted.
${uploadDataText}

CRITICAL CITATION REQUIREMENTS:
- Every factual claim, theory, statistic, method, and finding MUST have an in-text citation (${project.citationStyle} format).
- Every paragraph must contain 2-4 in-text citations. Never write a paragraph without citations.
- Never write "Research shows..." without citing WHO showed it. Always: "According to Smith (2023)..." or "(Smith, 2023)".
- End the chapter with a complete References section containing 20-30 entries.
- Every in-text citation MUST have a matching Reference entry, and every Reference MUST be cited in-text.
- Use realistic author names, journal names, years, DOIs, and page numbers.
${chapterNumber === 4 ? "\nIMPORTANT: Use the uploaded research data above to analyze, interpret, and discuss real findings. Reference specific data points, statistics, and patterns from the uploaded files." : ""}`

      const stream = createStreamResponse({
        model,
        system,
        prompt,
        temperature: 0.7,
        maxTokens: 8192,
      })

      if (stream) {
        let fullContent = ""
        const encoder = new TextEncoder()

        const responseStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream.fullStream) {
                if (chunk.type === "text-delta" && chunk.textDelta) {
                  fullContent += chunk.textDelta
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({ type: "text", content: chunk.textDelta }) + "\n"
                    )
                  )
                } else if (chunk.type === "error") {
                  console.error("[Generate Chapter] Stream error:", JSON.stringify(chunk))
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
              }

              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "done",
                    chapterNumber,
                    contentLength: fullContent.length,
                  }) + "\n"
                )
              )
              controller.close()
            } catch (error) {
              console.error("[Generate Chapter] Stream error:", error)
              await prisma.chapter.updateMany({
                where: { projectId, chapterNumber },
                data: { status: "DRAFT" },
              })
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "error", content: "Failed to generate chapter" }) + "\n"
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

    // Fallback: reset status
    await prisma.chapter.updateMany({
      where: { projectId, chapterNumber },
      data: { status: "DRAFT" },
    })

    return new Response(
      JSON.stringify({ type: "error", content: "No AI model available" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("[Generate Chapter] Fatal error:", error)
    return new Response(
      JSON.stringify({ type: "error", content: "Failed to generate chapter" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
