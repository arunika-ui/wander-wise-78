import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * First-user bootstrap: if there are no admins yet, promote the calling
 * authenticated user to admin. Safe because (1) requires a signed-in user and
 * (2) is a one-shot — once any admin exists, this is a no-op.
 */
export const bootstrapAdminIfNone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) return { promoted: false };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { promoted: true };
  });

/** Seed countries_ref from REST Countries (idempotent). */
export const seedCountries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,cca2,flag,currencies,idd,languages",
    );
    if (!res.ok) throw new Error(`REST Countries failed: ${res.status}`);
    const json = (await res.json()) as Array<{
      name: { common: string };
      cca2: string;
      flag?: string;
      currencies?: Record<string, { name: string }>;
      idd?: { root?: string; suffixes?: string[] };
      languages?: Record<string, string>;
    }>;

    const rows = json
      .filter((c) => c.cca2 && c.name?.common)
      .map((c) => {
        const currency = c.currencies ? Object.keys(c.currencies)[0] : null;
        const dial = c.idd?.root
          ? `${c.idd.root}${c.idd.suffixes?.[0] ?? ""}`
          : null;
        const langs = c.languages ? Object.values(c.languages) : [];
        return {
          code: c.cca2,
          name: c.name.common,
          flag_emoji: c.flag ?? null,
          currency,
          dial_code: dial,
          languages: langs,
        };
      });

    const { error } = await supabaseAdmin
      .from("countries_ref")
      .upsert(rows, { onConflict: "code" });
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });

/** Seed cities for a country from countriesnow.space (idempotent). */
export const seedCitiesForCountry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ countryCode: z.string().length(2) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // already seeded?
    const { count } = await supabaseAdmin
      .from("cities_ref")
      .select("*", { count: "exact", head: true })
      .eq("country_code", data.countryCode);
    if ((count ?? 0) > 0) return { inserted: 0, alreadySeeded: true };

    const { data: country } = await supabaseAdmin
      .from("countries_ref")
      .select("name")
      .eq("code", data.countryCode)
      .maybeSingle();
    if (!country) throw new Error("Country not found");

    const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: country.name }),
    });
    if (!res.ok) throw new Error(`countriesnow failed: ${res.status}`);
    const json = (await res.json()) as { error: boolean; data: string[] };
    if (json.error) throw new Error("countriesnow returned error");

    const unique = Array.from(new Set(json.data)).slice(0, 1000);
    const rows = unique.map((name) => ({ country_code: data.countryCode, name }));
    if (rows.length === 0) return { inserted: 0, alreadySeeded: false };

    const { error } = await supabaseAdmin
      .from("cities_ref")
      .upsert(rows, { onConflict: "country_code,name" });
    if (error) throw new Error(error.message);
    return { inserted: rows.length, alreadySeeded: false };
  });
