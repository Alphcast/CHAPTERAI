import {
  calcDescriptiveStats,
  calcFrequencyTable,
  calcPearsonCorrelation,
  calcSpearmanCorrelation,
  calcLinearRegression,
  calcIndependentTTest,
  calcOneWayANOVA,
  calcChiSquare,
} from "@/lib/statistics"
import type { AgentTool } from "../types"

export const descriptiveStatsTool: AgentTool = {
  name: "compute-descriptive-stats",
  description: "Compute descriptive statistics (mean, median, mode, std dev, variance, min, max, range) for a numeric array",
  execute: (input: Record<string, unknown>) => {
    const data = input.data as number[]
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { error: "Invalid or empty data array" }
    }
    return calcDescriptiveStats(data)
  },
}

export const frequencyTableTool: AgentTool = {
  name: "compute-frequency-table",
  description: "Compute frequency distribution table with percentages and cumulative frequencies",
  execute: (input: Record<string, unknown>) => {
    const data = input.data as (string | number)[]
    if (!data || !Array.isArray(data)) {
      return { error: "Invalid data array" }
    }
    return calcFrequencyTable(data)
  },
}

export const pearsonCorrelationTool: AgentTool = {
  name: "compute-pearson-correlation",
  description: "Compute Pearson correlation coefficient between two numeric arrays",
  execute: (input: Record<string, unknown>) => {
    const x = input.x as number[]
    const y = input.y as number[]
    if (!x || !y || x.length !== y.length || x.length < 3) {
      return { error: "Need two arrays of equal length with at least 3 values" }
    }
    return calcPearsonCorrelation(x, y)
  },
}

export const spearmanCorrelationTool: AgentTool = {
  name: "compute-spearman-correlation",
  description: "Compute Spearman rank correlation coefficient between two numeric arrays",
  execute: (input: Record<string, unknown>) => {
    const x = input.x as number[]
    const y = input.y as number[]
    if (!x || !y || x.length !== y.length || x.length < 3) {
      return { error: "Need two arrays of equal length with at least 3 values" }
    }
    return calcSpearmanCorrelation(x, y)
  },
}

export const linearRegressionTool: AgentTool = {
  name: "compute-linear-regression",
  description: "Compute linear regression with coefficients, R-squared, and ANOVA table",
  execute: (input: Record<string, unknown>) => {
    const x = input.x as number[]
    const y = input.y as number[]
    if (!x || !y || x.length !== y.length || x.length < 3) {
      return { error: "Need two arrays of equal length with at least 3 values" }
    }
    return calcLinearRegression(x, y)
  },
}

export const tTestTool: AgentTool = {
  name: "compute-independent-ttest",
  description: "Compute independent samples t-test between two groups",
  execute: (input: Record<string, unknown>) => {
    const group1 = input.group1 as number[]
    const group2 = input.group2 as number[]
    if (!group1 || !group2 || group1.length < 2 || group2.length < 2) {
      return { error: "Each group needs at least 2 values" }
    }
    return calcIndependentTTest(group1, group2)
  },
}

export const anovaTool: AgentTool = {
  name: "compute-oneway-anova",
  description: "Compute one-way ANOVA across multiple groups",
  execute: (input: Record<string, unknown>) => {
    const groups = input.groups as number[][]
    if (!groups || groups.length < 2 || groups.some((g) => g.length < 2)) {
      return { error: "Need at least 2 groups with at least 2 values each" }
    }
    return calcOneWayANOVA(groups)
  },
}

export const chiSquareTool: AgentTool = {
  name: "compute-chisquare",
  description: "Compute Chi-Square test for independence on a contingency table",
  execute: (input: Record<string, unknown>) => {
    const observed = input.observed as number[][]
    if (!observed || observed.length < 2 || observed[0].length < 2) {
      return { error: "Need at least 2x2 contingency table" }
    }
    return calcChiSquare(observed)
  },
}

export const statisticsTools: AgentTool[] = [
  descriptiveStatsTool,
  frequencyTableTool,
  pearsonCorrelationTool,
  spearmanCorrelationTool,
  linearRegressionTool,
  tTestTool,
  anovaTool,
  chiSquareTool,
]
