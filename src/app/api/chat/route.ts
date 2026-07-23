import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getChatModel,
  getChapterModel,
  createStreamResponse,
  isAIConfigured,
  getAIErrorMessage,
} from "@/lib/ai"
import { getAgentForChapter } from "@/agents"
import type { AgentContext } from "@/agents/types"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log("[CHAT-1] Request received")

  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      console.error("[CHAT-1] Failed to parse request body")
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const projectId = body.projectId as string | undefined
    const chapterNumber = body.chapterNumber as number | undefined
    const content = body.content as string | undefined

    console.log("[CHAT-2] Request body parsed:", {
      projectId: !!projectId,
      chapterNumber: !!chapterNumber,
      contentLength: content?.length ?? 0,
    })

    if (!projectId || !chapterNumber || !content) {
      console.error("[CHAT-3] Validation failed:", {
        projectId: !!projectId,
        chapterNumber: !!chapterNumber,
        content: !!content,
      })
      return NextResponse.json(
        {
          error: `Missing required fields. projectId: ${!!projectId}, chapterNumber: ${!!chapterNumber}, content: ${!!content}`,
        },
        { status: 400 }
      )
    }

    console.log("[CHAT-3] Validation passed. projectId=%s chapter=%d contentLength=%d", projectId, chapterNumber, content.length)

    console.log("[CHAT-4] Prisma client initialized:", !!prisma)

    let project
    try {
      console.log("[CHAT-5] Project lookup started")
      project = await prisma.project.findUnique({
        where: { id: projectId },
      })
    } catch (dbError) {
      console.error("[CHAT-5] DATABASE ERROR during project lookup:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed. Check DATABASE_URL in Vercel environment variables.",
        },
        { status: 500 }
      )
    }

    if (!project) {
      console.error("[CHAT-5] Project not found:", projectId)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log("[CHAT-6] Project found:", project.topic)

    try {
      console.log("[CHAT-7] Saving user message")
      await prisma.message.create({
        data: { projectId, chapterNumber, role: "user", content },
      })
    } catch (dbError) {
      console.error("[CHAT-7] DATABASE ERROR saving user message:", dbError)
      return NextResponse.json(
        { error: "Failed to save message to database." },
        { status: 500 }
      )
    }

    console.log("[CHAT-7] User message saved")

    let previousMessages
    try {
      console.log("[CHAT-8] Loading previous messages")
      previousMessages = await prisma.message.findMany({
        where: { projectId, chapterNumber },
        orderBy: { createdAt: "asc" },
        take: 20,
      })
    } catch (dbError) {
      console.error("[CHAT-8] DATABASE ERROR loading messages:", dbError)
      return NextResponse.json(
        { error: "Failed to load message history." },
        { status: 500 }
      )
    }

    console.log("[CHAT-8] Previous messages loaded:", previousMessages.length)

    let completedChapters: Awaited<ReturnType<typeof prisma.chapter.findMany>> = []
    try {
      console.log("[CHAT-9] Loading chapter context")
      completedChapters = await prisma.chapter.findMany({
        where: { projectId, status: "COMPLETE" },
        orderBy: { chapterNumber: "asc" },
      })
    } catch (dbError) {
      console.error("[CHAT-9] DATABASE ERROR loading chapters:", dbError)
      completedChapters = []
    }

    const generatedChapters: Record<number, string> = {}
    for (const ch of completedChapters) {
      if (ch.chapterNumber !== chapterNumber && ch.content) {
        generatedChapters[ch.chapterNumber] = ch.content.slice(0, 3000)
      }
    }

    console.log("[CHAT-9] Chapter context loaded:", Object.keys(generatedChapters).length, "completed chapters")

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
      previousMessages: previousMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      generatedChapters,
    }

    console.log("[CHAT-10] Agent context created")

    const isFullChapterRequest =
      content.toLowerCase().includes("generate complete") ||
      content.toLowerCase().includes("write chapter") ||
      content.toLowerCase().includes("generate full chapter")

    const agent = getAgentForChapter(chapterNumber)
    const system = agent.systemPrompt(agentContext)

    let prompt = content

    let uploadDataText = ""
    if (chapterNumber === 4) {
      try {
        console.log("[CHAT-10b] Loading chapter 4 uploads (lazy import)")
        const { fetchAndParseProjectUploads, formatUploadsForPrompt } = await import(
          "@/lib/file-parser"
        )
        const uploads = await fetchAndParseProjectUploads(projectId)
        uploadDataText = formatUploadsForPrompt(uploads)
        console.log("[CHAT-10b] Upload data loaded:", uploadDataText.length, "chars")
      } catch (uploadError) {
        console.error("[CHAT-10b] Upload parsing error (non-fatal):", uploadError)
      }
    }

    if (isFullChapterRequest) {
      prompt = `Generate the complete content for Chapter ${chapterNumber} of my research on "${project.topic}".
Use ${project.citationStyle} citation style throughout.
I am a ${project.academicLevel.toLowerCase()} student in ${project.department} at ${project.institution}.
My research uses ${project.methodology.replace(/_/g, " ")} methodology.
Please generate comprehensive, well-structured academic content with all required sections properly formatted.
${uploadDataText}

CRITICAL CITATION REQUIREMENTS:
- Every factual claim, theory, statistic, method, and finding MUST have an in-text citation (${project.citationStyle} format).
- Every paragraph must contain 2-4 in-text citations. Never write a paragraph without citations.
- Never write "Research shows..." without citing WHO showed it. Always: "According to Smith (2023)..." or "(Smith, 2023)".
- End the chapter with a complete References section containing 20-30 entries.
- Every in-text citation MUST have a matching Reference entry, and every Reference MUST be cited in-text.
- Use realistic author names, journal names, years, DOIs, and page numbers.

IMPORTANT: Use the uploaded research data above to analyze, interpret, and discuss real findings. Reference specific data points, statistics, and patterns from the uploaded files.`
    } else if (chapterNumber === 4 && uploadDataText) {
      prompt = `${content}${uploadDataText}

Analyze, interpret, and discuss the above uploaded data in your response. Reference specific findings from the data.`
    }

    const apiKeyPresent =
      !!process.env.OPENROUTER_API_KEY || !!process.env.OPENAI_API_KEY
    console.log("[CHAT-11] AI model initialization started. API key present:", apiKeyPresent)

    const model = isFullChapterRequest ? getChapterModel() : getChatModel()
    console.log("[CHAT-12] AI model initialized:", !!model)

    if (!model) {
      const errorMsg = getAIErrorMessage()
      console.error("[CHAT-12] Model is null. AI not configured.")
      return NextResponse.json(
        {
          error:
            errorMsg ||
            "AI model could not be initialized. Add OPENROUTER_API_KEY in Vercel.",
        },
        { status: 503 }
      )
    }

    console.log("[CHAT-13] OpenRouter request started")
    const stream = createStreamResponse({
      model,
      system,
      prompt,
      temperature: 0.7,
      maxTokens: isFullChapterRequest ? 8192 : 2048,
    })

    if (!stream) {
      console.error("[CHAT-13] createStreamResponse returned null")
      return NextResponse.json(
        { error: "Failed to initialize AI stream." },
        { status: 500 }
      )
    }

    console.log("[CHAT-13] Stream created, beginning iteration")

    const encoder = new TextEncoder()
    let fullResponse = ""
    let hasStreamError = false

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      try {
        let chunkCount = 0
        for await (const chunk of stream.fullStream) {
          chunkCount++

          if (chunk.type === "text-delta" && chunk.textDelta) {
            if (chunkCount === 1) {
              console.log("[CHAT-14] First AI chunk received")
            }
            fullResponse += chunk.textDelta
            await writer.write(
              encoder.encode(
                JSON.stringify({ type: "text", content: chunk.textDelta }) + "\n"
              )
            )
          } else if (chunk.type === "error") {
            const errorObj = (chunk as { error?: unknown }).error
            const errorMsg =
              errorObj instanceof Error
                ? errorObj.message
                : JSON.stringify(errorObj)
            console.error("[CHAT-14] Stream error chunk:", errorMsg)
            hasStreamError = true
            await writer.write(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  content: `AI provider error: ${errorMsg}`,
                }) + "\n"
              )
            )
            break
          } else if (chunk.type === "step-finish") {
            console.log(
              "[CHAT-14] Step finished:",
              (chunk as { finishReason?: string }).finishReason
            )
          }
        }

        console.log(
          "[CHAT-15] AI stream completed. chunks=%d length=%d error=%s",
          chunkCount,
          fullResponse.length,
          hasStreamError
        )

        if (!hasStreamError && fullResponse.length === 0) {
          console.error("[CHAT-15] AI returned empty response")
          await writer.write(
            encoder.encode(
              JSON.stringify({
                type: "error",
                content: "AI returned an empty response. Try a different message.",
              }) + "\n"
            )
          )
        } else if (!hasStreamError && fullResponse.length > 0) {
          try {
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

            console.log("[CHAT-16] Assistant response saved")
          } catch (saveError) {
            console.error("[CHAT-16] Failed to save assistant response:", saveError)
          }

          await writer.write(
            encoder.encode(
              JSON.stringify({
                type: "done",
                messageId: "stream-complete",
              }) + "\n"
            )
          )

          console.log(
            "[CHAT-16] === Request complete === %dms",
            Date.now() - startTime
          )
        }
      } catch (error) {
        console.error("[CHAT-15] Stream processing error:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Unknown stream error"
        try {
          await writer.write(
            encoder.encode(
              JSON.stringify({ type: "error", content: errorMessage }) + "\n"
            )
          )
        } catch {
          // Writer already closed
        }
      } finally {
        try {
          await writer.close()
        } catch {
          // Already closed
        }
      }
    })()

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    console.error("[CHAT-FATAL]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    const message =
      error instanceof Error ? error.message : "Internal chat server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
