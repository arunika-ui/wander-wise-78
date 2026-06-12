import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/trip/$slug")({
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md">
        <p className="font-script text-2xl text-accent">coming up next</p>
        <h1 className="font-serif text-4xl">Client trip page</h1>
        <p className="text-sm text-muted-foreground">Step 3 will build this view.</p>
      </div>
    </div>
  ),
});
