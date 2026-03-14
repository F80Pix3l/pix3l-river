import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface CopywritingJobData {
  videoId: string;
}

interface GeneratedCopy {
  youtube: {
    title: string;
    description: string;
    hashtags: string[];
  };
  tiktok: {
    hook: string;
    caption: string;
    hashtags: string[];
  };
  instagram: {
    caption: string;
    hashtags: string[];
    alt_text: string;
  };
}

const SYSTEM_PROMPT = `You are a social media copywriter for RIVER, an AI content platform. Your job is to write platform-optimized content from video transcripts.

Voice: confident, direct, benefit-forward, human. Short sentences. Active voice. No em dashes. No fluff.

Respond only with valid JSON matching the exact schema provided. No markdown, no explanation.`;

function buildUserPrompt(transcript: string): string {
  return `Generate platform-specific social media copy from this video transcript.

TRANSCRIPT:
${transcript.slice(0, 8000)}

Return JSON in this exact format:
{
  "youtube": {
    "title": "string (60 chars max, no em dashes)",
    "description": "string (250 words max, benefit-forward, no em dashes)",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  },
  "tiktok": {
    "hook": "string (first 3 seconds spoken copy, 15 words max, grabs attention immediately)",
    "caption": "string (150 chars max, no em dashes)",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  },
  "instagram": {
    "caption": "string (125 chars max, no em dashes)",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
    "alt_text": "string (descriptive alt text for accessibility, 100 chars max)"
  }
}`;
}

async function processCopywriting(job: Job<CopywritingJobData>) {
  const { videoId } = job.data;

  console.log(`[${job.id}] Starting copywriting for video ${videoId}`);

  try {
    // Update pipeline status to running
    await supabase
      .from('pipeline_status')
      .upsert({
        job_id: videoId,
        agent_id: 2,
        status: 'running',
        started_at: new Date().toISOString(),
      });

    // Fetch transcript
    const { data: transcriptRow, error: transcriptError } = await supabase
      .from('transcripts')
      .select('content')
      .eq('job_id', videoId)
      .single();

    if (transcriptError || !transcriptRow) {
      throw new Error(`Transcript not found for video ${videoId}: ${transcriptError?.message}`);
    }

    const transcript = transcriptRow.content as string;

    // Generate copy with Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(transcript),
        },
      ],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let copy: GeneratedCopy;
    try {
      copy = JSON.parse(rawContent.text) as GeneratedCopy;
    } catch {
      throw new Error(`Failed to parse Claude response as JSON: ${rawContent.text.slice(0, 200)}`);
    }

    // Save generated content for each platform
    const platforms: Array<{
      platform: 'youtube' | 'tiktok' | 'instagram';
      title: string;
      description: string;
      hashtags: string[];
    }> = [
      {
        platform: 'youtube',
        title: copy.youtube.title,
        description: copy.youtube.description,
        hashtags: copy.youtube.hashtags,
      },
      {
        platform: 'tiktok',
        title: copy.tiktok.hook,
        description: copy.tiktok.caption,
        hashtags: copy.tiktok.hashtags,
      },
      {
        platform: 'instagram',
        title: copy.instagram.alt_text,
        description: copy.instagram.caption,
        hashtags: copy.instagram.hashtags,
      },
    ];

    for (const content of platforms) {
      const { error: insertError } = await supabase
        .from('generated_content')
        .upsert(
          {
            job_id: videoId,
            platform: content.platform,
            title: content.title,
            description: content.description,
            hashtags: content.hashtags,
            status: 'pending',
          },
          { onConflict: 'job_id,platform' }
        );

      if (insertError) {
        throw new Error(`Failed to save ${content.platform} content: ${insertError.message}`);
      }
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
      .eq('agent_id', 2);

    // Update video status to completed
    await supabase
      .from('videos')
      .update({ status: 'completed' })
      .eq('id', videoId);

    console.log(`[${job.id}] Copywriting completed for video ${videoId}`);

    return { success: true, platforms: ['youtube', 'tiktok', 'instagram'] };
  } catch (error) {
    console.error(`[${job.id}] Copywriting failed:`, error);

    await supabase
      .from('pipeline_status')
      .update({
        status: 'done',
        progress: 0,
        log: { error: error instanceof Error ? error.message : String(error) },
        completed_at: new Date().toISOString(),
      })
      .eq('job_id', videoId)
      .eq('agent_id', 2);

    await supabase
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', videoId);

    throw error;
  }
}

const worker = new Worker('copywriting', processCopywriting, {
  connection: {
    url: process.env.UPSTASH_REDIS_URL,
  },
  concurrency: 3,
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log('Copywriting worker started');

process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
