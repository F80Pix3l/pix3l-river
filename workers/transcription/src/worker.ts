import { Worker, Job, Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import 'dotenv/config';

process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

const redisConnection = { url: process.env.UPSTASH_REDIS_URL };

const transcriptionQueue = new Queue('transcription', { connection: redisConnection });

const copywritingQueue = new Queue('copywriting', { connection: redisConnection });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

interface TranscriptionJobData {
  videoId: string;
  storagePath: string;
  platforms?: string[];
}

async function processTranscription(job: Job<TranscriptionJobData>) {
  const { videoId, storagePath } = job.data;

  console.log(`[${job.id}] Starting transcription for video ${videoId}`);

  try {
    // Update pipeline status to running
    await supabase
      .from('pipeline_status')
      .upsert({
        job_id: videoId,
        agent_id: 1, // Transcription agent ID
        status: 'running',
        started_at: new Date().toISOString(),
      });

    // Get signed URL for video file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('videos')
      .createSignedUrl(storagePath, 3600);

    if (urlError || !signedUrlData) {
      throw new Error(`Failed to get video URL: ${urlError?.message}`);
    }

    // Run Whisper transcription via Replicate
    const output = await replicate.run(
      "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
      {
        input: {
          audio: signedUrlData.signedUrl,
          model: "large-v3",
          translate: false,
          temperature: 0,
          transcription: "plain text",
          suppress_tokens: "-1",
          logprob_threshold: -1,
          no_speech_threshold: 0.6,
          condition_on_previous_text: true,
          compression_ratio_threshold: 2.4,
          temperature_increment_on_fallback: 0.2
        }
      }
    ) as { transcription?: string; detected_language?: string };

    const transcription = output?.transcription || '';
    const language = output?.detected_language || 'unknown';

    if (!transcription) {
      throw new Error('No transcription returned from Whisper');
    }

    const wordCount = transcription.split(/\s+/).filter(w => w.length > 0).length;

    // Save transcript to database
    const { error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        job_id: videoId,
        content: transcription,
        word_count: wordCount,
        language,
      });

    if (transcriptError) {
      throw new Error(`Failed to save transcript: ${transcriptError.message}`);
    }

    // Update pipeline status to done
    await supabase
      .from('pipeline_status')
      .update({
        status: 'done',
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('job_id', videoId)
      .eq('agent_id', 1);

    // Update video status
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId);

    console.log(`[${job.id}] Transcription completed: ${wordCount} words`);

    // Trigger copywriting agent
    await copywritingQueue.add(
      'generate-copy',
      { videoId, platforms: job.data.platforms ?? ['youtube', 'tiktok', 'instagram'] },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      }
    );
    console.log(`[${job.id}] Enqueued copywriting job for video ${videoId}`);

    return { success: true, wordCount };
  } catch (error) {
    console.error(`[${job.id}] Transcription failed:`, error);

    // Update pipeline status to failed
    await supabase
      .from('pipeline_status')
      .update({
        status: 'failed',
        progress: 0,
        log: { error: error instanceof Error ? error.message : String(error) },
        completed_at: new Date().toISOString(),
      })
      .eq('job_id', videoId)
      .eq('agent_id', 1);

    // Update video status to failed
    await supabase
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', videoId);

    throw error;
  }
}

const worker = new Worker('transcription', processTranscription, {
  connection: redisConnection,
  concurrency: 2,
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err.message);
});

console.log('Transcription worker started');

// Poll for new uploads every 10 seconds and enqueue transcription jobs
async function pollForNewVideos() {
  console.log('Polling for new videos...');
  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select('id, storage_path, platforms')
      .eq('status', 'uploaded');

    if (error) {
      console.error('Poll error:', error.message);
      return;
    }

    console.log(`Found ${videos?.length ?? 0} videos to process`);

    for (const video of videos ?? []) {
      // Mark as queued immediately to prevent duplicate processing
      const { error: updateError } = await supabase
        .from('videos')
        .update({ status: 'processing' })
        .eq('id', video.id)
        .eq('status', 'uploaded'); // Only update if still 'uploaded' (atomic guard)

      if (updateError) {
        console.error(`Failed to claim video ${video.id}:`, updateError.message);
        continue;
      }

      console.log(`New video detected: ${video.id}, enqueuing transcription...`);
      await transcriptionQueue.add(
        'transcribe-video',
        { videoId: video.id, storagePath: video.storage_path, platforms: video.platforms ?? ['youtube', 'tiktok', 'instagram'] },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        }
      );
      console.log(`Enqueued transcription job for video ${video.id}`);
    }
  } catch (err) {
    console.error('Polling failed:', err);
  }
}

setInterval(pollForNewVideos, 10_000);
pollForNewVideos(); // Run immediately on startup

// Mark any pipeline_status rows that have been 'running' for over 10 minutes as failed
async function sweepStaleJobs() {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  try {
    const { data: stale, error } = await supabase
      .from('pipeline_status')
      .select('job_id, agent_id')
      .eq('status', 'running')
      .lt('started_at', cutoff);

    if (error) {
      console.error('Stale job sweep error:', error.message);
      return;
    }

    if (!stale || stale.length === 0) return;

    console.log(`Found ${stale.length} stale pipeline job(s), marking as failed`);

    for (const row of stale) {
      await supabase
        .from('pipeline_status')
        .update({
          status: 'failed',
          log: { error: 'Worker timed out after 10 minutes. The job may have crashed.' },
          completed_at: new Date().toISOString(),
        })
        .eq('job_id', row.job_id)
        .eq('agent_id', row.agent_id);

      // Set the video to failed if it is still in processing state
      await supabase
        .from('videos')
        .update({ status: 'failed' })
        .eq('id', row.job_id)
        .eq('status', 'processing');

      console.log(`Stale job marked failed: video ${row.job_id} agent ${row.agent_id}`);
    }
  } catch (err) {
    console.error('Stale job sweep threw:', err);
  }
}

setInterval(sweepStaleJobs, 5 * 60 * 1000);
sweepStaleJobs();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
