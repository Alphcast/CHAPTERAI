import type { CitationStyle, CitationFields } from "../types"

export function formatCitation(style: CitationStyle, fields: CitationFields): string {
  switch (style) {
    case "APA":
      return formatAPA(fields)
    case "MLA":
      return formatMLA(fields)
    case "CHICAGO":
      return formatChicago(fields)
    case "HARVARD":
      return formatHarvard(fields)
    case "IEEE":
      return formatIEEE(fields)
    default:
      return formatAPA(fields)
  }
}

export function generateInTextCitation(style: CitationStyle, authors: string, year: string): string {
  switch (style) {
    case "APA":
      return `(${authors}, ${year})`
    case "MLA":
      return `(${authors} ${year})`
    case "CHICAGO":
      return `(${authors} ${year})`
    case "HARVARD":
      return `(${authors}, ${year})`
    case "IEEE":
      return `[${extractNumberFromYear(year)}]`
    default:
      return `(${authors}, ${year})`
  }
}

function extractNumberFromYear(year: string): string {
  const num = parseInt(year)
  return isNaN(num) ? "1" : String(num - 2000 + 1)
}

function formatAPA(f: CitationFields): string {
  const parts = [`${f.authors} (${f.year}).`]
  parts.push(f.title)
  if (f.journal) {
    parts.push(`*${f.journal}*, *${f.volume || ""}*(${f.issue || ""}), ${f.pages || ""}.`)
  } else if (f.publisher) {
    parts.push(`${f.publisher}.`)
  }
  if (f.doi) parts.push(`https://doi.org/${f.doi}`)
  if (f.url && !f.doi) parts.push(f.url)
  return parts.join(" ")
}

function formatMLA(f: CitationFields): string {
  const parts = [`${f.authors}. "${f.title}."`]
  if (f.journal) {
    parts.push(`*${f.journal}*, vol. ${f.volume || ""}, no. ${f.issue || ""}, ${f.year}, pp. ${f.pages || ""}.`)
  } else if (f.publisher) {
    parts.push(`${f.publisher}, ${f.year}.`)
  }
  if (f.doi) parts.push(`doi:${f.doi}`)
  return parts.join(" ")
}

function formatChicago(f: CitationFields): string {
  const parts = [`${f.authors}. "${f.title}."`]
  if (f.journal) {
    parts.push(`*${f.journal}* ${f.volume || ""}, no. ${f.issue || ""} (${f.year}): ${f.pages || ""}.`)
  } else if (f.publisher) {
    parts.push(`${f.publisher}, ${f.year}.`)
  }
  if (f.doi) parts.push(`https://doi.org/${f.doi}`)
  return parts.join(" ")
}

function formatHarvard(f: CitationFields): string {
  const parts = [`${f.authors} (${f.year}).`]
  parts.push(`'${f.title}',`)
  if (f.journal) {
    parts.push(`*${f.journal}*, ${f.volume || ""}(${f.issue || ""}), pp. ${f.pages || ""}.`)
  } else if (f.publisher) {
    parts.push(`${f.publisher}.`)
  }
  if (f.doi) parts.push(`doi:${f.doi}`)
  return parts.join(" ")
}

function formatIEEE(f: CitationFields): string {
  const refNum = extractNumberFromYear(f.year)
  const parts = [`[${refNum}] ${f.authors},`]
  parts.push(`"${f.title},"`)
  if (f.journal) {
    parts.push(`*${f.journal}*, vol. ${f.volume || ""}, no. ${f.issue || ""}, pp. ${f.pages || ""}, ${f.year}.`)
  } else if (f.publisher) {
    parts.push(`${f.publisher}, ${f.year}.`)
  }
  if (f.doi) parts.push(`doi:${f.doi}`)
  return parts.join(" ")
}

export const citationFormatterTool = {
  name: "format-citation",
  description: "Format a citation in APA, MLA, Chicago, Harvard, or IEEE style",
  execute: (input: Record<string, unknown>) => {
    const { style, ...fields } = input as unknown as { style: CitationStyle } & CitationFields
    return formatCitation(style, fields)
  },
}

export const generateInTextTool = {
  name: "generate-intext-citation",
  description: "Generate an in-text citation in the specified style",
  execute: (input: Record<string, unknown>) => {
    const { style, authors, year } = input as unknown as { style: CitationStyle; authors: string; year: string }
    return generateInTextCitation(style, authors, year)
  },
}

export const citationTools = [citationFormatterTool, generateInTextTool]
