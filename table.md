# ChapterAI — Supabase Table Editor Guide

## Quick Start: Paste SQL in Supabase SQL Editor

Go to **Supabase Dashboard → SQL Editor → New Query**, paste the entire block below, and click **Run**.

```sql
-- ============================================
-- ChapterAI Database Schema
-- Paste this into Supabase SQL Editor → Run
-- ============================================

-- Enums
CREATE TYPE academic_level AS ENUM ('UNDERGRADUATE', 'MASTERS', 'PHD');

CREATE TYPE research_methodology AS ENUM (
  'QUANTITATIVE', 'QUALITATIVE', 'MIXED_METHODS',
  'EXPERIMENTAL', 'SURVEY', 'CASE_STUDY',
  'ACTION_RESEARCH', 'DESCRIPTIVE', 'CORRELATIONAL',
  'COMPARATIVE', 'SYSTEMATIC_REVIEW'
);

CREATE TYPE citation_style AS ENUM ('APA', 'MLA', 'CHICAGO', 'HARVARD', 'IEEE');

CREATE TYPE chapter_status AS ENUM ('DRAFT', 'GENERATING', 'COMPLETE');

CREATE TYPE analysis_type AS ENUM ('QUANTITATIVE', 'QUALITATIVE', 'MIXED');

-- ============================================
-- Tables
-- ============================================

-- 1. Project (top-level container)
CREATE TABLE project (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title         TEXT NOT NULL DEFAULT '',
  topic         TEXT NOT NULL DEFAULT '',
  academic_level academic_level NOT NULL,
  department    TEXT NOT NULL DEFAULT '',
  institution   TEXT NOT NULL DEFAULT '',
  country       TEXT NOT NULL DEFAULT '',
  methodology   research_methodology NOT NULL,
  citation_style citation_style NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Chapter
CREATE TABLE chapter (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id     TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title          TEXT NOT NULL DEFAULT '',
  content        TEXT NOT NULL DEFAULT '',
  status         chapter_status NOT NULL DEFAULT 'DRAFT',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, chapter_number)
);

-- 3. Message
CREATE TABLE message (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id     TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL DEFAULT 1,
  role           TEXT NOT NULL DEFAULT 'user',
  content        TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Analysis
CREATE TABLE analysis (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  type       analysis_type NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  results    JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Upload
CREATE TABLE upload (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL DEFAULT '',
  file_url   TEXT NOT NULL DEFAULT '',
  file_type  TEXT NOT NULL DEFAULT '',
  file_size  INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Reference
CREATE TABLE reference (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  citation   TEXT NOT NULL DEFAULT '',
  style      citation_style NOT NULL,
  source     TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Export
CREATE TABLE export (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  format     TEXT NOT NULL DEFAULT '',
  file_url   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_chapter_project     ON chapter(project_id);
CREATE INDEX idx_message_project     ON message(project_id);
CREATE INDEX idx_analysis_project    ON analysis(project_id);
CREATE INDEX idx_upload_project      ON upload(project_id);
CREATE INDEX idx_reference_project   ON reference(project_id);
CREATE INDEX idx_export_project      ON export(project_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_project_updated BEFORE UPDATE ON project
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chapter_updated BEFORE UPDATE ON chapter
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_analysis_updated BEFORE UPDATE ON analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Creating Tables One-by-One in Table Editor

If you prefer the visual Table Editor (not SQL), create tables in this order due to foreign keys:

### Step 1: Create `project` table first

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key, default `gen_random_uuid()` |
| title | text | Default `''` |
| topic | text | Default `''` |
| academic_level | enum | Options: UNDERGRADUATE, MASTERS, PHD |
| department | text | Default `''` |
| institution | text | Default `''` |
| country | text | Default `''` |
| methodology | enum | See list above |
| citation_style | enum | APA, MLA, CHICAGO, HARVARD, IEEE |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

### Step 2: Create `chapter` table

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key, default `gen_random_uuid()` |
| project_id | text | Foreign key → project(id), ON DELETE CASCADE |
| chapter_number | int4 | Unique with project_id |
| title | text | Default `''` |
| content | text | Default `''` |
| status | enum | DRAFT, GENERATING, COMPLETE |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

### Step 3: Create `message` table

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key, default `gen_random_uuid()` |
| project_id | text | Foreign key → project(id), ON DELETE CASCADE |
| chapter_number | int4 | Default `1` |
| role | text | Default `'user'` |
| content | text | Default `''` |
| created_at | timestamptz | Default `now()` |

### Step 4: Create `analysis` table

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key, default `gen_random_uuid()` |
| project_id | text | Foreign key → project(id), ON DELETE CASCADE |
| type | enum | QUANTITATIVE, QUALITATIVE, MIXED |
| data | jsonb | Default `'{}'` |
| results | jsonb | Default `'[]'` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

### Step 5: Create `upload` table

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key, default `gen_random_uuid()` |
| project_id | text | Foreign key → project(id), ON DELETE CASCADE |
| filename | text | Default `''` |
| file_url | text | Default `''` |
| file_type | text | Default `''` |
| file_size | int4 | Default `0` |
| created_at | timestamptz | Default `now()` |

### Step 6: Create `reference` table

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key, default `gen_random_uuid()` |
| project_id | text | Foreign key → project(id), ON DELETE CASCADE |
| citation | text | Default `''` |
| style | enum | APA, MLA, CHICAGO, HARVARD, IEEE |
| source | text | Default `'manual'` |
| created_at | timestamptz | Default `now()` |

### Step 7: Create `export` table

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key, default `gen_random_uuid()` |
| project_id | text | Foreign key → project(id), ON DELETE CASCADE |
| format | text | Default `''` |
| file_url | text | Default `''` |
| created_at | timestamptz | Default `now()` |

---

## AI Prompt for Supabase SQL Editor

Paste this prompt into the Supabase SQL Editor AI assistant:

```
Create the full ChapterAI database with these 7 tables.
All IDs are TEXT using gen_random_uuid().
All foreign keys reference project(id) with ON DELETE CASCADE.
Use custom ENUM types for academic_level, research_methodology,
citation_style, chapter_status, and analysis_type.

Tables:
1. project: id, title, topic, academic_level, department, institution,
   country, methodology, citation_style, created_at, updated_at

2. chapter: id, project_id (FK), chapter_number, title, content, status,
   created_at, updated_at. Unique constraint on (project_id, chapter_number).

3. message: id, project_id (FK), chapter_number, role, content, created_at

4. analysis: id, project_id (FK), type, data (jsonb), results (jsonb),
   created_at, updated_at

5. upload: id, project_id (FK), filename, file_url, file_type, file_size,
   created_at

6. reference: id, project_id (FK), citation, style, source, created_at

7. export: id, project_id (FK), format, file_url, created_at

Add indexes on all project_id foreign keys.
Add auto-update triggers for updated_at on project, chapter, and analysis.
```

---

## Row Level Security (RLS) — Optional

If you want to enable RLS, run this after creating tables:

```sql
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter ENABLE ROW LEVEL SECURITY;
ALTER TABLE message ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE export ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon (public dashboard, no auth)
CREATE POLICY "Allow all for anon" ON project FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON chapter FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON message FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON upload FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON reference FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON export FOR ALL USING (true) WITH CHECK (true);
```
