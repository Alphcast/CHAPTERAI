export interface DescriptiveStats {
  n: number
  mean: number
  median: number
  mode: number[]
  stdDev: number
  variance: number
  min: number
  max: number
  range: number
  sum: number
}

export interface FrequencyTable {
  value: string | number
  frequency: number
  percentage: number
  cumulativeFrequency: number
  cumulativePercentage: number
}

export interface CorrelationResult {
  type: "pearson" | "spearman"
  coefficient: number
  pValue: number
  interpretation: string
}

export interface RegressionResult {
  rSquared: number
  adjustedRSquared: number
  coefficients: { variable: string; coefficient: number; stdError: number; tStat: number; pValue: number }[]
  anova: { ss: number; df: number; ms: number; fStat: number; pValue: number; significance: string }
  equation: string
}

export interface TTestResult {
  type: "independent" | "paired" | "oneSample"
  tStatistic: number
  df: number
  pValue: number
  meanDiff: number
  ci95: [number, number]
  interpretation: string
}

export interface ANOVAResult {
  source: "between" | "within" | "total"
  ss: number
  df: number
  ms: number
  fStat: number
  pValue: number
  interpretation: string
}

export interface ChiSquareResult {
  chiSquare: number
  df: number
  pValue: number
  expectedFrequencies: number[][]
  interpretation: string
}

export function calcDescriptiveStats(data: number[]): DescriptiveStats {
  const sorted = [...data].sort((a, b) => a - b)
  const n = data.length
  const sum = data.reduce((a, b) => a + b, 0)
  const mean = sum / n

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]

  const freqMap = new Map<number, number>()
  data.forEach((v) => freqMap.set(v, (freqMap.get(v) || 0) + 1))
  const maxFreq = Math.max(...freqMap.values())
  const mode = [...freqMap.entries()]
    .filter(([, f]) => f === maxFreq)
    .map(([v]) => v)

  const variance = data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1)
  const stdDev = Math.sqrt(variance)
  const min = sorted[0]
  const max = sorted[n - 1]
  const range = max - min

  return { n, mean, median, mode, stdDev, variance, min, max, range, sum }
}

export function calcFrequencyTable(
  data: (string | number)[],
  bins?: number
): FrequencyTable[] {
  const freqMap = new Map<string | number, number>()
  data.forEach((v) => freqMap.set(v, (freqMap.get(v) || 0) + 1))

  const entries = [...freqMap.entries()].sort((a, b) => {
    if (typeof a[0] === "number" && typeof b[0] === "number") return a[0] - b[0]
    return String(a[0]).localeCompare(String(b[0]))
  })

  const total = data.length
  let cumFreq = 0

  return entries.map(([value, frequency]) => {
    cumFreq += frequency
    return {
      value,
      frequency,
      percentage: (frequency / total) * 100,
      cumulativeFrequency: cumFreq,
      cumulativePercentage: (cumFreq / total) * 100,
    }
  })
}

export function calcPearsonCorrelation(x: number[], y: number[]): CorrelationResult {
  const n = Math.min(x.length, y.length)
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0
  let denX = 0
  let denY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  const r = num / Math.sqrt(denX * denY)
  const tStat = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r)
  const pValue = tDistribution(tStat, n - 2)

  return {
    type: "pearson",
    coefficient: r,
    pValue,
    interpretation: interpretCorrelation(r, pValue),
  }
}

export function calcSpearmanCorrelation(x: number[], y: number[]): CorrelationResult {
  const rankX = rankify(x)
  const rankY = rankify(y)
  return calcPearsonCorrelation(rankX, rankY)
}

function rankify(data: number[]): number[] {
  const sorted = [...data].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
  const ranks = new Array(data.length)

  sorted.forEach((item, idx) => {
    ranks[item.i] = idx + 1
  })

  return ranks
}

function interpretCorrelation(r: number, pValue: number): string {
  const strength = Math.abs(r)
  let desc = ""
  if (strength < 0.1) desc = "negligible"
  else if (strength < 0.3) desc = "weak"
  else if (strength < 0.5) desc = "moderate"
  else if (strength < 0.7) desc = "strong"
  else desc = "very strong"

  const direction = r >= 0 ? "positive" : "negative"
  const sig = pValue <= 0.05 ? "statistically significant" : "not statistically significant"

  return `There is a ${desc} ${direction} correlation (r = ${r.toFixed(3)}, p = ${pValue.toFixed(4)}). The correlation is ${sig}.`
}

