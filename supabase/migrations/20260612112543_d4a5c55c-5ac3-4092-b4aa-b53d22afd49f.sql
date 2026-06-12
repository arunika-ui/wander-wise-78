
-- ===== ROLES =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== UPDATED_AT TRIGGER FUNCTION =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== REFERENCE: COUNTRIES =====
CREATE TABLE public.countries_ref (
  code TEXT PRIMARY KEY,           -- ISO alpha-2
  name TEXT NOT NULL,
  flag_emoji TEXT,
  currency TEXT,
  dial_code TEXT,
  languages TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.countries_ref TO anon, authenticated;
GRANT ALL ON public.countries_ref TO service_role;
ALTER TABLE public.countries_ref ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read countries" ON public.countries_ref FOR SELECT USING (true);
CREATE POLICY "Admins manage countries" ON public.countries_ref FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== REFERENCE: CITIES =====
CREATE TABLE public.cities_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES public.countries_ref(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (country_code, name)
);
CREATE INDEX ON public.cities_ref(country_code);
GRANT SELECT ON public.cities_ref TO anon, authenticated;
GRANT ALL ON public.cities_ref TO service_role;
ALTER TABLE public.cities_ref ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cities" ON public.cities_ref FOR SELECT USING (true);
CREATE POLICY "Admins manage cities" ON public.cities_ref FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== REFERENCE: LAWS =====
CREATE TABLE public.laws_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES public.countries_ref(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,                   -- e.g. 'etiquette','law','custom'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.laws_ref(country_code);
GRANT SELECT ON public.laws_ref TO anon, authenticated;
GRANT ALL ON public.laws_ref TO service_role;
ALTER TABLE public.laws_ref ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read laws" ON public.laws_ref FOR SELECT USING (true);
CREATE POLICY "Admins manage laws" ON public.laws_ref FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== REFERENCE: EMERGENCY CONTACTS =====
CREATE TABLE public.emergency_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES public.countries_ref(code) ON DELETE CASCADE,
  contact_type TEXT NOT NULL,      -- 'embassy','police','ambulance','hospital','fire'
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.emergency_ref(country_code);
GRANT SELECT ON public.emergency_ref TO anon, authenticated;
GRANT ALL ON public.emergency_ref TO service_role;
ALTER TABLE public.emergency_ref ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read emergency" ON public.emergency_ref FOR SELECT USING (true);
CREATE POLICY "Admins manage emergency" ON public.emergency_ref FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== REFERENCE: LOCAL APPS =====
CREATE TABLE public.local_apps_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES public.countries_ref(code) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  description TEXT,
  category TEXT,                   -- 'transport','food','payment','communication'
  ios_url TEXT,
  android_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.local_apps_ref(country_code);
GRANT SELECT ON public.local_apps_ref TO anon, authenticated;
GRANT ALL ON public.local_apps_ref TO service_role;
ALTER TABLE public.local_apps_ref ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read local_apps" ON public.local_apps_ref FOR SELECT USING (true);
CREATE POLICY "Admins manage local_apps" ON public.local_apps_ref FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== REFERENCE: LANGUAGE PHRASES =====
CREATE TABLE public.language_phrases_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES public.countries_ref(code) ON DELETE CASCADE,
  language TEXT NOT NULL,          -- 'fr','it'
  english TEXT NOT NULL,
  translation TEXT,                -- nullable until DeepL fills it
  category TEXT,                   -- 'greeting','food','transport','emergency'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.language_phrases_ref(country_code);
GRANT SELECT ON public.language_phrases_ref TO anon, authenticated;
GRANT ALL ON public.language_phrases_ref TO service_role;
ALTER TABLE public.language_phrases_ref ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read phrases" ON public.language_phrases_ref FOR SELECT USING (true);
CREATE POLICY "Admins manage phrases" ON public.language_phrases_ref FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== TRIPS =====
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  title TEXT,
  tagline TEXT,
  expiry_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.trips(slug);
GRANT SELECT ON public.trips TO anon, authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Admins manage trips" ON public.trips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== TRIP LEGS =====
CREATE TABLE public.trip_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL REFERENCES public.countries_ref(code),
  city_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.trip_legs(trip_id);
GRANT SELECT ON public.trip_legs TO anon, authenticated;
GRANT ALL ON public.trip_legs TO service_role;
ALTER TABLE public.trip_legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read legs" ON public.trip_legs FOR SELECT USING (true);
CREATE POLICY "Admins manage legs" ON public.trip_legs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== ITINERARY DAYS =====
CREATE TABLE public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leg_id UUID NOT NULL REFERENCES public.trip_legs(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  date DATE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.itinerary_days(leg_id);
GRANT SELECT ON public.itinerary_days TO anon, authenticated;
GRANT ALL ON public.itinerary_days TO service_role;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read days" ON public.itinerary_days FOR SELECT USING (true);
CREATE POLICY "Admins manage days" ON public.itinerary_days FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== ACTIVITIES =====
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  time TEXT,                          -- '09:30'
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,                      -- 'Eiffel Tower, Paris'
  image_keywords TEXT,                -- for Unsplash source URL
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.activities(day_id);
GRANT SELECT ON public.activities TO anon, authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Admins manage activities" ON public.activities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== TRIP DOCUMENTS =====
CREATE TABLE public.trip_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,            -- storage path inside 'trip-documents' bucket
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.trip_documents(trip_id);
GRANT SELECT ON public.trip_documents TO anon, authenticated;
GRANT ALL ON public.trip_documents TO service_role;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trip_documents" ON public.trip_documents FOR SELECT USING (true);
CREATE POLICY "Admins manage trip_documents" ON public.trip_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
