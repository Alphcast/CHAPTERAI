# ChapterAI — Project Guide

## Tech Stack
- Frontend: Next.js 15+, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- Backend: Next.js Route Handlers, Prisma ORM
- Database: PostgreSQL via Supabase
- AI: AI SDK (OpenAI/Claude/Gemini)
- State: TanStack Query, Zustand
- Forms: React Hook Form + Zod
- Charts: Recharts
- Storage: Supabase Storage

## Commands
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run lint` — Run ESLint
- `npx prisma db push` — Push schema to database
- `npx prisma generate` — Generate Prisma client

## Project Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components organized by feature
- `src/lib/` — Utilities (prisma client, cn helper, statistics)
- `src/agents/` — Multi-agent AI system
- `src/types/` — TypeScript type definitions
- `src/store/` — Zustand stores
- `prisma/schema.prisma` — Database schema

## Agent System Architecture

### Agents (`src/agents/`)
| Agent | File | Role |
|---|---|---|
| Research Planner | `research-planner.ts` | Analyzes topics, outlines chapters, generates Ch.1 |
| Literature Review | `literature-review.ts` | Synthesizes literature, identifies gaps, generates Ch.2 |
| Methodology | `methodology.ts` | Designs methodology, sampling, instruments, generates Ch.3 |
| Analysis | `analysis.ts` | Statistics, hypothesis testing, theme extraction, generates Ch.4 |
| Academic Editor | `academic-editor.ts` | Edits tone, grammar, consistency, generates Ch.5 |
| Citation | `citation.ts` | APA/MLA/Chicago/Harvard/IEEE formatting, generates references |

### Agent Tools
- **`tools/statistics-tools.ts`** — Descriptive stats, correlation, regression, t-test, ANOVA, Chi-Square
- **`tools/citation-formatter.ts`** — Format citations in all 5 styles
- **`tools/editor-tools.ts`** — Word count, paragraph check, academic tone detection

### Orchestrator (`orchestrator.ts`)
- Routes user prompts to the correct agent via intent detection
- Chains agents together (e.g., Analysis → Academic Editor → Citation)
- `processUserPrompt()` — Detects intent, runs primary + secondary agents
- `runChapterAgent()` — Generates complete chapter via appropriate agent
- `runAgentChain()` — Sequential multi-agent processing

### How It Works
1. User sends a message
2. `POST /api/chat` loads project context
3. Orchestrator detects intent (e.g., "write chapter 4" → Analysis Agent)
4. Primary agent generates response using its specialized prompt
5. Secondary agents refine (e.g., Academic Editor polishes, Citation formats)
6. Response streams back to the UI

## Key Conventions
- No authentication required (public dashboard)
- Client components use "use client" directive
- API routes in `src/app/api/`
- All database access through Prisma
- Tailwind CSS v4 with CSS-based configuration
- shadcn/ui components use cn() utility for class merging
