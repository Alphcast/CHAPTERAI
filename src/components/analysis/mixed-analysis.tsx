"use client"

import { useState } from "react"
import { ArrowLeft, Layers, GitMerge, BarChart3, MessageCircle, Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

interface MixedAnalysisProps {
  projectId: string
  onBack: () => void
}

type MixedTab = "quant" | "qual" | "triangulation" | "integrated" | "joint"

export function MixedAnalysis({ projectId, onBack }: MixedAnalysisProps) {
  const [activeTab, setActiveTab] = useState<MixedTab>("quant")
  const [quantData, setQuantData] = useState<Record<string, string>[] | null>(null)
  const [qualText, setQualText] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [columns, setColumns] = useState<string[]>([])

  const tabs: { value: MixedTab; label: string; icon: typeof BarChart3 }[] = [
    { value: "quant", label: "Quantitative Findings", icon: BarChart3 },
    { value: "qual", label: "Qualitative Findings", icon: MessageCircle },
    { value: "triangulation", label: "Data Triangulation", icon: GitMerge },
    { value: "integrated", label: "Integrated Interpretation", icon: Layers },
    { value: "joint", label: "Joint Displays", icon: GitMerge },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet)
        setQuantData(jsonData)
        setColumns(Object.keys(jsonData[0] || {}))
      } catch {
        setResult("Failed to parse file. Please ensure it's a valid CSV or Excel file.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const runIntegrated = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          chapterNumber: 4,
          content: `Perform a mixed methods analysis. Integrate the following quantitative and qualitative findings:

Quantitative Data: ${quantData ? `${quantData.length} rows of data with columns: ${columns.join(", ")}` : "Not provided"}

Qualitative Data: ${qualText ? qualText.slice(0, 1000) : "Not provided"}

Provide:
1. Summary of quantitative findings
2. Summary of qualitative findings
3. Triangulation - where do they converge/diverge?
4. Integrated interpretation
5. Joint display (side-by-side comparison table)`,
        }),
      })
      return res.json()
    },
    onSuccess: (data) => {
      if (data?.content) setResult(data.content)
    },
  })

  const renderTabContent = () => {
    switch (activeTab) {
      case "quant":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload your quantitative dataset (CSV or Excel) to view descriptive statistics
            </p>
            <div className="rounded-xl border-2 border-dashed p-6 text-center hover:border-primary/50 transition-colors">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {quantData && (
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium mb-2">Data Loaded</p>
                <p className="text-muted-foreground">{quantData.length} rows, {columns.length} columns</p>
                <div className="mt-2 overflow-x-auto max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        {columns.slice(0, 6).map((c) => (
                          <th key={c} className="px-2 py-1 text-left">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {quantData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b">
                          {columns.slice(0, 6).map((c) => (
                            <td key={c} className="px-2 py-1">{row[c] || "-"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )

      case "qual":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste your qualitative findings, themes, or interview quotes
            </p>
            <textarea
              value={qualText}
              onChange={(e) => setQualText(e.target.value)}
              placeholder="Paste qualitative findings, themes, codes, and participant quotes here..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring min-h-[200px]"
            />
          </div>
        )

      case "triangulation":
      case "integrated":
      case "joint":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {activeTab === "triangulation" && "Compare quantitative and qualitative findings to identify convergence, divergence, and complementarity."}
              {activeTab === "integrated" && "Generate an integrated interpretation combining both methodological approaches."}
              {activeTab === "joint" && "Create a side-by-side comparison of quantitative and qualitative results."}
            </p>
            <button
              onClick={() => runIntegrated.mutate()}
              disabled={runIntegrated.isPending || !quantData}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {runIntegrated.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                "Generate Mixed Methods Analysis"
              )}
            </button>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b p-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analysis Selection
        </button>
      </div>

      <div className="border-b">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Mixed Methods Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Combine quantitative and qualitative findings for comprehensive analysis
            </p>
          </div>

          {renderTabContent()}

          {result && (
            <div className="rounded-lg border">
              <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm">
                Analysis Results
              </div>
              <div className="p-6 text-sm whitespace-pre-wrap">{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
