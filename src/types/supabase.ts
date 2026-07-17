export interface Database {
  public: {
    Tables: {
      project: {
        Row: {
          id: string
          title: string
          topic: string
          academic_level: "UNDERGRADUATE" | "MASTERS" | "PHD"
          department: string
          institution: string
          country: string
          methodology:
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
          citation_style: "APA" | "MLA" | "CHICAGO" | "HARVARD" | "IEEE"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string
          topic?: string
          academic_level: "UNDERGRADUATE" | "MASTERS" | "PHD"
          department?: string
          institution?: string
          country?: string
          methodology:
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
          citation_style: "APA" | "MLA" | "CHICAGO" | "HARVARD" | "IEEE"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          topic?: string
          academic_level?: "UNDERGRADUATE" | "MASTERS" | "PHD"
          department?: string
          institution?: string
          country?: string
          methodology?:
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
          citation_style?: "APA" | "MLA" | "CHICAGO" | "HARVARD" | "IEEE"
          created_at?: string
          updated_at?: string
        }
      }
      chapter: {
        Row: {
          id: string
          project_id: string
          chapter_number: number
          title: string
          content: string
          status: "DRAFT" | "GENERATING" | "COMPLETE"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          chapter_number: number
          title?: string
          content?: string
          status?: "DRAFT" | "GENERATING" | "COMPLETE"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          chapter_number?: number
          title?: string
          content?: string
          status?: "DRAFT" | "GENERATING" | "COMPLETE"
          created_at?: string
          updated_at?: string
        }
      }
      message: {
        Row: {
          id: string
          project_id: string
          chapter_number: number
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          chapter_number?: number
          role?: string
          content?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          chapter_number?: number
          role?: string
          content?: string
          created_at?: string
        }
      }
      analysis: {
        Row: {
          id: string
          project_id: string
          type: "QUANTITATIVE" | "QUALITATIVE" | "MIXED"
          data: Record<string, unknown>
          results: unknown[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          type: "QUANTITATIVE" | "QUALITATIVE" | "MIXED"
          data?: Record<string, unknown>
          results?: unknown[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          type?: "QUANTITATIVE" | "QUALITATIVE" | "MIXED"
          data?: Record<string, unknown>
          results?: unknown[]
          created_at?: string
          updated_at?: string
        }
      }
      upload: {
        Row: {
          id: string
          project_id: string
          filename: string
          file_url: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          filename?: string
          file_url?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          filename?: string
          file_url?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
      }
      reference: {
        Row: {
          id: string
          project_id: string
          citation: string
          style: "APA" | "MLA" | "CHICAGO" | "HARVARD" | "IEEE"
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          citation?: string
          style: "APA" | "MLA" | "CHICAGO" | "HARVARD" | "IEEE"
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          citation?: string
          style?: "APA" | "MLA" | "CHICAGO" | "HARVARD" | "IEEE"
          source?: string
          created_at?: string
        }
      }
      export: {
        Row: {
          id: string
          project_id: string
          format: string
          file_url: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          format?: string
          file_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          format?: string
          file_url?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
