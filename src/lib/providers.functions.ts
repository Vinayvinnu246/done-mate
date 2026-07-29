import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category_id: z.string().uuid().optional(),
  city: z.string().trim().max(100).optional(),
});

const PROVIDER_COLUMNS =
  "user_id, display_name, avatar_url, bio, years_experience, service_radius, verification_status, is_available";

export const searchProviders = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => searchSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();

    let providerIds: string[] | null = null;
    if (data.category_id) {
      const { data: links, error } = await supabase
        .from("provider_categories")
        .select("provider_id")
        .eq("category_id", data.category_id);
      if (error) throw new Error(error.message);
      providerIds = (links ?? []).map((l) => l.provider_id);
      if (providerIds.length === 0) return [];
    }

    let query = supabase
      .from("public_providers")
      .select(PROVIDER_COLUMNS)
      .order("verification_status", { ascending: false })
      .limit(60);

    if (providerIds) query = query.in("user_id", providerIds);
    if (data.q) query = query.ilike("display_name", `%${data.q}%`);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    if (!rows || rows.length === 0) return [];

    const ids = rows.map((r) => r.user_id);
    const { data: cats } = await supabase
      .from("provider_categories")
      .select("provider_id, category:categories(id, name, slug, icon)")
      .in("provider_id", ids);

    const byProvider = new Map<string, Array<{ id: string; name: string; slug: string; icon: string | null }>>();
    for (const link of cats ?? []) {
      const cat = link.category as { id: string; name: string; slug: string; icon: string | null } | null;
      if (!cat) continue;
      const list = byProvider.get(link.provider_id) ?? [];
      list.push(cat);
      byProvider.set(link.provider_id, list);
    }

    return rows.map((r) => ({
      ...r,
      categories: byProvider.get(r.user_id) ?? [],
    }));
  });

export const getProviderById = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.string().uuid().parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: provider, error } = await supabase
      .from("public_providers")
      .select(PROVIDER_COLUMNS)
      .eq("user_id", data)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!provider) return null;

    const { data: cats } = await supabase
      .from("provider_categories")
      .select("category:categories(id, name, slug, icon)")
      .eq("provider_id", data);

    return {
      ...provider,
      categories: (cats ?? [])
        .map((c) => c.category as { id: string; name: string; slug: string; icon: string | null } | null)
        .filter((c): c is { id: string; name: string; slug: string; icon: string | null } => !!c),
    };
  });