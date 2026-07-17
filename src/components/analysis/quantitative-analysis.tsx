"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, Upload, Table, Sigma, Loader2, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"
import { useMutation } from "@tanstack/react-query"
import { ResultsTable } from "./results-table"
import { cn } from "@/lib/utils"

interface QuantitativeAnalysisProps {
  projectId: string
  onBack: () => void
}

type AnalysisType = "descriptive" | "frequency" | "correlation" | "regression" | "ttest" | "anova" | "chisquare"

const ANALYSIS_TYPES: { value: AnalysisType; label: string; icon: typeof Sigma; desc: string; requires: string[] }[] = [
  { value: "descriptive", label: "Descriptive Statistics", icon: Sigma, desc: "Mean, median, mode, std dev, variance, min, max", requires: ["value"] },
  { value: "frequency", label: "Frequency Distribution", icon: Table, desc: "Counts, percentages, cumulative frequencies with bar chart", requires: ["value"] },
  { value: "correlation", label: "Correlation Analysis", icon: Sigma, desc: "Pearson and Spearman correlation coefficients", requires: ["x", "y"] },
  { value: "regression", label: "Regression Analysis", icon: Sigma, desc: "Linear regression with coefficients and ANOVA", requires: ["x", "y"] },
  { value: "ttest", label: "Independent t-Test", icon: Sigma, desc: "Compare means between two groups", requires: ["value", "group"] },
  { value: "anova", label: "One-Way ANOVA", icon: Sigma, desc: "Compare means across multiple groups", requires: ["value", "group"] },
  { value: "chisquare", label: "Chi-Square Test", icon: Sigma, desc: "Test association between categorical variables", requires: ["row", "col"] },
]

export function QuantitativeAnalysis({ projectId, onBack }: QuantitativeAnalysisProps) {
  const [rawData, setRawData] = useState<Record<string, string>[] | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [fileName, setFileName] = useState("")
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState("")

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setFileName(file.name)
    setResult(null)
    setAnalysisType(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet)

        if (jsonData.length === 0) {
          setError("The file appears to be empty.")
          return
        }

        setRawData(jsonData)
        setColumns(Object.keys(jsonData[0]))
      } catch {
        setError("Failed to parse file. Please ensure it's a valid CSV or Excel file.")
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const runAnalysis = useMutation({
    mutationFn: async () => {
      if (!rawData || !analysisType) return null

      const res = await fetch("/api/analysis/quantitative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: analysisType,
          data: rawData,
          columns: selectedColumns,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Analysis failed")
      }

      return res.json()
    },
    onSuccess: (data) => {
      if (data) setResult(data)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Analysis failed")
    },
  })

  const handleColumnSelect = (key: string, value: string) => {
    setSelectedColumns((prev) => ({ ...prev, [key]: value }))
  }

  const renderColumnSelector = () => {
    if (!analysisType) return null

    const config = ANALYSIS_TYPES.find((a) => a.value === analysisType)
    if (!config) return null

    const columnLabels: Record<string, string> = {
      value: "Value Column (numeric)",
      x: "X Variable (independent)",
      y: "Y Variable (dependent)",
      group: "Group Column (categorical)",
      row: "Row Variable",
      col: "Column Variable",
    }

    return (
      <div className="rounded-lg border p-4 space-y-3">
        <p className="font-semibold text-sm">Select Columns</p>
        {config.requires.map((req) => (
          <div key={req}>
            <label className="text-xs text-muted-foreground">{columnLabels[req] || req}</label>
            <select
              value={selectedColumns[req] || ""}
              onChange={(e) => handleColumnSelect(req, e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            >
              <option value="">Select column...</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
        <button
          onClick={() => runAnalysis.mutate()}
          disabled={runAnalysis.isPending || config.requires.some((r) => !selectedColumns[r])}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {runAnalysis.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Analysis...
            </span>
          ) : (
            "Run Analysis"
          )}
        </button>
      </div>
    )
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Quantitative Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Upload your CSV or Excel file, then select an analysis type
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="rounded-xl border-2 border-dashed p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">
              {fileName ? `File: ${fileName}` : "Upload your data file"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports CSV and Excel (.xlsx) files with headers in the first row
            </p>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {rawData && (
              <p className="mt-2 text-sm text-muted-foreground">
                {rawData.length} rows loaded | {columns.length} columns detected
              </p>
            )}
          </div>

          {rawData && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ANALYSIS_TYPES.map((at) => {
                  const Icon = at.icon
                  return (
                    <button
                      key={at.value}
                      onClick={() => {
                        setAnalysisType(at.value)
                        setResult(null)
                        setSelectedColumns({})
                      }}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                        analysisType === at.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                    >
                      <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{at.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{at.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  {renderColumnSelector()}
                </div>
                <div className="lg:col-span-2">
                  {result && <ResultsTable result={result} onBack={() => setResult(null)} />}
                </div>
              </div>

              {columns.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm flex items-center gap-2">
                    <Table className="h-4 w-4 text-primary" />
                    Data Preview ({rawData.length} rows)
                  </div>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          {columns.slice(0, 8).map((col) => (
                            <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawData.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-b hover:bg-muted/20">
                            {columns.slice(0, 8).map((col) => (
                              <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-[150px] truncate">
                                {row[col] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
