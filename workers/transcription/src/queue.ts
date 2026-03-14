import { Queue } from 'bullmq';
import 'dotenv/config';

interface TranscriptionJobData {
  videoId: string;
  storagePath: string;
}

export const transcriptionQueue = new Queue<TranscriptionJobData>('transcription', {
  connection: {
    url: process.env.UPSTASH_REDIS_URL,
  },
});

export async function enqueueTranscription(videoId: string, storagePath: string) {
  const job = await transcriptionQueue.add(
    'transcribe-video',
    {
      videoId,
      storagePath,
    },
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

  console.log(`Enqueued transcription job ${job.id} for video ${videoId}`);
  return job;
}
