# Finpilot Environment Variables for Vercel

Add these in your Vercel project dashboard:
Settings → Environment Variables

## Required

DATABASE_URL
  Value: your Neon connection string
  Example: postgresql://neondb_owner:...@ep-shiny-haze-xxx.neon.tech/neondb?sslmode=require
  Note: Use the POOLED connection string from Neon (the one with "-pooler" in the hostname)

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  Value: pk_live_... (from Clerk dashboard → API Keys)

CLERK_SECRET_KEY
  Value: sk_live_... (from Clerk dashboard → API Keys)

GEMINI_API_KEY
  Value: AIza... (from https://aistudio.google.com/apikey)

## Clerk redirect URLs (required for production)

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

## After deploying

1. In Clerk dashboard → Domains → add your Vercel domain (e.g. finpilot.vercel.app)
2. Hit https://your-app.vercel.app/api/backfill to generate embeddings on production DB
3. Test the chat: click ⬡ → "How much did I spend on food?"

## Notes

- Neon DATABASE_URL: use the POOLED URL (has "-pooler" in hostname) — not the direct URL
  Pooled handles Vercel's serverless cold starts and concurrent connections better
- Prisma generates to app/generated/prisma — vercel.json runs `prisma generate` before build
- Region sin1 (Singapore) matches ap-southeast-1 Neon instance for lowest latency
