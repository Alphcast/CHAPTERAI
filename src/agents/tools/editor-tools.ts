import type { AgentTool } from "../types"

export const wordCountTool: AgentTool = {
  name: "count-words",
  description: "Count the number of words in a text",
  execute: (input: Record<string, unknown>) => {
    const text = input.text as string
    if (!text) return { count: 0 }
    return { count: text.split(/\s+/).filter(Boolean).length }
  },
}

export const checkParagraphLengthTool: AgentTool = {
  name: "check-paragraph-length",
  description: "Check if paragraphs are within recommended academic length (3-7 sentences)",
  execute: (input: Record<string, unknown>) => {
    const text = input.text as string
    if (!text) return { issues: [] }

    const paragraphs = text.split(/\n\s*\n/).filter(Boolean)
    const issues: { paragraph: number; sentenceCount: number; status: string }[] = []

    paragraphs.forEach((p, i) => {
      const sentences = p.split(/[.!?]+/).filter((s) => s.trim().length > 0)
      if (sentences.length < 3) {
        issues.push({ paragraph: i + 1, sentenceCount: sentences.length, status: "too-short" })
      } else if (sentences.length > 10) {
        issues.push({ paragraph: i + 1, sentenceCount: sentences.length, status: "too-long" })
      }
    })

    return { issues, totalParagraphs: paragraphs.length }
  },
}

export const detectAcademicToneTool: AgentTool = {
  name: "detect-academic-tone",
  description: "Detect non-academic language and suggest improvements",
  execute: (input: Record<string, unknown>) => {
    const text = input.text as string
    if (!text) return { issues: [] }

    const informalPatterns = [
      { pattern: /\b(I think|I believe|In my opinion)\b/gi, suggestion: "Use 'The researcher believes' or present as fact" },
      { pattern: /\b(very|really|quite|extremely)\b/gi, suggestion: "Replace with precise academic vocabulary" },
      { pattern: /\b(a lot of|lots of|tons of)\b/gi, suggestion: "Use 'significant number of', 'substantial', 'numerous'" },
      { pattern: /\b(good|bad|nice)\b/gi, suggestion: "Use precise evaluative terms: 'effective', 'significant', 'inadequate'" },
      { pattern: /\b(thing|stuff|something)\b/gi, suggestion: "Use specific terminology" },
      { pattern: /\b(but|so)\b/gi, suggestion: "Use 'however', 'therefore', 'consequently'" },
    ]

    const issues: { found: string; suggestion: string; context: string }[] = []
    const sentences = text.split(/[.!?]+/).filter(Boolean)

    sentences.forEach((sentence) => {
      for (const { pattern, suggestion } of informalPatterns) {
        const match = sentence.match(pattern)
        if (match) {
          issues.push({
            found: match[0],
            suggestion,
            context: sentence.trim().slice(0, 80),
          })
        }
      }
    })

    return {
      issues,
      totalIssues: issues.length,
      assessment: issues.length === 0 ? "Academic tone is appropriate" : `${issues.length} informal elements detected`,
    }
  },
}

export const editorTools: AgentTool[] = [
  wordCountTool,
  checkParagraphLengthTool,
  detectAcademicToneTool,
]
