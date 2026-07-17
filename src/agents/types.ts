import type { AcademicLevel, ResearchMethodology, CitationStyle } from "@/types"

export type { CitationStyle, AcademicLevel, ResearchMethodology }

export interface AgentContext {
  projectId: string
  topic: string
  academicLevel: AcademicLevel
  methodology: ResearchMethodology
  citationStyle: CitationStyle
  department: string
  institution: string
  country: string
  chapterNumber: number
  previousMessages?: { role: string; content: string }[]
  generatedChapters?: Record<number, string>
}

export interface AgentInput {
  context: AgentContext
  prompt: string
  options?: {
    temperature?: number
    maxTokens?: number
    useTools?: boolean
    model?: "chat" | "chapter"
  }
}

export interface AgentOutput {
  content: string
  metadata?: Record<string, unknown>
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  tool: string
  input: Record<string, unknown>
  output: unknown
}

export interface AgentTool {
  name: string
  description: string
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown
}

export type AgentRole =
  | "research-planner"
  | "literature-review"
  | "methodology"
  | "analysis"
  | "academic-editor"
  | "citation"

export interface Agent {
  role: AgentRole
  name: string
  description: string
  systemPrompt: (ctx: AgentContext) => string
  tools: AgentTool[]
  run: (input: AgentInput) => Promise<AgentOutput>
}

export interface AgentChain {
  agents: AgentRole[]
  context: AgentContext
  input: string
}

export interface CitationFields {
  authors: string
  year: string
  title: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  publisher?: string
  edition?: string
  url?: string
}
