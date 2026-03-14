import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Replicate from 'replicate';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
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

const THUMBNAIL_CONFIGS: Record<string, { width: number; height: number; style: string }> = {
  youtube: {
    width: 1280,
    height: 720,
    style: 'YouTube video thumbnail, widescreen 16:9, bold and eye-catching, cinematic, professional',
  },
  tiktok: {
    width: 576,
    height: 1024,
    style: 'TikTok video thumbnail, 9:16 portrait, vibrant, trendy, energetic',
  },
  instagram: {
    width: 1024,
    height: 1024,
    style: 'Instagram post, square format, aesthetic, clean composition, visually striking',
  },
};

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

async function generateAndUploadThumbnail(
  videoId: string,
  platform: string,
  title: string
): Promise<string | null> {
  const config = THUMBNAIL_CONFIGS[platform];
  if (!config) return null;

  try {
    const prompt = `${title}. ${config.style}. High quality, sharp, vibrant colors, digital artwork.`;

    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input: {
        prompt,
        width: config.width,
        height: config.height,
        num_outputs: 1,
        num_inference_steps: 4,
        output_format: 'jpg',
        output_quality: 85,
      },
    }) as unknown as Array<{ blob: () => Promise<Blob>; url: () => URL }>;

    const fileOutput = Array.isArray(output) ? output[0] : output;
    if (!fileOutput) return null;

    const blob = await (fileOutput as { blob: () => Promise<Blob> }).blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storagePath = `thumbnails/${videoId}/${platform}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`Failed to upload thumbnail for ${platform}:`, uploadError.message);
      return null;
    }

    // Signed URL valid for 10 years
    const { data: signedUrlData } = await supabase.storage
      .from('videos')
      .createSignedUrl(storagePath, 315360000);

    return signedUrlData?.signedUrl ?? null;
  } catch (err) {
    console.error(`Thumbnail generation failed for ${platform}:`, err);
    return null;
  }
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
      const jsonText = rawContent.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      copy = JSON.parse(jsonText) as GeneratedCopy;
    } catch {
      throw new Error(`Failed to parse Claude response as JSON: ${rawContent.text.slice(0, 200)}`);
    }

    // Build platform content array
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

    // Save text content for all platforms
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

    console.log(`[${job.id}] Text content saved. Generating thumbnails...`);

    // Generate thumbnails in parallel for all platforms
    const thumbnailResults = await Promise.allSettled(
      platforms.map(async (content) => {
        const thumbnailUrl = await generateAndUploadThumbnail(
          videoId,
          content.platform,
          content.title
        );

        if (thumbnailUrl) {
          await supabase
            .from('generated_content')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('job_id', videoId)
            .eq('platform', content.platform);

          console.log(`[${job.id}] Thumbnail uploaded for ${content.platform}`);
        }

        return { platform: content.platform, thumbnailUrl };
      })
    );

    const thumbnailsSaved = thumbnailResults.filter(
      (r) => r.status === 'fulfilled' && r.value.thumbnailUrl
    ).length;

    console.log(`[${job.id}] ${thumbnailsSaved}/3 thumbnails generated`);

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

    return { success: true, platforms: ['youtube', 'tiktok', 'instagram'], thumbnailsSaved };
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
