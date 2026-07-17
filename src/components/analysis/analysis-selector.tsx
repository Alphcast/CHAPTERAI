"use client"

import { useState } from "react"
import { BarChart3, MessageCircle, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisType } from "@/types"
import { QuantitativeAnalysis } from "./quantitative-analysis"
import { QualitativeAnalysis } from "./qualitative-analysis"
import { MixedAnalysis } from "./mixed-analysis"

interface AnalysisSelectorProps {
  projectId: string
}

const analysisTypes: { value: AnalysisType; label: string; icon: typeof BarChart3; desc: string }[] = [
  {
    value: "QUANTITATIVE",
    label: "Quantitative Analysis",
    icon: BarChart3,
    desc: "Statistical analysis, frequency tables, hypothesis testing, regression, ANOVA, and more.",
  },
  {
    value: "QUALITATIVE",
    label: "Qualitative Analysis",
    icon: MessageCircle,
    desc: "Thematic analysis, open coding, axial coding, narrative analysis, and theme extraction.",
  },
  {
    value: "MIXED",
    label: "Mixed Methods Analysis",
    icon: Layers,
    desc: "Integrated quantitative and qualitative findings with data triangulation.",
  },
]

export function AnalysisSelector({ projectId }: AnalysisSelectorProps) {
  const [selectedType, setSelectedType] = useState<AnalysisType | null>(null)

  if (selectedType === "QUANTITATIVE") {
    return <QuantitativeAnalysis projectId={projectId} onBack={() => setSelectedType(null)} />
  }

  if (selectedType === "QUALITATIVE") {
    return <QualitativeAnalysis projectId={projectId} onBack={() => setSelectedType(null)} />
  }

  if (selectedType === "MIXED") {
    return <MixedAnalysis projectId={projectId} onBack={() => setSelectedType(null)} />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <BarChart3 className="h-10 w-10 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Data Analysis</h2>
          <p className="text-muted-foreground">
            Choose your analysis approach based on your research methodology
          </p>
        </div>

        <div className="grid gap-4">
          {analysisTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className="flex items-start gap-4 rounded-xl border p-5 text-left transition-all hover:border-primary hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{type.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{type.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
