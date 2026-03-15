import { Worker, Job, Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Replicate from 'replicate';
import { Resend } from 'resend';
import 'dotenv/config';

const brandVoiceQueue = new Queue('brand-voice', {
  connection: {
    url: process.env.UPSTASH_REDIS_URL,
  },
});

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

const resend = new Resend(process.env.RESEND_API_KEY!);

interface CopywritingJobData {
  videoId: string;
  platforms?: string[];
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
  title: string,
  retries = 3
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

    // Signed URL valid for 1 year
    const { data: signedUrlData } = await supabase.storage
      .from('videos')
      .createSignedUrl(storagePath, 31536000);

    return signedUrlData?.signedUrl ?? null;
  } catch (err) {
    const is429 = err instanceof Error && err.message.includes('429');
    if (is429 && retries > 0) {
      const retryAfter = err.message.match(/~?(\d+)s/)?.[1];
      const delaySec = retryAfter ? parseInt(retryAfter) + 2 : 12;
      console.log(`Thumbnail rate-limited for ${platform}, retrying in ${delaySec}s (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
      return generateAndUploadThumbnail(videoId, platform, title, retries - 1);
    }
    console.error(`Thumbnail generation failed for ${platform}:`, err);
    return null;
  }
}

async function sendCompletionEmail(videoId: string): Promise<void> {
  try {
    const { data: video } = await supabase
      .from('videos')
      .select('title, user_id')
      .eq('id', videoId)
      .single();

    if (!video?.user_id) return;

    const { data: userData } = await supabase.auth.admin.getUserById(video.user_id);
    const email = userData?.user?.email;
    if (!email) return;

    const appUrl = process.env.APP_URL ?? 'https://river.pix3l.com';
    const reviewUrl = `${appUrl}/review/${videoId}`;
    const title = video.title ?? 'Your video';

    await resend.emails.send({
      from: 'RIVER <onboarding@resend.dev>',
      to: email,
      subject: `Your content is ready: ${title}`,
      html: `
        <div style="font-family: 'Space Grotesk', sans-serif; background: #0A0E1A; color: #F0F4FF; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
          <h1 style="color: #F0F4FF; font-size: 24px; margin-bottom: 8px;">Your content is ready.</h1>
          <p style="color: #8599FF; font-size: 16px; margin-bottom: 32px;">${title}</p>
          <p style="color: #B0BAD8; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
            RIVER finished generating your social media copy and thumbnails for YouTube, TikTok, and Instagram.
            Review, edit, and approve your content below.
          </p>
          <a href="${reviewUrl}" style="display: inline-block; background: #FF1635; color: #fff; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
            Review Content
          </a>
          <p style="color: #4A5578; font-size: 13px; margin-top: 40px;">RIVER by Pix3l</p>
        </div>
      `,
    });

    console.log(`Completion email sent to ${email} for video ${videoId}`);
  } catch (err) {
    console.error('Failed to send completion email:', err);
  }
}

async function processCopywriting(job: Job<CopywritingJobData>) {
  const { videoId, platforms: selectedPlatforms = ['youtube', 'tiktok', 'instagram'] } = job.data;

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

    await supabase.from('pipeline_status').update({ progress: 15 }).eq('job_id', videoId).eq('agent_id', 2);

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

    await supabase.from('pipeline_status').update({ progress: 45 }).eq('job_id', videoId).eq('agent_id', 2);

    // Build platform content array, filtered to selected platforms
    const allPlatforms: Array<{
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
    const platforms = allPlatforms.filter((p) => selectedPlatforms.includes(p.platform));

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

    await supabase.from('pipeline_status').update({ progress: 60 }).eq('job_id', videoId).eq('agent_id', 2);
    console.log(`[${job.id}] Text content saved. Generating thumbnails...`);

    // Generate thumbnails sequentially to avoid Replicate burst rate limit
    const thumbnailResults: { platform: string; thumbnailUrl: string | null }[] = [];
    for (let i = 0; i < platforms.length; i++) {
      const content = platforms[i];
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

      thumbnailResults.push({ platform: content.platform, thumbnailUrl });
      const thumbProgress = 60 + Math.round(((i + 1) / platforms.length) * 35);
      await supabase.from('pipeline_status').update({ progress: thumbProgress }).eq('job_id', videoId).eq('agent_id', 2);
    }

    const thumbnailsSaved = thumbnailResults.filter((r) => r.thumbnailUrl).length;

    console.log(`[${job.id}] ${thumbnailsSaved}/${platforms.length} thumbnails generated`);

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

    await sendCompletionEmail(videoId);

    // Enqueue brand voice job
    try {
      const bvJob = await brandVoiceQueue.add(
        'apply-brand-voice',
        { videoId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        }
      );
      console.log(`[${job.id}] Enqueued brand-voice job ${bvJob.id} for video ${videoId}`);
    } catch (bvErr) {
      console.error(`[${job.id}] Failed to enqueue brand-voice job:`, bvErr);
    }

    console.log(`[${job.id}] Copywriting completed for video ${videoId}`);

    return { success: true, platforms: selectedPlatforms, thumbnailsSaved };
  } catch (error) {
    console.error(`[${job.id}] Copywriting failed:`, error);

    await supabase
      .from('pipeline_status')
      .update({
        status: 'failed',
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

console.log('Copywriting worker starting...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ?? 'UNSET');

async function startWorker() {
  // Wait for Supabase to be reachable before accepting jobs
  const maxAttempts = 5;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(process.env.SUPABASE_URL! + '/rest/v1/', {
        headers: { apikey: process.env.SUPABASE_SERVICE_KEY! },
      });
      console.log(`Supabase connectivity OK: ${res.status}`);
      break;
    } catch (e: any) {
      console.error(`Supabase connectivity check ${i}/${maxAttempts} failed:`, e.message, '| cause:', e.cause?.message ?? e.cause);
      if (i === maxAttempts) {
        console.error('Supabase unreachable after all attempts, exiting');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 3000 * i));
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

  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...');
    await worker.close();
    process.exit(0);
  });

  console.log('Copywriting worker ready');
}

startWorker().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
