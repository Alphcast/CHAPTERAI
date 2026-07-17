"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, FileText, Trash2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
  ResearchMethodology,
  CitationStyle,
  AcademicLevel,
} from "@/types"

interface CreateResearchModalProps {
  onClose: () => void
}

const methodologies: { value: ResearchMethodology; label: string }[] = [
  { value: "QUANTITATIVE", label: "Quantitative Research" },
  { value: "QUALITATIVE", label: "Qualitative Research" },
  { value: "MIXED_METHODS", label: "Mixed Methods Research" },
  { value: "EXPERIMENTAL", label: "Experimental Research" },
  { value: "SURVEY", label: "Survey Research" },
  { value: "CASE_STUDY", label: "Case Study Research" },
  { value: "ACTION_RESEARCH", label: "Action Research" },
  { value: "DESCRIPTIVE", label: "Descriptive Research" },
  { value: "CORRELATIONAL", label: "Correlational Research" },
  { value: "COMPARATIVE", label: "Comparative Research" },
  { value: "SYSTEMATIC_REVIEW", label: "Systematic Literature Review" },
]

const citationStyles: { value: CitationStyle; label: string }[] = [
  { value: "APA", label: "APA 7th Edition" },
  { value: "MLA", label: "MLA" },
  { value: "CHICAGO", label: "Chicago" },
  { value: "HARVARD", label: "Harvard" },
  { value: "IEEE", label: "IEEE" },
]

const academicLevels: { value: AcademicLevel; label: string }[] = [
  { value: "UNDERGRADUATE", label: "Undergraduate" },
  { value: "MASTERS", label: "Master's" },
  { value: "PHD", label: "PhD / Doctoral" },
]

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CreateResearchModal({ onClose }: CreateResearchModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [topic, setTopic] = useState("")
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>("UNDERGRADUATE")
  const [department, setDepartment] = useState("")
  const [institution, setInstitution] = useState("")
  const [country, setCountry] = useState("")
  const [methodology, setMethodology] = useState<ResearchMethodology>("QUANTITATIVE")
  const [citationStyle, setCitationStyle] = useState<CitationStyle>("APA")
  const [files, setFiles] = useState<File[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter((file) => {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported file type`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 10MB limit`)
        return false
      }
      return true
    })
    setFiles((prev) => [...prev, ...validFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (projectId: string) => {
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("projectId", projectId)
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
    }
  }

  const createProject = useMutation({
    mutationFn: async (data: {
      topic: string
      academicLevel: AcademicLevel
      department: string
      institution: string
      country: string
      methodology: ResearchMethodology
      citationStyle: CitationStyle
    }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create project")
      return res.json()
    },
    onSuccess: async (data) => {
      if (files.length > 0) {
        await uploadFiles(data.id)
      }
      toast.success("Research project created!")
      router.push(`/dashboard/research/${data.id}`)
    },
    onError: () => {
      toast.error("Failed to create project. Please try again.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createProject.mutate({
      topic,
      academicLevel,
      department,
      institution,
      country,
      methodology,
      citationStyle,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-xl bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold mb-1">New Research Project</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Fill in the details below to create your research project
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Research Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Impact of Social Media on Academic Performance"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring min-h-[80px]"
              required
            />

            <div className="mt-3">
              <label className="text-sm font-medium text-muted-foreground">
                Attach Research Files (Optional)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload documents, data, or guidelines to help AI understand your research
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors w-full justify-center"
              >
                <Plus className="h-4 w-4" />
                <span>Add files</span>
              </button>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Academic Level</label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {academicLevels.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Citation Style</label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {citationStyles.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Methodology</label>
            <select
              value={methodology}
              onChange={(e) => setMethodology(e.target.value as ResearchMethodology)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            >
              {methodologies.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Computer Science"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Institution</label>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g., University of Lagos"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g., Nigeria"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              required
            />
          </div>

          <button
            type="submit"
            disabled={createProject.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createProject.isPending ? "Creating..." : "Create Research Project"}
          </button>
        </form>
      </div>
    </div>
  )
}
