import { getChatModel, getChapterModel, createStreamResponse } from "@/lib/ai"
import type { Agent, AgentInput, AgentOutput, AgentTool, ToolCall, AgentContext } from "./types"

export function createAgent(params: {
  role: Agent["role"]
  name: string
  description: string
  systemPrompt: (ctx: AgentContext) => string
  tools?: AgentTool[]
}): Agent {
  return {
    role: params.role,
    name: params.name,
    description: params.description,
    systemPrompt: params.systemPrompt,
    tools: params.tools || [],
    async run(input: AgentInput): Promise<AgentOutput> {
      const { context, prompt, options } = input
      const agentCtx = context as AgentContext
      let system = this.systemPrompt(agentCtx)
      const toolCalls: ToolCall[] = []

      // Inject prior chapter content so agents can reference and build upon prior work
      if (agentCtx.generatedChapters && Object.keys(agentCtx.generatedChapters).length > 0) {
        const chaptersContext = Object.entries(agentCtx.generatedChapters)
          .map(([num, content]) => `--- Chapter ${num} (prior work, for reference only — do not repeat) ---\n${content}`)
          .join("\n\n")
        system += `\n\nPRIOR CHAPTERS ALREADY GENERATED (for context and cross-referencing — maintain consistency with these):\n${chaptersContext}`
      }

      const model = options?.model === "chapter" ? getChapterModel() : getChatModel()

      if (model) {
        const toolUseInstructions = this.tools.length > 0
          ? `\n\nYou have access to the following tools:\n${this.tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")}\n`
          : ""

        const finalSystem = system + toolUseInstructions

        const stream = createStreamResponse({
          model,
          system: finalSystem,
          prompt: `${prompt}\n\n${options?.useTools !== false && this.tools.length > 0 ? "Use available tools when appropriate to enhance your response." : ""}`,
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 4096,
        })

        if (stream) {
          let fullContent = ""
          let hasError = false
          for await (const chunk of stream.fullStream) {
            if (chunk.type === "text-delta" && chunk.textDelta) {
              fullContent += chunk.textDelta
            }
            if (chunk.type === "error") {
              console.error("[BaseAgent] Stream error chunk:", JSON.stringify(chunk))
              hasError = true
            }
            if (chunk.type === "tool-call" && chunk.toolName) {
              const tool = this.tools.find((t) => t.name === chunk.toolName)
              if (tool) {
                try {
                  const result = await tool.execute(chunk.args as Record<string, unknown>)
                  toolCalls.push({
                    tool: chunk.toolName,
                    input: chunk.args as Record<string, unknown>,
                    output: result,
                  })
                } catch (err) {
                  toolCalls.push({
                    tool: chunk.toolName,
                    input: chunk.args as Record<string, unknown>,
                    output: { error: String(err) },
                  })
                }
              }
            }
          }

          if (hasError && !fullContent) {
            return { content: "I encountered an error generating a response. Please try again with a shorter message.", toolCalls }
          }

          return { content: fullContent, toolCalls }
        }
      }

      const fallback = generateFallback(params.role, context as unknown as Record<string, unknown>, prompt)
      return { content: fallback, toolCalls }
    },
  }
}

function generateFallback(role: string, context: Record<string, unknown>, prompt: string): string {
  const topic = (context.topic as string) || "this research"
  const level = ((context.academicLevel as string) || "UNDERGRADUATE").toLowerCase()

  const fallbacks: Record<string, string> = {
    "research-planner": `I am acting as the **Research Planner Agent** for the study on "${topic}".

Based on the research topic and context, here is the structured plan:

**Research Overview:**
- Topic: ${topic}
- Academic Level: ${level} level
- Methodology: ${(context.methodology as string)?.replace(/_/g, " ") || "To be determined"}

**Suggested Outline:**
1. Introduction — Background, problem statement, objectives, research questions
2. Literature Review — Conceptual review, theoretical framework, empirical review
3. Methodology — Research design, population, sampling, instrumentation
4. Data Analysis — Descriptive and inferential statistics
5. Discussion, Conclusion, and Recommendations

**Key Considerations:**
- The study should employ appropriate disciplinary terminology
- Research questions should align with the stated objectives
- Hypotheses should be testable and grounded in theory

*Configure OPENROUTER_API_KEY in .env for AI-powered detailed planning.*`,

    "literature-review": `I am acting as the **Literature Review Agent** for "${topic}".

The literature review should be organized as follows:

**Conceptual Framework:**
Define and discuss the key concepts central to this study. Provide conceptual definitions from authoritative sources.

**Theoretical Framework:**
Identify 2-3 theories that provide the theoretical lens for this study. Justify their selection.

**Empirical Review:**
Organize empirical studies thematically. For each study, discuss the methodology and key findings.

**Research Gap:**
Identify gaps in the existing literature that justify the present study.

*Configure OPENROUTER_API_KEY in .env for AI-powered comprehensive literature synthesis.*`,

    "methodology": `I am acting as the **Methodology Agent** for "${topic}".

**Recommended Methodology:**
- Research Design: ${(context.methodology as string)?.replace(/_/g, " ") || "Appropriate design"} 
- Population: Define the target population for this study
- Sample: Calculate appropriate sample size
- Instrument: Develop or adapt appropriate data collection instruments
- Analysis: Use appropriate statistical techniques

*Configure OPENROUTER_API_KEY in .env for AI-powered detailed methodology design.*`,

    "analysis": `I am acting as the **Analysis Agent** for "${topic}".

**Analysis Plan:**
1. Descriptive statistics for demographic and main variables
2. Frequency distributions with percentages
3. Inferential statistics to test hypotheses
4. Interpretation of results in context of research questions

**Available Statistical Tools:**
- Descriptive statistics (mean, median, std dev)
- Frequency distribution tables
- Correlation analysis (Pearson/Spearman)
- Regression analysis
- t-Test and ANOVA
- Chi-Square test

*Configure OPENROUTER_API_KEY in .env for AI-powered statistical analysis with full computations.*`,

    "academic-editor": `I am acting as the **Academic Editor Agent**.

**Editing Checklist:**
1. Academic tone and language appropriate for ${level} level
2. Grammar, spelling, and punctuation
3. Consistent citation style
4. Paragraph structure (3-7 sentences each)
5. Clear topic sentences and transitions
6. Third person passive voice
7. Discipline-specific terminology
8. Logical flow and coherence

*Configure OPENROUTER_API_KEY in .env for AI-powered editing.*`,

    "citation": `I am acting as the **Citation Agent**.

Generate references in ${(context.citationStyle as string) || "APA"} format for "${topic}".

Include 15-20 relevant academic references with proper formatting.

*Configure OPENROUTER_API_KEY in .env for AI-powered citation generation.*`,
  }

  return fallbacks[role] || `**${role}** processing request for "${topic}". Configure OPENROUTER_API_KEY in .env for AI-powered response.`
}
