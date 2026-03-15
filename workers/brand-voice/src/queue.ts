import { Queue } from 'bullmq';
import { config } from 'dotenv';
config({ override: true });

interface BrandVoiceJobData {
  videoId: string;
}

export const brandVoiceQueue = new Queue<BrandVoiceJobData>('brand-voice', {
  connection: {
    url: process.env.UPSTASH_REDIS_URL,
  },
});

export async function enqueueBrandVoice(videoId: string) {
  const job = await brandVoiceQueue.add(
    'apply-brand-voice',
    { videoId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 500,
      },
    }
  );

  console.log(`Enqueued brand-voice job ${job.id} for video ${videoId}`);
  return job;
}
