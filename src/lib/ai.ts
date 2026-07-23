import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

let cachedClient: ReturnType<typeof createOpenAI> | null = null

function getApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || null
}

function getClient() {
  if (cachedClient) return cachedClient

  const apiKey = getApiKey()
  if (!apiKey) return null
  cachedClient = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    compatibility: "compatible",
  })
  return cachedClient
}

export function isAIConfigured(): boolean {
  return getClient() !== null
}

export function getAIErrorMessage(): string {
  if (!getApiKey()) {
    return "AI is not configured. Add OPENROUTER_API_KEY (or OPENAI_API_KEY) in Vercel → Settings → Environment Variables, then redeploy."
  }
  return ""
}

export function getChatModel() {
  const client = getClient()
  return client ? client("openai/gpt-4o-mini") : null
}

export function getChapterModel() {
  const client = getClient()
  return client ? client("openai/gpt-4o") : null
}

export function getModel() {
  return getChatModel()
}

export type StreamResult = ReturnType<typeof streamText>

export function createStreamResponse({
  model,
  system,
  prompt,
  temperature = 0.7,
  maxTokens = 4096,
}: {
  model: NonNullable<ReturnType<typeof getChatModel>>
  system: string
  prompt: string
  temperature?: number
  maxTokens?: number
}): StreamResult | null {
  if (!model) return null
  return streamText({ model, system, prompt, temperature, maxTokens })
}
