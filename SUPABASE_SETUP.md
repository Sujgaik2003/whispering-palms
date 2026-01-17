# Supabase Setup Guide

Follow these steps to set up Supabase for Whispering Palms:

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: whispering-palms (or your preferred name)
   - **Database Password**: Create a strong password (save it securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for MVP
5. Click "Create new project"
6. Wait for project to be created (takes ~2 minutes)

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Create Environment File

1. In your project root, create `.env.local` file
2. Add the following (replace with your actual values):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_random_secret_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: 
- Generate a secure JWT_SECRET (you can use: `openssl rand -base64 32` or any random string generator)
- Never commit `.env.local` to git (it's already in .gitignore)

## Step 4: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open `supabase/schema.sql` from this project
4. Copy the entire SQL content
5. Paste into the SQL Editor
6. Click "Run" (or press F5)
7. Verify success - you should see "Success. No rows returned"

## Step 5: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Name: `palm-images`
4. **Public bucket**: Unchecked (private)
5. Click "Create bucket"

## Step 6: Set Up Storage Policies (RLS)

1. In the `palm-images` bucket, go to **Policies** tab
2. Click "New Policy"
3. Create the following policies:

### Policy 1: Users can upload their own files
- **Policy name**: Users can upload own palm images
- **Allowed operation**: INSERT
- **Policy definition**:
```sql
(auth.uid()::text = (storage.foldername(name))[1])
```

### Policy 2: Users can read their own files
- **Policy name**: Users can read own palm images
- **Allowed operation**: SELECT
- **Policy definition**:
```sql
(auth.uid()::text = (storage.foldername(name))[1])
```

### Policy 3: Users can delete their own files
- **Policy name**: Users can delete own palm images
- **Allowed operation**: DELETE
- **Policy definition**:
```sql
(auth.uid()::text = (storage.foldername(name))[1])
```

**Note**: 
- Use `auth.uid()` (not `user_id()`) - this is Supabase's built-in function
- Convert to text for comparison: `auth.uid()::text`
- The folder structure is `{user_id}/{palm_type}/{filename}`, so `[1]` gets the user_id from the path

**Note**: The folder structure is `{user_id}/{palm_type}/{filename}`, so we extract the user_id from the path.

## Step 7: Verify Setup

1. Check that all tables were created:
   - Go to **Table Editor** in Supabase
   - You should see: users, user_profiles, palm_images, subscriptions, etc.

2. Test the connection:
   ```bash
   npm run dev
   ```
   - Visit http://localhost:3000
   - Check browser console for any Supabase connection errors

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file
- Make sure keys are copied correctly (no extra spaces)
- Restart the dev server after changing `.env.local`

### "Table doesn't exist" error
- Make sure you ran the schema.sql file completely
- Check SQL Editor for any errors
- Verify tables exist in Table Editor

### Storage upload fails
- Verify bucket name is exactly `palm-images`
- Check RLS policies are set correctly
- Ensure bucket is created (not just planned)

## Next Steps

Once Supabase is set up:
1. Test authentication endpoints
2. Test file upload functionality
3. Continue with Week 2 implementation
