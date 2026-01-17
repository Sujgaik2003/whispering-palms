# Whispering Palms - AI

Ancient Indian wisdom, modern AI guidance.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Database & Storage**: Supabase (PostgreSQL + Storage buckets)
- **Authentication**: Custom JWT with Supabase
- **Payment**: Stripe + Razorpay integration
- **AI/RAG**: AnythingLLM (self-hosted)
- **Vector DB**: Qdrant

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
**📖 Detailed instructions**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Quick steps:
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your API keys (URL, anon key, service role key)
3. Create `.env.local` file with your keys (see `.env.local.example`)
4. Run `supabase/schema.sql` in Supabase SQL Editor
5. Create storage bucket `palm-images` with RLS policies

### 3. Test Setup
```bash
# Test Supabase connection
npm run test:supabase

# Start development server
npm run dev
```

### 4. Verify
- Visit http://localhost:3000
- Check health endpoint: http://localhost:3000/api/health

**📋 Complete checklist**: See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                    # Utility functions and configurations
│   ├── api/               # API client functions
│   ├── auth/              # Authentication utilities
│   ├── supabase/          # Supabase client setup
│   └── utils/             # Helper functions
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Environment Variables

See `.env.local.example` for required environment variables.

## License

ISC
