import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCategoriesTool from "./tools/list-categories";
import listMyJobsTool from "./tools/list-my-jobs";
import postJobTool from "./tools/post-job";
import listAvailableJobsTool from "./tools/list-available-jobs";
import submitQuoteTool from "./tools/submit-quote";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "donetoday-mcp",
  title: "DoneToday",
  version: "0.1.0",
  instructions:
    "Tools for the DoneToday marketplace. Customers can browse service categories, post jobs, and review their jobs. Providers can list open jobs and submit quotes. All authenticated tools act as the signed-in DoneToday user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCategoriesTool, listMyJobsTool, postJobTool, listAvailableJobsTool, submitQuoteTool],
});