export function calcLinearRegression(
  x: number[],
  y: number[]
): RegressionResult {
  const n = Math.min(x.length, y.length)
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    num += dx * (y[i] - meanY)
    den += dx * dx
  }

  const slope = num / den
  const intercept = meanY - slope * meanX

  const yPred = x.map((xi) => intercept + slope * xi)
  const residuals = y.map((yi, i) => yi - yPred[i])

  const ssRes = residuals.reduce((a, b) => a + b * b, 0)
  const ssTot = y.reduce((a, b) => a + (b - meanY) ** 2, 0)
  const ssReg = ssTot - ssRes
  const rSquared = ssReg / ssTot

  const seSlope = Math.sqrt(ssRes / (n - 2)) / Math.sqrt(den)
  const seIntercept = seSlope * Math.sqrt(1 / n + (meanX * meanX) / den)

  const tSlope = slope / seSlope
  const pSlope = tDistribution(tSlope, n - 2)

  const fStat = ssReg / (ssRes / (n - 2))
  const pF = fDistribution(fStat, 1, n - 2)

  return {
    rSquared,
    adjustedRSquared: 1 - (1 - rSquared) * ((n - 1) / (n - 2)),
    coefficients: [
      {
        variable: "Intercept",
        coefficient: intercept,
        stdError: seIntercept,
        tStat: intercept / seIntercept,
        pValue: tDistribution(intercept / seIntercept, n - 2),
      },
      {
        variable: "X",
        coefficient: slope,
        stdError: seSlope,
        tStat: tSlope,
        pValue: pSlope,
      },
    ],
    anova: {
      ss: ssReg,
      df: 1,
      ms: ssReg,
      fStat,
      pValue: pF,
      significance: pF <= 0.05 ? "significant" : "not significant",
    },
    equation: `Y = ${intercept.toFixed(3)} + ${slope.toFixed(3)}X`,
  }
}

export function calcIndependentTTest(
  group1: number[],
  group2: number[]
): TTestResult {
  const n1 = group1.length
  const n2 = group2.length
  const mean1 = group1.reduce((a, b) => a + b, 0) / n1
  const mean2 = group2.reduce((a, b) => a + b, 0) / n2

  const var1 = group1.reduce((a, v) => a + (v - mean1) ** 2, 0) / (n1 - 1)
  const var2 = group2.reduce((a, v) => a + (v - mean2) ** 2, 0) / (n2 - 1)

  const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
  const se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2))
  const tStat = (mean1 - mean2) / se
  const df = n1 + n2 - 2
  const pValue = tDistribution(tStat, df)

  const pooledStd = Math.sqrt(pooledVar)
  const ci95: [number, number] = [
    (mean1 - mean2) - 1.96 * pooledStd * Math.sqrt(1 / n1 + 1 / n2),
    (mean1 - mean2) + 1.96 * pooledStd * Math.sqrt(1 / n1 + 1 / n2),
  ]

  return {
    type: "independent",
    tStatistic: tStat,
    df,
    pValue,
    meanDiff: mean1 - mean2,
    ci95,
    interpretation: `Independent samples t-test shows ${pValue <= 0.05 ? "a statistically significant" : "no statistically significant"} difference between groups (t(${df}) = ${tStat.toFixed(3)}, p = ${pValue.toFixed(4)}).`,
  }
}

export function calcOneWayANOVA(
  groups: number[][]
): ANOVAResult & { groupStats: { label: string; n: number; mean: number; stdDev: number }[] } {
  const k = groups.length
  const allData = groups.flat()
  const n = allData.length
  const grandMean = allData.reduce((a, b) => a + b, 0) / n

  let ssBetween = 0
  let ssWithin = 0

  const groupStats = groups.map((group, i) => {
    const gn = group.length
    const gMean = group.reduce((a, b) => a + b, 0) / gn
    const gVar = group.reduce((a, v) => a + (v - gMean) ** 2, 0)
    ssBetween += gn * (gMean - grandMean) ** 2
    ssWithin += gVar
    return {
      label: `Group ${i + 1}`,
      n: gn,
      mean: gMean,
      stdDev: Math.sqrt(gVar / (gn - 1)),
    }
  })

  const dfBetween = k - 1
  const dfWithin = n - k
  const msBetween = ssBetween / dfBetween
  const msWithin = ssWithin / dfWithin
  const fStat = msBetween / msWithin
  const pValue = fDistribution(fStat, dfBetween, dfWithin)

  return {
    source: "between",
    ss: ssBetween,
    df: dfBetween,
    ms: msBetween,
    fStat,
    pValue,
    interpretation: `One-way ANOVA shows ${pValue <= 0.05 ? "a statistically significant" : "no statistically significant"} difference among groups (F(${dfBetween}, ${dfWithin}) = ${fStat.toFixed(3)}, p = ${pValue.toFixed(4)}).`,
    groupStats,
  }
}

