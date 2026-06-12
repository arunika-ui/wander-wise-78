import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { buildTripSlug } from "@/lib/slug";
import { useServerFn } from "@tanstack/react-start";
import { seedCountries, seedCitiesForCountry } from "@/lib/admin.functions";

interface Country {
  code: string;
  name: string;
  flag_emoji: string | null;
}

interface City {
  id: string;
  name: string;
}

interface ActivityDraft {
  id?: string;
  time: string;
  title: string;
  description: string;
  location: string;
  image_keywords: string;
  order_index: number;
}
interface DayDraft {
  id?: string;
  day_number: number;
  date: string;
  title: string;
  activities: ActivityDraft[];
}
interface LegDraft {
  id?: string;
  country_code: string;
  city_name: string;
  start_date: string;
  end_date: string;
  order_index: number;
  days: DayDraft[];
}
interface DocDraft {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
}

export function TripForm({ tripId }: { tripId?: string }) {
  const navigate = useNavigate();
  const seedC = useServerFn(seedCountries);
  const seedCities = useServerFn(seedCitiesForCountry);

  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [expiry, setExpiry] = useState("");
  const [slug, setSlug] = useState("");
  const [legs, setLegs] = useState<LegDraft[]>([]);
  const [docs, setDocs] = useState<DocDraft[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [citiesByCode, setCitiesByCode] = useState<Record<string, City[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load countries (seed if empty)
  useEffect(() => {
    (async () => {
      let { data } = await supabase.from("countries_ref").select("code, name, flag_emoji").order("name");
      if (!data || data.length === 0) {
        toast.message("Loading country reference data…");
        try {
          await seedC({});
          const r = await supabase.from("countries_ref").select("code, name, flag_emoji").order("name");
          data = r.data;
        } catch (e) {
          toast.error("Couldn't fetch countries: " + (e as Error).message);
        }
      }
      setCountries((data ?? []) as Country[]);
    })();
  }, [seedC]);

  // Load existing trip
  useEffect(() => {
    if (!tripId) return;
    (async () => {
      setLoading(true);
      const { data: t } = await supabase.from("trips").select("*").eq("id", tripId).single();
      if (t) {
        setClientName(t.client_name);
        setTitle(t.title ?? "");
        setTagline(t.tagline ?? "");
        setExpiry(t.expiry_date);
        setSlug(t.slug);
      }
      const { data: legRows } = await supabase
        .from("trip_legs")
        .select("*")
        .eq("trip_id", tripId)
        .order("order_index");
      const loadedLegs: LegDraft[] = [];
      for (const l of legRows ?? []) {
        const { data: dayRows } = await supabase
          .from("itinerary_days")
          .select("*")
          .eq("leg_id", l.id)
          .order("day_number");
        const days: DayDraft[] = [];
        for (const d of dayRows ?? []) {
          const { data: actRows } = await supabase
            .from("activities")
            .select("*")
            .eq("day_id", d.id)
            .order("order_index");
          days.push({
            id: d.id,
            day_number: d.day_number,
            date: d.date ?? "",
            title: d.title ?? "",
            activities: (actRows ?? []).map((a) => ({
              id: a.id,
              time: a.time ?? "",
              title: a.title,
              description: a.description ?? "",
              location: a.location ?? "",
              image_keywords: a.image_keywords ?? "",
              order_index: a.order_index,
            })),
          });
        }
        loadedLegs.push({
          id: l.id,
          country_code: l.country_code,
          city_name: l.city_name,
          start_date: l.start_date ?? "",
          end_date: l.end_date ?? "",
          order_index: l.order_index,
          days,
        });
      }
      setLegs(loadedLegs);
      const { data: dRows } = await supabase
        .from("trip_documents")
        .select("id, file_path, file_name, mime_type")
        .eq("trip_id", tripId);
      setDocs((dRows ?? []) as DocDraft[]);
      setLoading(false);
    })();
  }, [tripId]);

  // Ensure cities loaded for a given country
  async function ensureCities(code: string) {
    if (citiesByCode[code]) return;
    let { data } = await supabase.from("cities_ref").select("id, name").eq("country_code", code).order("name");
    if (!data || data.length === 0) {
      try {
        await seedCities({ data: { countryCode: code } });
        const r = await supabase.from("cities_ref").select("id, name").eq("country_code", code).order("name");
        data = r.data;
      } catch (e) {
        toast.error("Couldn't fetch cities: " + (e as Error).message);
      }
    }
    setCitiesByCode((p) => ({ ...p, [code]: (data ?? []) as City[] }));
  }

  // Auto-load cities for legs already set
  useEffect(() => {
    legs.forEach((l) => l.country_code && ensureCities(l.country_code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legs.length]);

  // Slug preview
  const previewSlug = useMemo(() => {
    if (slug) return slug;
    return buildTripSlug({
      clientName,
      firstCity: legs[0]?.city_name,
      expiry,
    });
  }, [slug, clientName, legs, expiry]);

  // ---- Leg / Day / Activity manipulation ----
  function addLeg() {
    setLegs((p) => [
      ...p,
      { country_code: "", city_name: "", start_date: "", end_date: "", order_index: p.length, days: [] },
    ]);
  }
  function updateLeg(i: number, patch: Partial<LegDraft>) {
    setLegs((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    if (patch.country_code) ensureCities(patch.country_code);
  }
  function removeLeg(i: number) {
    setLegs((p) => p.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, order_index: idx })));
  }
  function addDay(li: number) {
    setLegs((p) =>
      p.map((l, idx) =>
        idx === li
          ? { ...l, days: [...l.days, { day_number: l.days.length + 1, date: "", title: "", activities: [] }] }
          : l,
      ),
    );
  }
  function updateDay(li: number, di: number, patch: Partial<DayDraft>) {
    setLegs((p) =>
      p.map((l, idx) =>
        idx === li ? { ...l, days: l.days.map((d, j) => (j === di ? { ...d, ...patch } : d)) } : l,
      ),
    );
  }
  function removeDay(li: number, di: number) {
    setLegs((p) =>
      p.map((l, idx) =>
        idx === li
          ? { ...l, days: l.days.filter((_, j) => j !== di).map((d, j) => ({ ...d, day_number: j + 1 })) }
          : l,
      ),
    );
  }
  function addActivity(li: number, di: number) {
    updateDay(li, di, {
      activities: [
        ...legs[li].days[di].activities,
        {
          time: "",
          title: "",
          description: "",
          location: "",
          image_keywords: "",
          order_index: legs[li].days[di].activities.length,
        },
      ],
    });
  }
  function updateActivity(li: number, di: number, ai: number, patch: Partial<ActivityDraft>) {
    setLegs((p) =>
      p.map((l, idx) =>
        idx === li
          ? {
              ...l,
              days: l.days.map((d, j) =>
                j === di
                  ? { ...d, activities: d.activities.map((a, k) => (k === ai ? { ...a, ...patch } : a)) }
                  : d,
              ),
            }
          : l,
      ),
    );
  }
  function removeActivity(li: number, di: number, ai: number) {
    setLegs((p) =>
      p.map((l, idx) =>
        idx === li
          ? {
              ...l,
              days: l.days.map((d, j) =>
                j === di
                  ? { ...d, activities: d.activities.filter((_, k) => k !== ai).map((a, k) => ({ ...a, order_index: k })) }
                  : d,
              ),
            }
          : l,
      ),
    );
  }

  // ---- Documents ----
  async function handleUpload(files: FileList | null) {
    if (!files || !tripId) {
      if (!tripId) toast.error("Save the trip first, then upload documents.");
      return;
    }
    for (const file of Array.from(files)) {
      const path = `${tripId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("trip-documents").upload(path, file);
      if (upErr) {
        toast.error(upErr.message);
        continue;
      }
      const { data, error } = await supabase
        .from("trip_documents")
        .insert({
          trip_id: tripId,
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select("id, file_path, file_name, mime_type")
        .single();
      if (error) toast.error(error.message);
      else if (data) setDocs((p) => [...p, data as DocDraft]);
    }
    toast.success("Uploaded");
  }
  async function deleteDoc(d: DocDraft) {
    await supabase.storage.from("trip-documents").remove([d.file_path]);
    await supabase.from("trip_documents").delete().eq("id", d.id);
    setDocs((p) => p.filter((x) => x.id !== d.id));
  }

  // ---- Save ----
  async function save() {
    if (!clientName || !expiry) {
      toast.error("Client name and expiry date are required");
      return;
    }
    setSaving(true);
    try {
      const finalSlug = slug || previewSlug;
      let id = tripId;
      if (!id) {
        const { data, error } = await supabase
          .from("trips")
          .insert({
            slug: finalSlug,
            client_name: clientName,
            title: title || null,
            tagline: tagline || null,
            expiry_date: expiry,
          })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
      } else {
        const { error } = await supabase
          .from("trips")
          .update({
            slug: finalSlug,
            client_name: clientName,
            title: title || null,
            tagline: tagline || null,
            expiry_date: expiry,
          })
          .eq("id", id);
        if (error) throw error;
      }

      // Replace legs/days/activities entirely (simplest correct strategy)
      await supabase.from("trip_legs").delete().eq("trip_id", id);
      for (const leg of legs) {
        if (!leg.country_code || !leg.city_name) continue;
        const { data: legRow, error: legErr } = await supabase
          .from("trip_legs")
          .insert({
            trip_id: id,
            country_code: leg.country_code,
            city_name: leg.city_name,
            start_date: leg.start_date || null,
            end_date: leg.end_date || null,
            order_index: leg.order_index,
          })
          .select("id")
          .single();
        if (legErr) throw legErr;
        for (const day of leg.days) {
          const { data: dayRow, error: dayErr } = await supabase
            .from("itinerary_days")
            .insert({
              leg_id: legRow.id,
              day_number: day.day_number,
              date: day.date || null,
              title: day.title || null,
            })
            .select("id")
            .single();
          if (dayErr) throw dayErr;
          if (day.activities.length > 0) {
            const { error: actErr } = await supabase.from("activities").insert(
              day.activities.map((a) => ({
                day_id: dayRow.id,
                time: a.time || null,
                title: a.title,
                description: a.description || null,
                location: a.location || null,
                image_keywords: a.image_keywords || null,
                order_index: a.order_index,
              })),
            );
            if (actErr) throw actErr;
          }
        }
      }

      toast.success("Trip saved");
      if (!tripId) navigate({ to: "/admin/trips/$id", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-12">
      <div className="border-b border-border pb-6">
        <p className="font-script text-2xl text-accent">{tripId ? "editing" : "new"}</p>
        <h1 className="font-serif text-4xl">{tripId ? clientName || "Trip" : "Create trip"}</h1>
      </div>

      {/* Basics */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl">Basics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Client name *</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Sharma family" />
          </div>
          <div className="space-y-2">
            <Label>Expiry date *</Label>
            <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Trip title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paris & Rome 2026" />
          </div>
          <div className="space-y-2">
            <Label>Tagline (italic script)</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="First time to the city of lights?" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Slug (URL)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={previewSlug} />
            <p className="text-xs text-muted-foreground">/trip/{slug || previewSlug}</p>
          </div>
        </div>
      </section>

      {/* Legs */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Itinerary legs</h2>
          <Button variant="ghost-outline" onClick={addLeg}>+ Add leg</Button>
        </div>
        {legs.length === 0 && <p className="text-muted-foreground italic">Add a leg to start building.</p>}
        {legs.map((leg, li) => (
          <div key={li} className="border border-border p-6 space-y-6 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl">Leg {li + 1}</h3>
              <button onClick={() => removeLeg(li)} className="text-xs uppercase tracking-widest text-destructive">Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={leg.country_code} onValueChange={(v) => updateLeg(li, { country_code: v, city_name: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.flag_emoji} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={leg.city_name} onValueChange={(v) => updateLeg(li, { city_name: v })} disabled={!leg.country_code}>
                  <SelectTrigger><SelectValue placeholder={leg.country_code ? "Select…" : "Pick country first"} /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {(citiesByCode[leg.country_code] ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={leg.start_date} onChange={(e) => updateLeg(li, { start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="date" value={leg.end_date} onChange={(e) => updateLeg(li, { end_date: e.target.value })} />
              </div>
            </div>

            {/* Days */}
            <div className="space-y-4 pl-4 border-l border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Days</h4>
                <Button size="sm" variant="ghost-outline" onClick={() => addDay(li)}>+ Day</Button>
              </div>
              {leg.days.map((day, di) => (
                <div key={di} className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-lg">Day {day.day_number}</span>
                    <Input type="date" value={day.date} onChange={(e) => updateDay(li, di, { date: e.target.value })} className="max-w-[180px]" />
                    <Input value={day.title} onChange={(e) => updateDay(li, di, { title: e.target.value })} placeholder="Title (e.g. Arrival)" className="flex-1" />
                    <button onClick={() => removeDay(li, di)} className="text-xs text-destructive">×</button>
                  </div>
                  <div className="pl-4 space-y-2">
                    {day.activities.map((a, ai) => (
                      <div key={ai} className="grid grid-cols-12 gap-2 items-start">
                        <Input placeholder="09:30" className="col-span-2" value={a.time} onChange={(e) => updateActivity(li, di, ai, { time: e.target.value })} />
                        <Input placeholder="Title" className="col-span-3" value={a.title} onChange={(e) => updateActivity(li, di, ai, { title: e.target.value })} />
                        <Input placeholder="Location (Google searchable)" className="col-span-3" value={a.location} onChange={(e) => updateActivity(li, di, ai, { location: e.target.value })} />
                        <Input placeholder="Image keywords" className="col-span-2" value={a.image_keywords} onChange={(e) => updateActivity(li, di, ai, { image_keywords: e.target.value })} />
                        <Textarea placeholder="Notes" rows={1} className="col-span-2" value={a.description} onChange={(e) => updateActivity(li, di, ai, { description: e.target.value })} />
                        <button onClick={() => removeActivity(li, di, ai)} className="col-span-12 text-xs uppercase tracking-widest text-destructive text-right">remove</button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost-outline" onClick={() => addActivity(li, di)}>+ Activity</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Documents */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Documents</h2>
        <p className="text-sm text-muted-foreground">View-only previews — clients cannot download.</p>
        <input type="file" multiple onChange={(e) => handleUpload(e.target.files)} className="text-sm" disabled={!tripId} />
        {!tripId && <p className="text-xs italic text-muted-foreground">Save the trip first to enable uploads.</p>}
        {docs.length > 0 && (
          <ul className="divide-y divide-border">
            {docs.map((d) => (
              <li key={d.id} className="py-2 flex items-center justify-between">
                <span className="text-sm">{d.file_name} <span className="text-xs text-muted-foreground">({d.mime_type})</span></span>
                <button onClick={() => deleteDoc(d)} className="text-xs uppercase tracking-widest text-destructive">delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-4 pt-6 border-t border-border">
        <Button variant="ghost-outline" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save trip"}</Button>
        {tripId && (
          <button
            type="button"
            className="text-xs uppercase tracking-widest text-accent hover:underline"
            onClick={() => {
              const url = `${window.location.origin}/trip/${slug || previewSlug}`;
              navigator.clipboard.writeText(url);
              toast.success("Link copied");
            }}
          >
            Copy shareable link
          </button>
        )}
      </div>
    </div>
  );
}
