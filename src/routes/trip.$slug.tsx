import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef } from "react";
import { getTripBySlug } from "@/lib/trip.functions";
import { MapPin, Phone, BookOpen, Smartphone, Languages, FileText, Calendar } from "lucide-react";

const tripQuery = (slug: string) => ({
  queryKey: ["trip", slug],
  queryFn: () => getTripBySlug({ data: { slug } }),
});

export const Route = createFileRoute("/trip/$slug")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(tripQuery(params.slug));
    if (!result.trip) throw notFound();
    return null;
  },
  head: ({ params }) => ({
    meta: [
      { title: `Trip — ${params.slug}` },
      { name: "description", content: "Your personal travel companion." },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: TripPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-3 max-w-md">
        <p className="font-script text-2xl text-accent">oh dear</p>
        <h1 className="font-serif text-4xl">Trip not found</h1>
        <p className="text-sm text-muted-foreground">
          This link may have expired or the address is incorrect.
        </p>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-3 max-w-md">
        <h1 className="font-serif text-3xl">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function TripPage() {
  const { slug } = Route.useParams();
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TripContent slug={slug} />
    </Suspense>
  );
}

function TripContent({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery(tripQuery(slug));
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (heroRef.current) {
      heroRef.current.style.opacity = "0";
      heroRef.current.style.transform = "translateY(20px)";
      requestAnimationFrame(() => {
        if (!heroRef.current) return;
        heroRef.current.style.transition = "opacity 900ms ease, transform 900ms ease";
        heroRef.current.style.opacity = "1";
        heroRef.current.style.transform = "translateY(0)";
      });
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    sectionRefs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity 700ms ease, transform 700ms ease";
      io.observe(el);
    });
    return () => io.disconnect();
  }, [data]);

  const setRef = (i: number) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current[i] = el;
  };

  if (!data.trip) return null;
  const { trip, legs, countries, laws, emergency, apps, phrases, documents } = data;
  const countryByCode = Object.fromEntries(countries.map((c) => [c.code, c]));
  const cities = legs.map((l) => l.city_name).join(" · ");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center border-b border-border"
      >
        <p className="font-script text-3xl md:text-4xl text-accent mb-3">bon voyage</p>
        <h1 className="font-serif text-5xl md:text-7xl leading-tight tracking-tight">
          {trip.title ?? `${trip.client_name}'s journey`}
        </h1>
        {trip.tagline && (
          <p className="mt-4 font-serif italic text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
            {trip.tagline}
          </p>
        )}
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">{cities}</p>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-24">
        {/* Itinerary */}
        <section ref={setRef(0)}>
          <SectionTitle icon={<Calendar className="h-4 w-4" />} kicker="day by day" title="Itinerary" />
          <div className="mt-10 space-y-16">
            {legs.map((leg) => {
              const country = countryByCode[leg.country_code];
              return (
                <div key={leg.id}>
                  <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-border">
                    <span className="text-2xl">{country?.flag_emoji ?? "🧳"}</span>
                    <h3 className="font-serif text-3xl">{leg.city_name}</h3>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      {country?.name}
                    </span>
                  </div>
                  <div className="space-y-10">
                    {leg.itinerary_days.map((day) => (
                      <div key={day.id} className="grid md:grid-cols-[120px_1fr] gap-4 md:gap-8">
                        <div>
                          <p className="font-script text-2xl text-accent">day {day.day_number}</p>
                          {day.date && (
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                              {new Date(day.date).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                        <div className="space-y-6">
                          {day.title && <h4 className="font-serif text-2xl">{day.title}</h4>}
                          {day.activities.map((a) => (
                            <div key={a.id} className="border-l-2 border-accent/40 pl-4">
                              {a.time && (
                                <p className="text-xs uppercase tracking-widest text-accent">
                                  {a.time}
                                </p>
                              )}
                              <p className="font-serif text-xl mt-1">{a.title}</p>
                              {a.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" /> {a.location}
                                </p>
                              )}
                              {a.description && (
                                <p className="text-sm mt-2 leading-relaxed">{a.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Laws & etiquette */}
        {laws.length > 0 && (
          <section ref={setRef(1)}>
            <SectionTitle icon={<BookOpen className="h-4 w-4" />} kicker="know before you go" title="Local laws & etiquette" />
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {laws.map((l) => (
                <div key={l.id} className="bg-card border border-border p-5 rounded">
                  <p className="text-xs uppercase tracking-widest text-accent mb-2">{l.category}</p>
                  <h4 className="font-serif text-lg">{l.title}</h4>
                  {l.description && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{l.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Emergency */}
        {emergency.length > 0 && (
          <section ref={setRef(2)}>
            <SectionTitle icon={<Phone className="h-4 w-4" />} kicker="in case of" title="Emergency contacts" />
            <div className="mt-8 space-y-3">
              {emergency.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-4 py-4 border-b border-border">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{e.contact_type}</p>
                    <p className="font-serif text-lg">{e.name}</p>
                    {e.address && <p className="text-sm text-muted-foreground">{e.address}</p>}
                    {e.notes && <p className="text-sm text-muted-foreground italic mt-1">{e.notes}</p>}
                  </div>
                  {e.phone && (
                    <a
                      href={`tel:${e.phone}`}
                      className="text-accent font-serif text-lg whitespace-nowrap hover:underline"
                    >
                      {e.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Apps */}
        {apps.length > 0 && (
          <section ref={setRef(3)}>
            <SectionTitle icon={<Smartphone className="h-4 w-4" />} kicker="handy" title="Local apps" />
            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              {apps.map((a) => (
                <div key={a.id} className="bg-card border border-border p-4 rounded">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-serif text-lg">{a.app_name}</h4>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{a.category}</span>
                  </div>
                  {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                  <div className="flex gap-3 mt-3 text-xs uppercase tracking-widest">
                    {a.ios_url && (
                      <a href={a.ios_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        iOS
                      </a>
                    )}
                    {a.android_url && (
                      <a href={a.android_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        Android
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Phrases */}
        {phrases.length > 0 && (
          <section ref={setRef(4)}>
            <SectionTitle icon={<Languages className="h-4 w-4" />} kicker="speak the language" title="Useful phrases" />
            <div className="mt-8 space-y-2">
              {phrases.map((p) => (
                <div key={p.id} className="grid grid-cols-2 gap-4 py-3 border-b border-border">
                  <p className="text-sm text-muted-foreground">{p.english}</p>
                  <p className="font-serif text-lg italic">{p.translation}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <section ref={setRef(5)}>
            <SectionTitle icon={<FileText className="h-4 w-4" />} kicker="your papers" title="Documents" />
            <div className="mt-8 space-y-2">
              {documents.map((d) => (
                <a
                  key={d.id}
                  href={d.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 py-4 border-b border-border hover:text-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4" />
                    <span className="font-serif text-lg">{d.file_name}</span>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Open
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center pt-12 border-t border-border">
          <p className="font-script text-2xl text-accent">safe travels</p>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-2">
            Trip Companion
          </p>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  kicker,
  title,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 text-accent mb-3">
        {icon}
        <span className="font-script text-xl">{kicker}</span>
      </div>
      <h2 className="font-serif text-4xl md:text-5xl">{title}</h2>
    </div>
  );
}
