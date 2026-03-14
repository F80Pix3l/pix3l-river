# Transcription Agent Setup Guide

Complete setup guide for the RIVER transcription pipeline.

## Prerequisites

- Supabase project (already configured)
- Upstash Redis account
- Replicate account
- Railway account (for worker deployment)

## Step 1: Upstash Redis Setup

1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Select a region close to your Supabase region
4. Copy the connection URL (looks like `rediss://...@...upstash.io:6379`)
5. Save this as `UPSTASH_REDIS_URL`

## Step 2: Replicate API Setup

1. Sign up at [replicate.com](https://replicate.com)
2. Go to Account Settings > API Tokens
3. Create a new API token
4. Save this as `REPLICATE_API_TOKEN`

## Step 3: Supabase Edge Function Deployment

1. Install Supabase CLI: `npm install -g supabase`
2. Link to your project: `supabase link --project-ref <your-project-ref>`
3. Set edge function secrets:

```bash
supabase secrets set UPSTASH_REDIS_URL=<your-redis-url>
```

4. Deploy the edge function:

```bash
cd web
supabase functions deploy enqueue-transcription
```

## Step 4: Database Migration

Run the transcripts migration:

```bash
cd web
supabase db push
```

Or apply manually in Supabase Dashboard > SQL Editor.

## Step 5: Railway Worker Deployment

1. Create a new Railway project
2. Connect to this GitHub repo
3. Set root directory to `workers/transcription`
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `UPSTASH_REDIS_URL`
   - `REPLICATE_API_TOKEN`
5. Deploy

## Step 6: Test the Pipeline

1. Sign in to the RIVER web app
2. Upload a test video (short video recommended for testing)
3. Check Railway logs to see worker processing
4. Verify transcript appears in Supabase `transcripts` table

## Troubleshooting

### Worker not picking up jobs

- Check Railway logs for errors
- Verify `UPSTASH_REDIS_URL` is correct in both edge function and worker
- Check Upstash dashboard for connection activity

### Transcription fails

- Check Railway logs for Replicate API errors
- Verify `REPLICATE_API_TOKEN` is valid
- Check video file format is supported (MP4, MOV, AVI)

### Edge function timeout

- Edge functions have 60s timeout by default
- Job enqueueing should be instant (does not wait for transcription)
- Check edge function logs in Supabase Dashboard

## Cost Estimates (MVP)

- **Upstash Redis**: Free tier (10K commands/day, plenty for MVP)
- **Replicate**: ~$0.0003/second of audio (30 min video = ~$0.54)
- **Railway**: $5/month minimum (worker runs 24/7)
- **Supabase**: Free tier includes 500MB storage + 2GB bandwidth

Total: ~$5-10/month for MVP testing
