import { Queue } from 'bullmq';
import 'dotenv/config';

interface CopywritingJobData {
  videoId: string;
}

export const copywritingQueue = new Queue<CopywritingJobData>('copywriting', {
  connection: {
    url: process.env.UPSTASH_REDIS_URL,
  },
});

export async function enqueueCopywriting(videoId: string) {
  const job = await copywritingQueue.add(
    'generate-copy',
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

  console.log(`Enqueued copywriting job ${job.id} for video ${videoId}`);
  return job;
}
