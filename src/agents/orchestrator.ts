import type { AgentContext, AgentOutput, AgentRole, AgentChain } from "./types"
import { researchPlannerAgent } from "./research-planner"
import { literatureReviewAgent } from "./literature-review"
import { methodologyAgent } from "./methodology"
import { analysisAgent } from "./analysis"
import { academicEditorAgent } from "./academic-editor"
import { citationAgent } from "./citation"
import { getModel, createStreamResponse } from "@/lib/ai"

type AgentInstance = typeof researchPlannerAgent

const agentRegistry: Record<AgentRole, AgentInstance> = {
  "research-planner": researchPlannerAgent,
  "literature-review": literatureReviewAgent,
  "methodology": methodologyAgent,
  "analysis": analysisAgent,
  "academic-editor": academicEditorAgent,
  "citation": citationAgent,
}

const chapterAgentMap: Record<number, AgentRole> = {
  1: "research-planner",
  2: "literature-review",
  3: "methodology",
  4: "analysis",
  5: "academic-editor",
  6: "citation",
  7: "citation",
}

export function getAgentForChapter(chapterNumber: number): AgentInstance {
  const role = chapterAgentMap[chapterNumber] || "research-planner"
  return agentRegistry[role]
}

export function getAgent(role: AgentRole): AgentInstance {
  return agentRegistry[role]
}

export async function runAgent(
  role: AgentRole,
  context: AgentContext,
  prompt: string
): Promise<AgentOutput> {
  const agent = getAgent(role)
  return agent.run({
    context,
    prompt,
    options: { useTools: role === "analysis" || role === "citation" || role === "academic-editor" },
  })
}

export async function runChapterAgent(
  context: AgentContext
): Promise<AgentOutput> {
  const agent = getAgentForChapter(context.chapterNumber)
  return agent.run({
    context,
    prompt: `Generate the complete content for Chapter ${context.chapterNumber} of my research on "${context.topic}". 
Use ${context.citationStyle} style. I am a ${context.academicLevel.toLowerCase()} student in ${context.department}.`,
    options: { useTools: true, temperature: 0.7, maxTokens: 8192, model: "chapter" },
  })
}

export async function runAgentChain(chain: AgentChain): Promise<{
  outputs: Record<AgentRole, AgentOutput>
  finalContent: string
}> {
  const outputs: Record<string, AgentOutput> = {}
  let previousOutput = ""

  for (const role of chain.agents) {
    const agent = getAgent(role)
    const augmentedContext = {
      ...chain.context,
      previousMessages: [
        ...(chain.context.previousMessages || []),
        ...(previousOutput ? [{ role: "assistant" as const, content: previousOutput }] : []),
      ],
    }

    const prompt = previousOutput
      ? `Continue building on the previous work. ${chain.input}\n\nPrevious agent output:\n${previousOutput.slice(0, 2000)}`
      : chain.input

    const output = await agent.run({
      context: augmentedContext,
      prompt,
      options: { useTools: true },
    })

    outputs[role] = output
    previousOutput = output.content
  }

  const finalContent = previousOutput
  return { outputs: outputs as Record<AgentRole, AgentOutput>, finalContent }
}

export function detectIntent(prompt: string): {
  primaryAgent: AgentRole
  secondaryAgents: AgentRole[]
} {
  const lower = prompt.toLowerCase()

  const intentMap: { keywords: string[]; role: AgentRole }[] = [
    { keywords: ["introduction", "chapter 1", "background", "problem statement", "objectives"], role: "research-planner" },
    { keywords: ["literature review", "chapter 2", "theoretical framework", "conceptual", "empirical"], role: "literature-review" },
    { keywords: ["methodology", "chapter 3", "research design", "population", "sample", "instrument"], role: "methodology" },
    { keywords: ["analysis", "chapter 4", "data analysis", "statistics", "hypothesis", "regression", "anova", "correlation", "t-test", "chi"], role: "analysis" },
    { keywords: ["chapter 5", "conclusion", "summary", "recommendation", "editor", "edit", "polish", "proofread"], role: "academic-editor" },
    { keywords: ["citation", "reference", "bibliography", "apa", "mla", "chicago", "harvard", "ieee"], role: "citation" },
  ]

  let primaryAgent: AgentRole = "research-planner"
  let maxScore = 0

  for (const { keywords, role } of intentMap) {
    const score = keywords.filter((k) => lower.includes(k)).length
    if (score > maxScore) {
      maxScore = score
      primaryAgent = role
    }
  }

  const secondaryAgents: AgentRole[] = []
  if (lower.includes("edit") || lower.includes("polish") || lower.includes("proofread")) {
    if (primaryAgent !== "academic-editor") secondaryAgents.push("academic-editor")
  }
  if (lower.includes("citation") || lower.includes("reference")) {
    if (primaryAgent !== "citation") secondaryAgents.push("citation")
  }

  return { primaryAgent, secondaryAgents }
}

export async function processUserPrompt(
  context: AgentContext,
  userPrompt: string
): Promise<AgentOutput & { chainUsed?: AgentRole[] }> {
  const { primaryAgent, secondaryAgents } = detectIntent(userPrompt)

  if (secondaryAgents.length === 0) {
    const output = await runAgent(primaryAgent, context, userPrompt)
    return { ...output, chainUsed: [primaryAgent] }
  }

  const chain: AgentChain = {
    agents: [primaryAgent, ...secondaryAgents],
    context,
    input: userPrompt,
  }

  const result = await runAgentChain(chain)
  return {
    content: result.finalContent,
    chainUsed: chain.agents,
    metadata: {
      primaryAgent,
      secondaryAgents,
      outputs: Object.fromEntries(
        Object.entries(result.outputs).map(([k, v]) => [k, { toolCalls: v.toolCalls }])
      ),
    },
  }
}
