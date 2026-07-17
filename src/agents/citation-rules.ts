import type { CitationStyle } from "./types"

export function getCitationRules(style: CitationStyle): string {
  const inText: Record<CitationStyle, string> = {
    APA: `(Author, Year)` ,
    MLA: `(Author Page)`,
    CHICAGO: `(Author Year, Page)`,
    HARVARD: `(Author, Year)`,
    IEEE: `[Number]`,
  }

  const refExamples: Record<CitationStyle, string> = {
    APA: `Smith, J. A. (2023). Title of article. *Journal Name*, *12*(3), 45-67. https://doi.org/10.xxxx`,
    MLA: `Smith, John A. "Title of Article." *Journal Name*, vol. 12, no. 3, 2023, pp. 45-67.`,
    CHICAGO: `Smith, John A. "Title of Article." *Journal Name* 12, no. 3 (2023): 45-67.`,
    HARVARD: `Smith, J.A. (2023) 'Title of article', *Journal Name*, 12(3), pp. 45-67.`,
    IEEE: `[1] J. A. Smith, "Title of article," *Journal Name*, vol. 12, no. 3, pp. 45-67, 2023.`,
  }

  return `
CRITICAL CITATION REQUIREMENTS — YOU MUST FOLLOW THESE IN EVERY PARAGRAPH:

1. EVERY factual claim, statistic, theory, definition, method description, and finding MUST have an in-text citation.
   Format: ${inText[style]}

2. Every in-text citation MUST have a matching entry in the References section at the end.
   Example: ${refExamples[style]}

3. CITE FREQUENTLY — Aim for 2-4 citations per paragraph. Never write a paragraph without citations.
   - Theories → cite the theorist: (Bandura, 1977)
   - Statistics methods → cite the method source: (Cohen, 1988)
   - Findings from other studies → cite the study: (Johnson & Lee, 2022)
   - Definitions → cite the source: (Merriam-Webster, 2023) or scholarly source
   - Research design choices → cite methodology references: (Creswell & Creswell, 2018)

4. Generate 20-30 realistic academic references at the end of the chapter with:
   - 12-18 journal articles (recent, within 5-10 years + some foundational)
   - 4-6 books (textbooks, handbooks, foundational works)
   - 2-4 conference papers, theses, or reports
   - Use REALISTIC author names, journal names, DOIs, page numbers
   - All references MUST correspond to in-text citations used in the chapter

5. DO NOT write sentences like "Research shows that..." without citing WHO showed it.
   BAD:  "Studies have shown that online learning is effective."
   GOOD: "Research has consistently demonstrated the effectiveness of online learning (Means et al., 2013; Singh et al., 2021)."

6. Every table or figure description should cite its source when referencing external data.
`
}
