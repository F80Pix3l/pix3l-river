# RIVER Deployment Guide

## Architecture Overview

| Service | Platform | Directory |
|---|---|---|
| Web frontend | Vercel | `web/` |
| Transcription worker | Railway | `workers/transcription/` |
| Copywriting worker | Railway | `workers/copywriting/` |
| Database + Auth + Storage | Supabase | managed |
| Queue | Upstash Redis | managed |

---

## Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- [Railway CLI](https://docs.railway.app/develop/cli): `npm i -g @railway/cli`
- Supabase project with migrations applied (see [Supabase Setup](#supabase-setup))
- Upstash Redis instance

---

## Supabase Setup

Apply all migrations before deploying:

```bash
cd web
supabase link --project-ref <your-project-ref>
supabase db push
```

Migrations to apply (in order):
1. `supabase/migrations/20260314_initial_schema.sql`
2. `supabase/migrations/20260314_pipeline_status.sql`
3. `supabase/migrations/20260314_transcripts.sql`
4. `supabase/migrations/20260314_generated_content.sql`

Verify the `videos` storage bucket exists with RLS enabled.

---

## Frontend: Vercel

### Environment Variables

Set these in Vercel project settings (or via CLI):

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

### Deploy

```bash
cd web
vercel --prod
```

First deploy will prompt you to link to a Vercel project. Select `web/` as the root directory.

The `vercel.json` in `web/` handles:
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing rewrite (all paths serve `index.html`)

---

## Workers: Railway

Both workers follow the same deploy pattern. Deploy each as a separate Railway service.

### Transcription Worker

**Required environment variables:**

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (bypasses RLS) |
| `UPSTASH_REDIS_URL` | Upstash Redis connection URL (`rediss://...`) |
| `REPLICATE_API_TOKEN` | Replicate API token for Whisper |

**Deploy:**

```bash
cd workers/transcription
railway login
railway link   # select or create a project
railway up
```

### Copywriting Worker

**Required environment variables:**

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (bypasses RLS) |
| `UPSTASH_REDIS_URL` | Upstash Redis connection URL (`rediss://...`) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude access |

**Deploy:**

```bash
cd workers/copywriting
railway login
railway link   # select or create a project (separate service)
railway up
```

### Railway Monorepo Note

Railway deploys from the directory you run `railway up` in. Each worker is its own Railway service pointing to its own subdirectory. No root-level `railway.toml` is needed when deploying per-directory.

---

## Environment Variable Checklist

### Vercel (web frontend)

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

### Railway: Transcription Worker

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `UPSTASH_REDIS_URL`
- [ ] `REPLICATE_API_TOKEN`

### Railway: Copywriting Worker

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `UPSTASH_REDIS_URL`
- [ ] `ANTHROPIC_API_KEY`

---

## Post-Deploy Verification

1. Visit the Vercel deployment URL
2. Sign up for a new account -- should land on `/upload`
3. Upload a test video (MP4, under 500MB)
4. Watch the Pipeline view -- transcription should start within seconds
5. After transcription completes, copywriting should enqueue automatically
6. Visit the Review screen -- generated content for YouTube, TikTok, and Instagram should appear
