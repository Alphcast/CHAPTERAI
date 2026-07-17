import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

export function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (apiKey) {
    const openrouter = createOpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    })
    return openrouter("openai/gpt-4o")
  }

  return null
}

export function createStreamResponse({
  model,
  system,
  prompt,
}: {
  model: ReturnType<typeof getModel>
  system: string
  prompt: string
}) {
  if (!model) {
    return null
  }

  return streamText({
    model,
    system,
    prompt,
    temperature: 0.7,
    maxTokens: 1000,
  })
}
