export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function buildTripSlug(opts: {
  clientName: string;
  firstCity?: string | null;
  expiry?: string | null;
}): string {
  const year = opts.expiry ? new Date(opts.expiry).getFullYear() : new Date().getFullYear();
  const parts = [
    slugify(opts.clientName),
    opts.firstCity ? slugify(opts.firstCity) : "",
    String(year),
  ].filter(Boolean);
  return parts.join("-") || `trip-${Date.now()}`;
}
