import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
config({ override: true });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface BrandVoiceJobData {
  videoId: string;
}

interface BrandVoiceProfile {
  tone: string | null;
  writing_rules: string | null;
  example_content: string | null;
  avoid_phrases: string[] | null;
}

interface PlatformRow {
  platform: string;
  title: string | null;
  description: string | null;
  hashtags: string[] | null;
}

interface RefinedPlatform {
  title: string;
  description: string;
  hashtags: string[];
}

interface RefinedContent {
  youtube?: RefinedPlatform;
  tiktok?: RefinedPlatform;
  instagram?: RefinedPlatform;
}

const SYSTEM_PROMPT = `You are a brand voice editor. Rewrite social media copy to match a specific brand voice while keeping platform format requirements and character limits.

Voice: confident, direct, benefit-forward. No em dashes. No fluff.

Respond only with valid JSON matching the exact schema provided. No markdown, no explanation.`;

function buildPrompt(profile: BrandVoiceProfile, platforms: PlatformRow[]): string {
  const voiceParts: string[] = [];
  if (profile.tone) voiceParts.push(`Tone: ${profile.tone}`);
  if (profile.writing_rules) voiceParts.push(`Rules: ${profile.writing_rules}`);
  if (profile.example_content) voiceParts.push(`Example writing to match:\n${profile.example_content.slice(0, 1000)}`);
  if (profile.avoid_phrases && profile.avoid_phrases.length > 0) {
    voiceParts.push(`Never use: ${profile.avoid_phrases.join(', ')}`);
  }

  const originalContent = platforms.map((p) => ({
    platform: p.platform,
    title: p.title ?? '',
    description: p.description ?? '',
    hashtags: p.hashtags ?? [],
  }));

  const platformKeys = platforms.map((p) => p.platform);
  const schemaEntries = platformKeys.map((p) => {
    if (p === 'youtube') return `"youtube": { "title": "string (60 chars max, no em dashes)", "description": "string (250 words max, no em dashes)", "hashtags": ["tag1","tag2","tag3","tag4","tag5"] }`;
    if (p === 'tiktok') return `"tiktok": { "title": "string (hook, 15 words max)", "description": "string (150 chars max, no em dashes)", "hashtags": ["tag1","tag2","tag3","tag4","tag5"] }`;
    if (p === 'instagram') return `"instagram": { "title": "string (alt text, 100 chars max)", "description": "string (125 chars max, no em dashes)", "hashtags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"] }`;
    return '';
  }).filter(Boolean).join(',\n  ');

  return `Rewrite this social media content to match the brand voice below. Keep hashtags relevant. Preserve platform format requirements.

BRAND VOICE:
${voiceParts.join('\n')}

ORIGINAL CONTENT:
${JSON.stringify(originalContent, null, 2)}

Return JSON in this exact format:
{
  ${schemaEntries}
}`;
}

async function processBrandVoice(job: Job<BrandVoiceJobData>) {
  const { videoId } = job.data;
  console.log(`[${job.id}] Starting brand voice for video ${videoId}`);

  try {
    // Update pipeline status to running
    await supabase
      .from('pipeline_status')
      .upsert({
        job_id: videoId,
        agent_id: 3,
        status: 'running',
        started_at: new Date().toISOString(),
      });

    // Get video's user_id
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      throw new Error(`Video not found: ${videoError?.message}`);
    }

    // Get brand voice profile for the user
    const { data: profile } = await supabase
      .from('brand_voice_profiles')
      .select('tone, writing_rules, example_content, avoid_phrases')
      .eq('user_id', video.user_id)
      .single();

    if (!profile) {
      console.log(`[${job.id}] No brand voice profile for user ${video.user_id}, skipping`);
      await supabase
        .from('pipeline_status')
        .update({
          status: 'done',
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .eq('job_id', videoId)
        .eq('agent_id', 3);
      return { success: true, skipped: true };
    }

    // Get generated content to rewrite
    const { data: contentRows, error: contentError } = await supabase
      .from('generated_content')
      .select('platform, title, description, hashtags')
      .eq('job_id', videoId);

    if (contentError || !contentRows || contentRows.length === 0) {
      throw new Error(`No generated content found for video ${videoId}`);
    }

    console.log(`[${job.id}] Rewriting ${contentRows.length} platforms in brand voice`);

    // Call Claude to rewrite all content
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildPrompt(profile as BrandVoiceProfile, contentRows),
        },
      ],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let refined: RefinedContent;
    try {
      const jsonText = rawContent.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      refined = JSON.parse(jsonText) as RefinedContent;
    } catch {
      throw new Error(`Failed to parse Claude response: ${rawContent.text.slice(0, 200)}`);
    }

    // Save brand voice content for each platform
    for (const row of contentRows) {
      const platform = row.platform as keyof RefinedContent;
      const refinedPlatform = refined[platform];
      if (!refinedPlatform) {
        console.warn(`[${job.id}] No refined content for platform ${row.platform}`);
        continue;
      }

      const { error: upsertError } = await supabase
        .from('brand_voice_content')
        .upsert(
          {
            job_id: videoId,
            platform: row.platform,
            title: refinedPlatform.title,
            description: refinedPlatform.description,
            hashtags: refinedPlatform.hashtags,
            status: 'pending',
          },
          { onConflict: 'job_id,platform' }
        );

      if (upsertError) {
        throw new Error(`Failed to save ${row.platform} brand voice content: ${upsertError.message}`);
      }

      console.log(`[${job.id}] Brand voice saved for ${row.platform}`);
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
      .eq('agent_id', 3);

    console.log(`[${job.id}] Brand voice completed for video ${videoId}`);
    return { success: true, platforms: contentRows.map((r) => r.platform) };
  } catch (error) {
    console.error(`[${job.id}] Brand voice failed:`, error);

    await supabase
      .from('pipeline_status')
      .update({
        status: 'failed',
        progress: 0,
        log: { error: error instanceof Error ? error.message : String(error) },
        completed_at: new Date().toISOString(),
      })
      .eq('job_id', videoId)
      .eq('agent_id', 3);

    throw error;
  }
}

console.log('Brand voice worker starting...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ?? 'UNSET');

async function startWorker() {
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

  const worker = new Worker('brand-voice', processBrandVoice, {
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

  console.log('Brand voice worker ready');
}

startWorker().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