export function calcChiSquare(
  observed: number[][]
): ChiSquareResult {
  const rows = observed.length
  const cols = observed[0].length

  const rowTotals = observed.map((r) => r.reduce((a, b) => a + b, 0))
  const colTotals = observed[0].map((_, j) => observed.reduce((a, r) => a + r[j], 0))
  const total = rowTotals.reduce((a, b) => a + b, 0)

  const expected = observed.map((r, i) =>
    r.map((_, j) => (rowTotals[i] * colTotals[j]) / total)
  )

  let chiSquare = 0
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (expected[i][j] > 0) {
        chiSquare += (observed[i][j] - expected[i][j]) ** 2 / expected[i][j]
      }
    }
  }

  const df = (rows - 1) * (cols - 1)
  const pValue = chiSquareDistribution(chiSquare, df)

  return {
    chiSquare,
    df,
    pValue,
    expectedFrequencies: expected,
    interpretation: `Chi-Square test shows ${pValue <= 0.05 ? "a statistically significant" : "no statistically significant"} association (χ²(${df}) = ${chiSquare.toFixed(3)}, p = ${pValue.toFixed(4)}).`,
  }
}

function tDistribution(t: number, df: number): number {
  const x = (df + t * t) / (df + t * t)
  const a = df / 2
  const b = 0.5
  return 2 * (1 - regularizedIncompleteBeta(x, a, b) / beta(a, b))
}

function fDistribution(f: number, df1: number, df2: number): number {
  const x = (df1 * f) / (df1 * f + df2)
  return 1 - regularizedIncompleteBeta(x, df1 / 2, df2 / 2)
}

function chiSquareDistribution(x: number, df: number): number {
  const p = gamma(df / 2)
  const result = 1 - regularizedIncompleteBeta(x / (x + df), df / 2, 0.5) / p
  return Math.abs(result)
}

function gamma(n: number): number {
  if (n === 1) return 1
  if (n === 0.5) return Math.sqrt(Math.PI)
  return (n - 1) * gamma(n - 1)
}

function regularizedIncompleteBeta(x: number, a: number, b: number, iterations = 100): number {
  if (x < 0 || x > 1) return 0
  if (x === 0 || x === 1) return x

  const lb = logBeta(a, b)
  let sum = 0

  for (let i = 0; i < iterations; i++) {
    const term = (
      Math.exp(
        logGamma(a + b) - logGamma(a + i + 1) - logGamma(b - i) +
        (a + i) * Math.log(x) + (b - i - 1) * Math.log(1 - x) + Math.log(a + i)
      )
    )
    sum += term
    if (Math.abs(term) < 1e-10) break
  }

  return sum * x
}

function logGamma(n: number): number {
  if (n <= 0) return Infinity
  if (n < 0.5) return logGamma(n + 1) - Math.log(n)

  const g = 7
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]

  let x = n - 1
  let tmp = x + g + 0.5
  tmp = (x + 0.5) * Math.log(tmp) - tmp
  let ser = c[0]

  for (let i = 1; i < c.length; i++) {
    x += 1
    ser += c[i] / x
  }

  return tmp + Math.log(2.5066282746310002 * ser)
}

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b)
}

function beta(a: number, b: number): number {
  return Math.exp(logBeta(a, b))
}

export function parseNumericData(raw: Record<string, string>[], column: string): number[] {
  return raw
    .map((row) => parseFloat(row[column]))
    .filter((v) => !isNaN(v))
}

export function parseGroupedData(
  raw: Record<string, string>[],
  valueColumn: string,
  groupColumn: string
): { groups: Record<string, number[]>; groupLabels: string[] } {
  const groups: Record<string, number[]> = {}

  raw.forEach((row) => {
    const group = row[groupColumn] || "Unknown"
    const value = parseFloat(row[valueColumn])
    if (!isNaN(value)) {
      if (!groups[group]) groups[group] = []
      groups[group].push(value)
    }
  })

  return {
    groups,
    groupLabels: Object.keys(groups),
  }
}

export function parseContingencyTable(
  raw: Record<string, string>[],
  rowColumn: string,
  colColumn: string
): { observed: number[][]; rowLabels: string[]; colLabels: string[] } {
  const rows = new Set<string>()
  const cols = new Set<string>()

  raw.forEach((row) => {
    rows.add(row[rowColumn] || "Unknown")
    cols.add(row[colColumn] || "Unknown")
  })

  const rowLabels = [...rows]
  const colLabels = [...cols]
  const matrix: Record<string, Record<string, number>> = {}

  rowLabels.forEach((r) => {
    matrix[r] = {}
    colLabels.forEach((c) => {
      matrix[r][c] = 0
    })
  })

  raw.forEach((row) => {
    const r = row[rowColumn] || "Unknown"
    const c = row[colColumn] || "Unknown"
    if (matrix[r] && matrix[r][c] !== undefined) {
      matrix[r][c]++
    }
  })

  const observed = rowLabels.map((r) => colLabels.map((c) => matrix[r][c]))

  return { observed, rowLabels, colLabels }
}
