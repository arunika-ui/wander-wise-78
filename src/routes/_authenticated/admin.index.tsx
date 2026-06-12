import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Trip {
  id: string;
  slug: string;
  client_name: string;
  expiry_date: string;
  created_at: string;
}

export const Route = createFileRoute("/_authenticated/admin/")({
  component: TripsList,
});

function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("id, slug, client_name, expiry_date, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setTrips((data ?? []) as Trip[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this trip?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Trip deleted");
    load();
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/trip/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="font-script text-2xl text-accent">your clients</p>
          <h1 className="font-serif text-4xl">Trips</h1>
        </div>
        <Link to="/admin/trips/new">
          <Button variant="ghost-outline">+ New trip</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : trips.length === 0 ? (
        <p className="text-muted-foreground italic">No trips yet. Create your first one.</p>
      ) : (
        <div className="divide-y divide-border">
          {trips.map((t) => {
            const expired = new Date(t.expiry_date) < new Date();
            return (
              <div key={t.id} className="py-6 flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl">{t.client_name}</h3>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    /{t.slug} · expires {new Date(t.expiry_date).toLocaleDateString()}
                    {expired && <span className="text-destructive ml-2">EXPIRED</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost-outline" onClick={() => copyLink(t.slug)}>Copy link</Button>
                  <Link to="/trip/$slug" params={{ slug: t.slug }} target="_blank">
                    <Button size="sm" variant="ghost-outline">View</Button>
                  </Link>
                  <Link to="/admin/trips/$id" params={{ id: t.id }}>
                    <Button size="sm" variant="ghost-outline">Edit</Button>
                  </Link>
                  <Button size="sm" variant="ghost-outline" onClick={() => remove(t.id)}>Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
