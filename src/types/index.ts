export type ResearchMethodology =
  | "QUANTITATIVE"
  | "QUALITATIVE"
  | "MIXED_METHODS"
  | "EXPERIMENTAL"
  | "SURVEY"
  | "CASE_STUDY"
  | "ACTION_RESEARCH"
  | "DESCRIPTIVE"
  | "CORRELATIONAL"
  | "COMPARATIVE"
  | "SYSTEMATIC_REVIEW"

export type CitationStyle = "APA" | "MLA" | "CHICAGO" | "HARVARD" | "IEEE"

export type AcademicLevel = "UNDERGRADUATE" | "MASTERS" | "PHD"

export type ChapterStatus = "DRAFT" | "GENERATING" | "COMPLETE"

export type AnalysisType = "QUANTITATIVE" | "QUALITATIVE" | "MIXED"

export interface Project {
  id: string
  title: string
  topic: string
  academicLevel: AcademicLevel
  department: string
  institution: string
  country: string
  methodology: ResearchMethodology
  citationStyle: CitationStyle
  createdAt: string
  updatedAt: string
  chapters?: Chapter[]
  messages?: Message[]
}

export interface Chapter {
  id: string
  projectId: string
  chapterNumber: number
  title: string
  content: string
  status: ChapterStatus
}

export interface Message {
  id: string
  projectId: string
  chapterNumber?: number
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
}

export interface Analysis {
  id: string
  projectId: string
  type: AnalysisType
  data: Record<string, unknown>
  results: unknown[]
}

export interface Reference {
  id: string
  projectId: string
  citation: string
  style: CitationStyle
  source: string
}
