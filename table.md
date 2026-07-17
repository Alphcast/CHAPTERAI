# ChapterAI — Database Setup Guide (Supabase)

This guide walks you through creating the ChapterAI database **step by step** using the Supabase SQL Editor.

> **Location:** Open your Supabase project → **SQL Editor** → paste each block and click **Run**.

---

## Step 1 — Create Enums (Custom Data Types)

Enums let us restrict fields to a fixed set of values. Run these **one at a time** in order.

### 1.1 ResearchMethodology

```sql
CREATE TYPE "ResearchMethodology" AS ENUM (
  'QUANTITATIVE',
  'QUALITATIVE',
  'MIXED_METHODS',
  'EXPERIMENTAL',
  'SURVEY',
  'CASE_STUDY',
  'ACTION_RESEARCH',
  'DESCRIPTIVE',
  'CORRELATIONAL',
  'COMPARATIVE',
  'SYSTEMATIC_REVIEW'
);
```

This enum stores the 11 research methodologies available when creating a project (e.g., Quantitative, Qualitative, Mixed Methods).

### 1.2 CitationStyle

```sql
CREATE TYPE "CitationStyle" AS ENUM (
  'APA',
  'MLA',
  'CHICAGO',
  'HARVARD',
  'IEEE'
);
```

The 5 citation styles supported for references and chapter formatting.

### 1.3 AcademicLevel

```sql
CREATE TYPE "AcademicLevel" AS ENUM (
  'UNDERGRADUATE',
  'MASTERS',
  'PHD'
);
```

The academic level of the research project — affects writing style and complexity.

### 1.4 ChapterStatus

```sql
CREATE TYPE "ChapterStatus" AS ENUM (
  'DRAFT',
  'GENERATING',
  'COMPLETE'
);
```

Tracks chapter writing progress. Chapters start as `DRAFT`, switch to `GENERATING` while the AI writes them, and become `COMPLETE` when done.

### 1.5 AnalysisType

```sql
CREATE TYPE "AnalysisType" AS ENUM (
  'QUANTITATIVE',
  'QUALITATIVE',
  'MIXED'
);
```

Used by the analysis feature to tag whether an analysis run is quantitative, qualitative, or mixed methods.

---

## Step 2 — Create Tables (in dependency order)

Tables with foreign keys must be created **after** the tables they reference.

### 2.1 project (parent table)

```sql
CREATE TABLE "project" (
  "id"              TEXT                  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "title"           TEXT                  NOT NULL DEFAULT '',
  "topic"           TEXT                  NOT NULL DEFAULT '',
  "academic_level"  "AcademicLevel"       NOT NULL DEFAULT 'UNDERGRADUATE',
  "department"      TEXT                  NOT NULL DEFAULT '',
  "institution"     TEXT                  NOT NULL DEFAULT '',
  "country"         TEXT                  NOT NULL DEFAULT '',
  "methodology"     "ResearchMethodology" NOT NULL DEFAULT 'QUANTITATIVE',
  "citation_style"  "CitationStyle"       NOT NULL DEFAULT 'APA',
  "created_at"      TIMESTAMPTZ          NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ          NOT NULL DEFAULT now()
);
```

**What it stores:** One row per research project. Every other table references this table.

**Key columns:**
- `id` — auto-generated unique ID
- `topic` — the research topic entered by the user
- `academic_level` — controls AI writing tone (undergrad/masters/PhD)
- `methodology` — affects chapter content generation
- `citation_style` — APA/MLA/Chicago/Harvard/IEEE

---

### 2.2 chapter

```sql
CREATE TABLE "chapter" (
  "id"              TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT             NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "chapter_number"  INT              NOT NULL,
  "title"           TEXT             NOT NULL DEFAULT '',
  "content"         TEXT             NOT NULL DEFAULT '',
  "status"          "ChapterStatus"  NOT NULL DEFAULT 'DRAFT',
  "created_at"      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  CONSTRAINT "unique_project_chapter" UNIQUE ("project_id", "chapter_number")
);
```

**What it stores:** The 7 chapters per project (Introduction through Appendices). Each project can have at most one chapter per number.

