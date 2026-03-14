# Transcription Worker

BullMQ worker that processes video transcription jobs using Replicate's Whisper API.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Configure environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key
- `UPSTASH_REDIS_URL`: Your Upstash Redis connection URL
- `REPLICATE_API_TOKEN`: Your Replicate API token

## Development

Run the worker locally:

```bash
npm run dev
```

## Deployment (Railway)

1. Create a new Railway project
2. Add environment variables from `.env`
3. Deploy from this directory
4. Worker will auto-start on deployment

## Infrastructure Dependencies

- **Upstash Redis**: Queue backend (sign up at upstash.com)
- **Replicate**: Whisper API (sign up at replicate.com)
- **Supabase**: Database and storage (already configured)

## How It Works

1. Video upload triggers edge function
2. Edge function enqueues job to BullMQ queue
3. Worker picks up job from queue
4. Worker fetches signed URL for video from Supabase Storage
5. Worker calls Replicate Whisper API with video URL
6. Transcription saved to `transcripts` table
7. Pipeline status updated to trigger next agent
