-- ============================================================
-- ChapterAI — Initial Supabase Schema
-- Matches the Prisma schema exactly (enums, tables, columns).
-- Public dashboard: RLS enabled with full public access.
-- ============================================================

-- -------------------------
-- Custom Enums (PascalCase, matching Prisma)
-- -------------------------
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

CREATE TYPE "CitationStyle" AS ENUM (
  'APA',
  'MLA',
  'CHICAGO',
  'HARVARD',
  'IEEE'
);

CREATE TYPE "AcademicLevel" AS ENUM (
  'UNDERGRADUATE',
  'MASTERS',
  'PHD'
);

CREATE TYPE "ChapterStatus" AS ENUM (
  'DRAFT',
  'GENERATING',
  'COMPLETE'
);

CREATE TYPE "AnalysisType" AS ENUM (
  'QUANTITATIVE',
  'QUALITATIVE',
  'MIXED'
);

-- -------------------------
-- Tables (snake_case, matching Prisma @@map)
-- -------------------------

-- Project — top-level research project container
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

-- Chapter — individual chapter within a project
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

-- Message — chat messages per project/chapter
CREATE TABLE "message" (
  "id"              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT         NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "chapter_number"  INT          NOT NULL DEFAULT 1,
  "role"            TEXT         NOT NULL DEFAULT 'user',
  "content"         TEXT         NOT NULL DEFAULT '',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analysis — saved quantitative/qualitative/mixed analysis runs
CREATE TABLE "analysis" (
  "id"              TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT           NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "type"            "AnalysisType" NOT NULL,
  "data"            JSONB         NOT NULL DEFAULT '{}'::JSONB,
  "results"         JSONB         NOT NULL DEFAULT '[]'::JSONB,
  "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Upload — file uploads (XLSX, CSV, etc.) for analysis
CREATE TABLE "upload" (
  "id"              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT         NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "filename"        TEXT         NOT NULL DEFAULT '',
  "file_url"        TEXT         NOT NULL DEFAULT '',
  "file_type"       TEXT         NOT NULL DEFAULT '',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reference — generated citations for the project
CREATE TABLE "reference" (
  "id"              TEXT            PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT            NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "citation"        TEXT            NOT NULL DEFAULT '',
  "style"           "CitationStyle" NOT NULL DEFAULT 'APA',
  "source"          TEXT            NOT NULL DEFAULT 'manual',
  "created_at"      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Export — exported document records (DOCX, PDF)
CREATE TABLE "export" (
  "id"              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "project_id"      TEXT         NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "format"          TEXT         NOT NULL DEFAULT '',
  "file_url"        TEXT         NOT NULL DEFAULT '',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------
-- Indexes
-- -------------------------
CREATE INDEX "idx_chapter_project_id"    ON "chapter"("project_id");
CREATE INDEX "idx_message_project_id"    ON "message"("project_id");
CREATE INDEX "idx_message_chapter"       ON "message"("project_id", "chapter_number");
CREATE INDEX "idx_analysis_project_id"   ON "analysis"("project_id");
CREATE INDEX "idx_upload_project_id"     ON "upload"("project_id");
CREATE INDEX "idx_reference_project_id"  ON "reference"("project_id");
CREATE INDEX "idx_export_project_id"     ON "export"("project_id");
CREATE INDEX "idx_project_updated_at"    ON "project"("updated_at" DESC);
CREATE INDEX "idx_chapter_status"        ON "chapter"("project_id", "status");

-- -------------------------
-- updated_at trigger function
-- -------------------------
CREATE OR REPLACE FUNCTION "update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "set_project_updated_at"
  BEFORE UPDATE ON "project"
  FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();

CREATE TRIGGER "set_chapter_updated_at"
  BEFORE UPDATE ON "chapter"
  FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();

CREATE TRIGGER "set_analysis_updated_at"
  BEFORE UPDATE ON "analysis"
  FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();

-- -------------------------
-- Row Level Security
-- -------------------------
ALTER TABLE "project"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chapter"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analysis"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "upload"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "export"    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access" ON "project"   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "chapter"   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "message"   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "analysis"  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "upload"    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "reference" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON "export"    FOR ALL USING (true) WITH CHECK (true);

-- -------------------------
-- Supabase Storage — "uploads" bucket
-- -------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage SELECT — anyone can read (public bucket)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'uploads');

-- Storage INSERT — allow uploads where path is {projectId}/{filename}
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'uploads'
  AND storage.foldername(name)[1] IS NOT NULL
  AND storage.foldername(name)[2] IS NOT NULL
);

-- Storage DELETE — allow deletes (owner cleanup)
CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'uploads');
