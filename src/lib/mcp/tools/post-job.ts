import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "post_job",
  title: "Post a job",
  description: "Post a new service job on DoneToday as the signed-in customer. Providers will send quotes.",
  inputSchema: {
    title: z.string().trim().min(5).max(120).describe("Short summary of the job."),
    description: z.string().trim().min(20).max(2000).describe("What needs to be done."),
    category_id: z.string().uuid().describe("Category UUID from list_categories."),
    urgency: z.enum(["standard", "today", "emergency"]).describe("Urgency level."),
    address_line1: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(100),
    postcode: z.string().trim().min(3).max(20),
    budget_min: z.number().min(0).optional(),
    budget_max: z.number().min(0).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("jobs")
      .insert({ customer_id: ctx.getUserId(), ...input })
      .select("id, title, status, created_at")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Job posted: ${data.id}` }],
      structuredContent: { job: data },
    };
  },
});