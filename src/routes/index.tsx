import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trip Companion — personalized travel itineraries" },
      { name: "description", content: "A personalized travel companion for every trip." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-xl text-center space-y-6">
        <p className="font-script text-3xl text-accent">your journey, made simple</p>
        <h1 className="font-serif text-5xl md:text-6xl text-foreground">Trip Companion</h1>
        <p className="text-muted-foreground">
          Personalised itineraries, local know-how and documents — all in one elegant link.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-widest">
          <Link to="/auth" className="hover:text-accent">Admin sign-in →</Link>
        </div>
      </div>
    </div>
  );
}
