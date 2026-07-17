# Supabase Storage Setup — Uploads Bucket

## Option 1: Create via Supabase Dashboard (Manual)

1. Go to **Supabase Dashboard → Storage** (left sidebar)
2. Click **New bucket**
3. Fill in:
   - **Name:** `uploads`
   - **Public:** Toggle ON
4. Click **Create bucket**

## Option 2: Create via SQL Editor (Paste & Run)

Go to **Supabase Dashboard → SQL Editor → New Query**, paste this, and click **Run**:

```sql
-- ============================================
-- Create uploads bucket for ChapterAI file storage
-- Paste into Supabase SQL Editor → Run
-- ============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to upload files (anon + authenticated)
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'uploads');

-- 3. Allow anyone to view/download files
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- 4. Allow owners to delete their own files
CREATE POLICY "Allow owner deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'uploads');
```

## Option 3: Supabase AI Prompt (Paste into AI Assistant)

If your Supabase project has the AI assistant enabled, paste this prompt:

```
Create a public storage bucket called "uploads" for a research
application. Set up the following access policies:

1. The bucket must be PUBLIC so files are accessible via URL
2. Allow anyone (anon) to upload files to the bucket
3. Allow anyone to read/download files from the bucket
4. Allow file owners to delete their own files
5. Files should be organized by project ID path: uploads/{projectId}/{filename}
6. No file size limit restrictions needed for now

Use SQL to create the bucket and define the storage policies.
```

## Option 4: Supabase CLI (If Installed)

```bash
# Create the bucket
supabase storage create-bucket uploads --public

# Or with the management API
curl -X POST "https://kfepwpjiqjpxdhjdglds.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"uploads","name":"uploads","public":true}'
```

## Verify It Works

After creating the bucket, test it:

```bash
# Upload a test file
curl -X POST "https://kfepwpjiqjpxdhjdglds.supabase.co/storage/v1/object/uploads/test.txt" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: text/plain" \
  -d "Hello from ChapterAI"

# Expected response: {"Key":"uploads/test.txt"}

# Access the file (should return "Hello from ChapterAI")
# URL: https://kfepwpjiqjpxdhjdglds.supabase.co/storage/v1/object/public/uploads/test.txt
```

## File Structure

Files are stored at:
```
uploads/
  └── {project-id}/
      ├── 1721234567890-data.xlsx
      ├── 1721234567891-survey.csv
      └── 1721234567892-notes.pdf
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `bucket not found` | Create the bucket first using Option 1 or 2 above |
| `new row violates row-level security` | Run the SQL policies from Option 2 |
| `403 Forbidden` | Ensure bucket is set to PUBLIC or policies allow anon access |
| Files not accessible via URL | Check the public URL format: `.../storage/v1/object/public/uploads/{path}` |
