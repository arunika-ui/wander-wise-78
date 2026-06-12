import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getTripBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: trip, error } = await supabaseAdmin
      .from("trips")
      .select("id, slug, client_name, title, tagline, expiry_date, created_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!trip) return { trip: null };

    if (trip.expiry_date && new Date(trip.expiry_date) < new Date()) {
      return { trip: null, expired: true as const };
    }

    const [{ data: legs }, { data: docs }] = await Promise.all([
      supabaseAdmin
        .from("trip_legs")
        .select(
          "id, country_code, city_name, start_date, end_date, order_index, itinerary_days(id, day_number, date, title, activities(id, time, title, description, location, image_keywords, order_index))",
        )
        .eq("trip_id", trip.id)
        .order("order_index", { ascending: true }),
      supabaseAdmin
        .from("trip_documents")
        .select("id, file_path, file_name, mime_type, size_bytes")
        .eq("trip_id", trip.id),
    ]);

    const codes = Array.from(new Set((legs ?? []).map((l) => l.country_code)));
    const [{ data: countries }, { data: laws }, { data: emergency }, { data: apps }, { data: phrases }] =
      await Promise.all([
        supabaseAdmin.from("countries_ref").select("*").in("code", codes.length ? codes : ["__"]),
        supabaseAdmin.from("laws_ref").select("*").in("country_code", codes.length ? codes : ["__"]),
        supabaseAdmin
          .from("emergency_ref")
          .select("*")
          .in("country_code", codes.length ? codes : ["__"]),
        supabaseAdmin
          .from("local_apps_ref")
          .select("*")
          .in("country_code", codes.length ? codes : ["__"]),
        supabaseAdmin
          .from("language_phrases_ref")
          .select("*")
          .in("country_code", codes.length ? codes : ["__"]),
      ]);

    const signedDocs = await Promise.all(
      (docs ?? []).map(async (d) => {
        const { data: signed } = await supabaseAdmin.storage
          .from("trip-documents")
          .createSignedUrl(d.file_path, 60 * 60);
        return { ...d, url: signed?.signedUrl ?? null };
      }),
    );

    // Normalize and sort
    const sortedLegs = (legs ?? []).map((l) => ({
      ...l,
      itinerary_days: (l.itinerary_days ?? [])
        .map((day) => ({
          ...day,
          activities: (day.activities ?? []).sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
          ),
        }))
        .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0)),
    }));

    return {
      trip,
      legs: sortedLegs,
      countries: countries ?? [],
      laws: laws ?? [],
      emergency: emergency ?? [],
      apps: apps ?? [],
      phrases: phrases ?? [],
      documents: signedDocs,
    };
  });
