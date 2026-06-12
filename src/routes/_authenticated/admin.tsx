import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setIsAdmin(false);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isAdmin === null) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h1 className="font-serif text-2xl">Not an admin</h1>
        <p className="text-sm text-muted-foreground">
          Your account isn't an admin. Ask an existing admin to grant access.
        </p>
        <Button variant="ghost-outline" onClick={signOut}>Sign out</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/admin" className="flex items-baseline gap-2">
            <span className="font-script text-xl text-accent">trip</span>
            <span className="font-serif text-xl">Companion</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground ml-2">admin</span>
          </Link>
          <nav className="flex items-center gap-6 text-xs uppercase tracking-widest">
            <Link to="/admin" className="hover:text-accent" activeOptions={{ exact: true }}>Trips</Link>
            <Link to="/admin/trips/new" className="hover:text-accent">New trip</Link>
            <Link to="/admin/reference" className="hover:text-accent">Reference</Link>
            <button onClick={signOut} className="hover:text-accent">Sign out</button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
