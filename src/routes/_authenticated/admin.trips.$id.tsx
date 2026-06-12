import { createFileRoute } from "@tanstack/react-router";
import { TripForm } from "@/components/admin/TripForm";

export const Route = createFileRoute("/_authenticated/admin/trips/$id")({
  component: Edit,
});

function Edit() {
  const { id } = Route.useParams();
  return <TripForm tripId={id} />;
}
