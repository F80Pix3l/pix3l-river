import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Queue } from "npm:bullmq@5.37.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscriptionRequest {
  videoId: string;
  storagePath: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { videoId, storagePath }: TranscriptionRequest = await req.json();

    if (!videoId || !storagePath) {
      return new Response(
        JSON.stringify({ error: "Missing videoId or storagePath" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const transcriptionQueue = new Queue("transcription", {
      connection: {
        url: Deno.env.get("UPSTASH_REDIS_URL"),
      },
    });

    const job = await transcriptionQueue.add(
      "transcribe-video",
      {
        videoId,
        storagePath,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      }
    );

    console.log(`Enqueued transcription job ${job.id} for video ${videoId}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        videoId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error enqueueing transcription:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
