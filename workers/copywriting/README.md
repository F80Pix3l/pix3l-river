# RIVER Copywriting Worker

BullMQ worker (Agent 02) that generates platform-specific social media copy from video transcripts using Claude claude-sonnet-4-6.

## What it does

Triggered automatically when the transcription worker completes. Reads the transcript from Supabase, calls Claude to generate copy for YouTube, TikTok, and Instagram, then saves results to the `generated_content` table.

### Output per platform

| Platform | title column | description column | hashtags |
|---|---|---|---|
| YouTube | Video title (60 chars max) | Description (250 words) | 5 tags |
| TikTok | Hook (first 3s spoken copy) | Caption (150 chars) | 5 tags |
| Instagram | Alt text (accessibility) | Caption (125 chars) | 10 tags |

## Setup

```bash
npm install
cp .env.example .env
# Fill in required env vars
```

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude access |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (bypasses RLS) |
| `UPSTASH_REDIS_URL` | Upstash Redis connection URL for BullMQ |

## Running

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

## Deploy to Railway

1. Connect this directory to a Railway service
2. Set all environment variables in Railway dashboard
3. Railway auto-detects `npm start` from `railway.json`

The worker runs with concurrency 3 and retries failed jobs up to 3 times with exponential backoff.
