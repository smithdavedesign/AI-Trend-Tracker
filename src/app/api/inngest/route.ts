import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { weeklyPipeline } from "@/lib/inngest/functions/weekly-pipeline";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [weeklyPipeline],
});
