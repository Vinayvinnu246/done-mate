import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint: sends 24h / 5h provider reminders for assigned jobs.
 * Called by pg_cron every 15 minutes with the project apikey header.
 */
export const Route = createFileRoute("/api/public/hooks/job-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");
        if (!key || key !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { runJobReminders } = await import("@/lib/assignments.server");
        const result = await runJobReminders();

        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});