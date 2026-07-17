export { researchPlannerAgent } from "./research-planner"
export { literatureReviewAgent } from "./literature-review"
export { methodologyAgent } from "./methodology"
export { analysisAgent } from "./analysis"
export { academicEditorAgent } from "./academic-editor"
export { citationAgent } from "./citation"

export {
  getAgentForChapter,
  getAgent,
  runAgent,
  runChapterAgent,
  runAgentChain,
  processUserPrompt,
  detectIntent,
} from "./orchestrator"

export type { Agent, AgentContext, AgentInput, AgentOutput, AgentRole, AgentTool, AgentChain, ToolCall, CitationFields } from "./types"
