import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { useServerFn } from "@tanstack/react-start";
import { seedCountries } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/reference")({
  component: ReferencePage,
});

interface Country { code: string; name: string; flag_emoji: string | null }
interface Law { id: string; title: string; description: string; category: string | null }
interface Emergency { id: string; contact_type: string; name: string; phone: string | null; address: string | null; notes: string | null }

function ReferencePage() {
  const seedC = useServerFn(seedCountries);
  const [countries, setCountries] = useState<Country[]>([]);
  const [code, setCode] = useState("");
  const [laws, setLaws] = useState<Law[]>([]);
  const [emerg, setEmerg] = useState<Emergency[]>([]);

  // new law form
  const [lTitle, setLTitle] = useState("");
  const [lDesc, setLDesc] = useState("");
  const [lCat, setLCat] = useState("");
  // new emergency form
  const [eType, setEType] = useState("embassy");
  const [eName, setEName] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eAddr, setEAddr] = useState("");

  async function loadCountries() {
    const { data } = await supabase.from("countries_ref").select("code, name, flag_emoji").order("name");
    setCountries((data ?? []) as Country[]);
  }
  useEffect(() => { loadCountries(); }, []);

  async function loadFor(c: string) {
    const [{ data: ls }, { data: es }] = await Promise.all([
      supabase.from("laws_ref").select("*").eq("country_code", c).order("created_at"),
      supabase.from("emergency_ref").select("*").eq("country_code", c).order("created_at"),
    ]);
    setLaws((ls ?? []) as Law[]);
    setEmerg((es ?? []) as Emergency[]);
  }
  useEffect(() => { if (code) loadFor(code); }, [code]);

  async function seedAll() {
    toast.message("Seeding countries…");
    const r = await seedC({});
    toast.success(`Seeded ${r.inserted} countries`);
    loadCountries();
  }

  async function addLaw() {
    if (!code || !lTitle || !lDesc) return;
    const { error } = await supabase.from("laws_ref").insert({ country_code: code, title: lTitle, description: lDesc, category: lCat || null });
    if (error) return toast.error(error.message);
    setLTitle(""); setLDesc(""); setLCat("");
    loadFor(code);
  }
  async function delLaw(id: string) {
    await supabase.from("laws_ref").delete().eq("id", id);
    loadFor(code);
  }
  async function addEmerg() {
    if (!code || !eName) return;
    const { error } = await supabase.from("emergency_ref").insert({ country_code: code, contact_type: eType, name: eName, phone: ePhone || null, address: eAddr || null });
    if (error) return toast.error(error.message);
    setEName(""); setEPhone(""); setEAddr("");
    loadFor(code);
  }
  async function delEmerg(id: string) {
    await supabase.from("emergency_ref").delete().eq("id", id);
    loadFor(code);
  }

  return (
    <div className="space-y-10">
      <div className="border-b border-border pb-6 flex items-end justify-between">
        <div>
          <p className="font-script text-2xl text-accent">manage</p>
          <h1 className="font-serif text-4xl">Reference data</h1>
        </div>
        <Button variant="ghost-outline" onClick={seedAll}>Refresh countries</Button>
      </div>

      <div className="max-w-md space-y-2">
        <Label>Pick country</Label>
        <Select value={code} onValueChange={setCode}>
          <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
          <SelectContent className="max-h-72">
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>{c.flag_emoji} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {code && (
        <>
          {/* Laws */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl">Laws & etiquette</h2>
            <div className="grid grid-cols-12 gap-2">
              <Input className="col-span-3" placeholder="Title" value={lTitle} onChange={(e) => setLTitle(e.target.value)} />
              <Input className="col-span-2" placeholder="Category" value={lCat} onChange={(e) => setLCat(e.target.value)} />
              <Textarea rows={1} className="col-span-6" placeholder="Description" value={lDesc} onChange={(e) => setLDesc(e.target.value)} />
              <Button className="col-span-1" variant="ghost-outline" onClick={addLaw}>Add</Button>
            </div>
            <ul className="divide-y divide-border">
              {laws.map((l) => (
                <li key={l.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-serif text-lg">{l.title} <span className="text-xs uppercase tracking-widest text-muted-foreground">{l.category}</span></div>
                    <p className="text-sm text-muted-foreground">{l.description}</p>
                  </div>
                  <button onClick={() => delLaw(l.id)} className="text-xs uppercase tracking-widest text-destructive">delete</button>
                </li>
              ))}
            </ul>
          </section>

          {/* Emergency */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl">Emergency contacts</h2>
            <div className="grid grid-cols-12 gap-2">
              <Select value={eType} onValueChange={setEType}>
                <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["embassy","police","ambulance","hospital","fire"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input className="col-span-3" placeholder="Name" value={eName} onChange={(e) => setEName(e.target.value)} />
              <Input className="col-span-2" placeholder="Phone" value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
              <Input className="col-span-4" placeholder="Address" value={eAddr} onChange={(e) => setEAddr(e.target.value)} />
              <Button className="col-span-1" variant="ghost-outline" onClick={addEmerg}>Add</Button>
            </div>
            <ul className="divide-y divide-border">
              {emerg.map((e) => (
                <li key={e.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-serif text-lg">{e.name} <span className="text-xs uppercase tracking-widest text-accent">{e.contact_type}</span></div>
                    <p className="text-sm text-muted-foreground">{[e.phone, e.address].filter(Boolean).join(" · ")}</p>
                  </div>
                  <button onClick={() => delEmerg(e.id)} className="text-xs uppercase tracking-widest text-destructive">delete</button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
