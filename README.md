# Wander Wise — Client Trip Companion

A private, shareable **trip companion** for travel-agency clients. The agency builds a multi-country trip in an
admin panel; the traveller gets one link with their **day-by-day itinerary, travel documents and country
essentials** — emergency numbers, local laws, useful apps and language phrases — for every country they visit.

Built for the [TRIPPLANNERS](https://github.com/arunika-ui) travel business as a companion to its booking platform.

![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack_Start-FF4154?logo=reactquery&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

## Features

**For travellers** (`/trip/:slug`, no login needed)
- Multi-leg itinerary: countries and cities → days → timed activities with locations
- Travel documents (tickets, visas, vouchers) attached to the trip
- Per-country essentials pulled automatically for every country on the route:
  emergency numbers, local laws to know, recommended local apps, key phrases in the local language
- Links **expire** after the trip, so personal details are not left online

**For the agency** (`/admin`, authenticated)
- Trip builder: client, legs, days, activities and document uploads
- Reference library of countries, cities, laws, emergency contacts, apps and phrases, written once and
  reused across every trip

## Security

- **Row Level Security** on every table in PostgreSQL: the public can only read reference data; trips and
  documents are served through server functions that check the slug and expiry date.
- **Role-based access** (`user_roles`): only admins can create trips or edit reference data.
- All server inputs are validated with **Zod**.

## Data model

```
trips ─┬─ trip_legs (country, city, dates) ── itinerary_days ── activities
       └─ trip_documents

countries_ref · cities_ref · laws_ref · emergency_ref · local_apps_ref · language_phrases_ref
user_roles
```

## Tech stack

| Area | Tools |
| --- | --- |
| App | React 19, TypeScript, TanStack Start (SSR + server functions), TanStack Router & Query |
| UI | Tailwind CSS, Radix UI / shadcn, Recharts |
| Backend | Supabase: PostgreSQL, Auth, Storage, Row Level Security, SQL migrations |
| Validation | Zod |
| Build | Vite, Bun |

## Run locally

```bash
bun install
cp .env.example .env    # Supabase URL + anon key + service role key
bun run dev
```

Database schema: `supabase/migrations/`.

---

Built by [Arunika Jain](https://github.com/arunika-ui).
