# Storage Bucket Setup Guide

## Step 1: Create Storage Bucket in Supabase

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Or go to: https://supabase.com/dashboard/project/[your-project-id]/storage/buckets

3. **Create New Bucket**
   - Click "New bucket" button
   - **Bucket name**: `palm-images` (exactly this name)
   - **Public bucket**: ❌ **UNCHECKED** (Keep it private)
   - **File size limit**: 50 MB (default)
   - **Allowed MIME types**: Leave empty (or add: `image/jpeg, image/png, image/webp`)
   - Click "Create bucket"

## Step 2: Set Up RLS Policies

1. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Or go to: https://supabase.com/dashboard/project/[your-project-id]/sql/new

2. **Run Storage Policies SQL**
   - Copy the contents of `supabase/storage-policies.sql`
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter

   **OR** manually run this SQL:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only insert their own files
CREATE POLICY "Users can insert their own palm images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'palm-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can only view their own files
CREATE POLICY "Users can view their own palm images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'palm-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can only delete their own files
CREATE POLICY "Users can delete their own palm images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'palm-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 3: Verify Setup

1. **Test via Web UI**
   - Visit: http://localhost:3000/test
   - Click "Run Tests"
   - Check if "Storage Bucket" shows ✅

2. **Or test via API**
   ```bash
   curl http://localhost:3000/api/test-supabase
   ```

## Troubleshooting

### Bucket Still Not Found
- ✅ Check bucket name is exactly `palm-images` (case-sensitive)
- ✅ Verify you're in the correct Supabase project
- ✅ Refresh the test page and run again

### RLS Policies Error
- ✅ Make sure you've run the schema.sql first (to create auth system)
- ✅ Check if storage.objects table exists
- ✅ Verify you're using the correct SQL syntax

### Access Denied
- ✅ Make sure bucket is private (not public)
- ✅ RLS policies should be enabled
- ✅ Users must be authenticated to access files

## Quick Checklist

- [ ] Created `palm-images` bucket in Supabase Storage
- [ ] Bucket is set to private
- [ ] Ran storage-policies.sql in SQL Editor
- [ ] Test shows ✅ for storage bucket
- [ ] File uploads will work after authentication is implemented

## Next Steps

After bucket is created:
1. ✅ Storage will be ready for palm image uploads (Week 2)
2. ✅ RLS policies ensure users can only access their own files
3. ✅ Files will be stored at: `{user_id}/{palm_type}/{uuid}.{ext}`
