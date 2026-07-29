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
  name: "submit_quote",
  title: "Submit a quote",
  description: "Submit a quote on an open job as the signed-in provider.",
  inputSchema: {
    job_id: z.string().uuid(),
    price: z.number().min(0).describe("Total price in GBP."),
    duration_minutes: z.number().int().min(15).optional(),
    message: z.string().trim().max(1000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("quotes")
      .insert({ provider_id: ctx.getUserId(), ...input })
      .select("id, job_id, price, status, created_at")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Quote submitted: ${data.id}` }],
      structuredContent: { quote: data },
    };
  },
});