**Important:** `ON DELETE CASCADE` means deleting a project also deletes all its chapters.

---

### 2.3 message

```sql
CREATE TABLE "message" (
  "id"              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT         NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "chapter_number"  INT          NOT NULL DEFAULT 1,
  "role"            TEXT         NOT NULL DEFAULT 'user',
  "content"         TEXT         NOT NULL DEFAULT '',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**What it stores:** Chat messages between the user and the AI assistant. Used for the streaming chat interface.

**Key columns:**
- `role` — `'user'` or `'assistant'`
- `chapter_number` — which chapter the message belongs to
- `content` — the actual message text

---

### 2.4 analysis

```sql
CREATE TABLE "analysis" (
  "id"              TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT           NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "type"            "AnalysisType" NOT NULL,
  "data"            JSONB         NOT NULL DEFAULT '{}'::JSONB,
  "results"         JSONB         NOT NULL DEFAULT '[]'::JSONB,
  "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
```

**What it stores:** Saved analysis runs. When a user uploads data and runs statistical tests, the inputs and results are saved here.

**Key columns:**
- `type` — quantitative, qualitative, or mixed
- `data` — JSON containing the analysis input (e.g., column selections, test parameters)
- `results` — JSON array of result objects (e.g., correlation coefficients, p-values)

---

### 2.5 upload

```sql
CREATE TABLE "upload" (
  "id"              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT         NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "filename"        TEXT         NOT NULL DEFAULT '',
  "file_url"        TEXT         NOT NULL DEFAULT '',
  "file_type"       TEXT         NOT NULL DEFAULT '',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**What it stores:** Records of uploaded files (XLSX, CSV) for data analysis. The actual file is stored in Supabase Storage; this table tracks the reference.

---

### 2.6 reference

```sql
CREATE TABLE "reference" (
  "id"              TEXT            PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT            NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "citation"        TEXT            NOT NULL DEFAULT '',
  "style"           "CitationStyle" NOT NULL DEFAULT 'APA',
  "source"          TEXT            NOT NULL DEFAULT 'manual',
  "created_at"      TIMESTAMPTZ    NOT NULL DEFAULT now()
);
```

**What it stores:** Auto-generated citations for the project. The AI agent creates these when writing chapters.

**Key columns:**
- `citation` — the full formatted citation text
- `style` — APA/MLA/Chicago/Harvard/IEEE
- `source` — `'generated'` (by AI) or `'manual'` (user-added)

---

### 2.7 export

```sql
CREATE TABLE "export" (
  "id"              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT         NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "format"          TEXT         NOT NULL DEFAULT '',
  "file_url"        TEXT         NOT NULL DEFAULT '',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**What it stores:** Records of exported documents (DOCX, PDF) so users can download them later.

---

## Step 3 — Create Indexes

Indexes speed up queries. Run these all at once (they're independent).

```sql
CREATE INDEX "idx_chapter_project_id"    ON "chapter"("project_id");
CREATE INDEX "idx_message_project_id"    ON "message"("project_id");
CREATE INDEX "idx_message_chapter"       ON "message"("project_id", "chapter_number");
CREATE INDEX "idx_analysis_project_id"   ON "analysis"("project_id");
CREATE INDEX "idx_upload_project_id"     ON "upload"("project_id");
CREATE INDEX "idx_reference_project_id"  ON "reference"("project_id");
CREATE INDEX "idx_export_project_id"     ON "export"("project_id");
CREATE INDEX "idx_project_updated_at"    ON "project"("updated_at" DESC);
CREATE INDEX "idx_chapter_status"        ON "chapter"("project_id", "status");
```

**What they do:** Every foreign key column gets an index (so JOINs are fast). The `updated_at` index sorts projects by last modified. The `chapter_status` index helps the dashboard quickly count generated chapters.

---

## Step 4 — Create `updated_at` Trigger

This automatically updates the `updated_at` column whenever a row changes. Without it, you'd have to manually set `updated_at` in every UPDATE query.

### 4.1 Create the trigger function (run once)

```sql
CREATE OR REPLACE FUNCTION "update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Attach triggers to tables

```sql
CREATE TRIGGER "set_project_updated_at"
  BEFORE UPDATE ON "project"
  FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();

CREATE TRIGGER "set_chapter_updated_at"
  BEFORE UPDATE ON "chapter"
  FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();

CREATE TRIGGER "set_analysis_updated_at"
  BEFORE UPDATE ON "analysis"
  FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
```

Note: `message`, `upload`, `reference`, and `export` don't have `updated_at` columns (they're append-only), so no triggers needed.

---

## Step 5 — Row Level Security (RLS)

ChapterAI is a **public dashboard** with no user logins. RLS is enabled so that when authentication is added later, you just swap the policies — no schema changes needed.

### 5.1 Enable RLS on every table

```sql
ALTER TABLE "project"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chapter"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analysis"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "upload"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "export"    ENABLE ROW LEVEL SECURITY;
```

### 5.2 Grant full public access

```sql
CREATE POLICY "Public full access" ON "project"   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "chapter"   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "message"   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "analysis"  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "upload"    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "reference" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "export"    FOR ALL USING (true) WITH CHECK (true);
```

These policies allow anyone to SELECT, INSERT, UPDATE, and DELETE without authentication. When you add auth later, replace `USING (true)` with `USING (auth.uid() = project_id)` or similar.

---

## Step 6 — Seed Data (Optional)

This inserts sample projects so you can test the app immediately. Only run after all tables exist.

### 6.1 Sample Project 1 — Quantitative

```sql
INSERT INTO "project" ("id", "title", "topic", "academic_level", "department", "institution", "country", "methodology", "citation_style", "created_at", "updated_at")
VALUES (
  'p_sample_001',
  'Impact of Social Media on Student Academic Performance',
  'The Impact of Social Media Usage on the Academic Performance of Undergraduate Students in Nigerian Universities',
  'UNDERGRADUATE',
  'Computer Science',
  'University of Lagos',
  'Nigeria',
  'QUANTITATIVE',
  'APA',
  '2026-06-01T10:00:00Z',
  '2026-06-15T14:30:00Z'
);
```

### 6.2 Chapters for Project 1

```sql
INSERT INTO "chapter" ("id", "project_id", "chapter_number", "title", "content", "status", "created_at", "updated_at") VALUES
  ('ch_sample_001_1', 'p_sample_001', 1, 'Introduction', 'Social media has become an integral part of daily life for university students...', 'COMPLETE', '2026-06-05T08:00:00Z', '2026-06-05T08:00:00Z'),
  ('ch_sample_001_2', 'p_sample_001', 2, 'Literature Review', 'The relationship between social media usage and academic performance has been extensively studied...', 'COMPLETE', '2026-06-07T10:00:00Z', '2026-06-07T10:00:00Z'),
  ('ch_sample_001_3', 'p_sample_001', 3, 'Methodology', 'This study employs a quantitative research design using a cross-sectional survey approach...', 'COMPLETE', '2026-06-09T09:00:00Z', '2026-06-09T09:00:00Z'),
  ('ch_sample_001_4', 'p_sample_001', 4, 'Data Analysis', 'This chapter presents the analysis of data collected from 200 undergraduate students...', 'COMPLETE', '2026-06-11T11:00:00Z', '2026-06-11T11:00:00Z'),
  ('ch_sample_001_5', 'p_sample_001', 5, 'Summary and Conclusion', 'This study investigated the impact of social media usage on the academic performance...', 'COMPLETE', '2026-06-13T08:00:00Z', '2026-06-13T08:00:00Z');
```

### 6.3 Messages for Project 1

```sql
INSERT INTO "message" ("id", "project_id", "chapter_number", "role", "content", "created_at") VALUES
  ('msg_sample_001_1', 'p_sample_001', 1, 'user',     'Help me write the introduction for my research on social media and academic performance.',                    '2026-06-04T08:00:00Z'),
  ('msg_sample_001_2', 'p_sample_001', 1, 'assistant', 'I''ll help you write Chapter 1 (Introduction). Let me start with the background of the study, problem statement, and research objectives.', '2026-06-04T08:01:00Z');
```

### 6.4 References for Project 1

```sql
INSERT INTO "reference" ("id", "project_id", "citation", "style", "source", "created_at") VALUES
  ('ref_sample_001_1', 'p_sample_001', 'Junco, R. (2012). The relationship between frequency of Facebook use, participation in Facebook activities, and student engagement. Computers & Education, 58(1), 162-171.', 'APA', 'generated', '2026-06-15T10:00:00Z'),
  ('ref_sample_001_2', 'p_sample_001', 'Kirschner, P. A., & Karpinski, A. C. (2010). Facebook and academic performance. Computers in Human Behavior, 26(6), 1237-1245.', 'APA', 'generated', '2026-06-15T10:00:00Z'),
  ('ref_sample_001_3', 'p_sample_001', 'Tess, P. A. (2013). The role of social media in higher education classes. Computers & Education, 62, 146-162.', 'APA', 'generated', '2026-06-15T10:00:00Z'),
  ('ref_sample_001_4', 'p_sample_001', 'Adeyinka, T., & Mutula, S. (2019). Social media and academic performance: A study of Nigerian universities. Journal of Information Science, 45(3), 345-358.', 'APA', 'generated', '2026-06-15T10:00:00Z'),
  ('ref_sample_001_5', 'p_sample_001', 'Katz, E., Blumler, J. G., & Gurevitch, M. (1973). Uses and gratifications research. Public Opinion Quarterly, 37(4), 509-523.', 'APA', 'generated', '2026-06-15T10:00:00Z');
```

### 6.5 Sample Project 2 — Qualitative (shorter demo)

```sql
INSERT INTO "project" ("id", "title", "topic", "academic_level", "department", "institution", "country", "methodology", "citation_style", "created_at", "updated_at")
VALUES (
  'p_sample_002',
  'Teacher Perceptions of AI in Education',
  'Exploring Teacher Perceptions of Artificial Intelligence Integration in Secondary School Classrooms',
  'MASTERS',
  'Education',
  'University of Cape Town',
  'South Africa',
  'QUALITATIVE',
  'APA',
  '2026-06-10T09:00:00Z',
  '2026-06-12T16:00:00Z'
);

INSERT INTO "chapter" ("id", "project_id", "chapter_number", "title", "content", "status", "created_at", "updated_at") VALUES
  ('ch_sample_002_1', 'p_sample_002', 1, 'Introduction', 'Artificial intelligence (AI) is transforming educational landscapes globally...', 'COMPLETE', '2026-06-12T08:00:00Z', '2026-06-12T08:00:00Z'),
  ('ch_sample_002_2', 'p_sample_002', 2, 'Literature Review', 'The integration of AI in education has been a topic of growing scholarly interest...', 'DRAFT', '2026-06-12T10:00:00Z', '2026-06-12T10:00:00Z'),
  ('ch_sample_002_3', 'p_sample_002', 3, 'Methodology', 'This study adopts a qualitative phenomenological research design...', 'DRAFT', '2026-06-12T14:00:00Z', '2026-06-12T14:00:00Z');
```

---

## Visual Summary

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   project   │────→│   chapter   │     │   message   │
│  (parent)   │     │  1 per num  │     │ chat per    │
└──────┬──────┘     │  /project   │     │ chapter     │
       │            └─────────────┘     └─────────────┘
       │                   
       │            ┌─────────────┐     ┌─────────────┐
       ├───────────→│  analysis   │     │   upload    │
       │            │ results+    │     │ file refs   │
       │            │ data json   │     └─────────────┘
       │            └─────────────┘
       │                    
       │            ┌─────────────┐     ┌─────────────┐
       ├───────────→│  reference  │     │   export    │
       │            │ citations   │     │ docx/pdf    │
       │            └─────────────┘     └─────────────┘
       │
       └──── 6 child tables, all ON DELETE CASCADE
```

Each arrow represents a `project_id` foreign key. Deleting a project removes all related rows automatically.
