import { createFileRoute } from "@tanstack/react-router";
import { TripForm } from "@/components/admin/TripForm";

export const Route = createFileRoute("/_authenticated/admin/trips/new")({
  component: () => <TripForm />,
});
