-- =============================================================================
-- SkillNest Nigeria — Production Supabase PostgreSQL Schema, RLS & Seed Data
-- =============================================================================
-- Run this SQL script in your Supabase Project -> SQL Editor.
-- Covers: Profiles & Roles, Categories, Provider Profiles, Services, Portfolios,
-- Service Requests, Inquiries & Messages, Reviews, Saved Providers, Verification
-- Submissions, Contact Submissions, Storage Buckets, and Row Level Security.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('client', 'provider', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inquiry_status AS ENUM ('new', 'replied', 'quoted', 'accepted', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('open', 'in_review', 'assigned', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- Users / Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  location TEXT NOT NULL DEFAULT 'Victoria Island, Lagos',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Briefcase',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider Profiles (1:1 with profiles where role = 'provider')
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  headline TEXT NOT NULL,
  bio TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  location TEXT NOT NULL DEFAULT 'Lekki Phase 1, Lagos',
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  starting_price_ngn INTEGER NOT NULL DEFAULT 25000 CHECK (starting_price_ngn >= 0),
  years_experience INTEGER NOT NULL DEFAULT 1 CHECK (years_experience >= 0),
  response_time TEXT NOT NULL DEFAULT 'Within 2 hours',
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  review_count INTEGER NOT NULL DEFAULT 0,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  verification_notes TEXT,
  cac_registered BOOLEAN NOT NULL DEFAULT FALSE,
  nin_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider Services / Rate Card
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_ngn INTEGER NOT NULL CHECK (price_ngn >= 0),
  price_unit TEXT NOT NULL DEFAULT 'fixed' CHECK (price_unit IN ('fixed', 'hourly', 'per_day', 'starting_at')),
  delivery_estimate TEXT NOT NULL DEFAULT '3-5 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider Portfolio Items (images stored in Supabase Storage 'portfolios' bucket)
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Lagos',
  completed_year TEXT NOT NULL DEFAULT '2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Service Requests (Broadcast / Briefs)
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  budget_ngn INTEGER NOT NULL CHECK (budget_ngn >= 0),
  urgency TEXT NOT NULL DEFAULT 'this_week' CHECK (urgency IN ('immediate', 'this_week', 'this_month', 'flexible')),
  status public.request_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Direct Inquiries (Client <-> Provider thread header)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  budget_ngn INTEGER CHECK (budget_ngn IS NULL OR budget_ngn >= 0),
  preferred_date DATE,
  location TEXT NOT NULL,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages within an Inquiry
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verified Client Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  project_title TEXT NOT NULL,
  comment TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved / Bookmarked Providers
CREATE TABLE IF NOT EXISTS public.saved_providers (
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (client_id, provider_id)
);

-- Verification Submissions (Admin Review Queue)
CREATE TABLE IF NOT EXISTS public.verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  id_type TEXT NOT NULL CHECK (id_type IN ('NIN', 'BVN', 'Drivers License', 'International Passport')),
  id_last_four TEXT NOT NULL,
  cac_number TEXT,
  document_url TEXT,
  status public.verification_status NOT NULL DEFAULT 'pending',
  reviewed_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Contact Form Messages
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_provider_category ON public.provider_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_provider_location ON public.provider_profiles(location);
CREATE INDEX IF NOT EXISTS idx_provider_verified ON public.provider_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_inquiries_client ON public.inquiries(client_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_provider ON public.inquiries(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_inquiry ON public.messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id);

-- -----------------------------------------------------------------------------
-- 4. FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_providers_updated_at ON public.provider_profiles;
CREATE TRIGGER trg_providers_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Recalculate provider rating_avg & review_count automatically
CREATE OR REPLACE FUNCTION public.recalculate_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_provider UUID;
BEGIN
  target_provider := COALESCE(NEW.provider_id, OLD.provider_id);
  UPDATE public.provider_profiles
  SET
    rating_avg = COALESCE((
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.reviews
      WHERE provider_id = target_provider AND is_hidden = FALSE
    ), 0.00),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE provider_id = target_provider AND is_hidden = FALSE
    )
  WHERE id = target_provider;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_rating ON public.reviews;
CREATE TRIGGER trg_recalculate_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_provider_rating();

-- Automatically create a public.profiles row when a Supabase Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, location)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'client'),
    COALESCE(NEW.raw_user_meta_data->>'location', 'Victoria Island, Lagos')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Helper function to check admin role safely in RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON public.contact_submissions TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Profiles
DROP POLICY IF EXISTS "Profiles readable by authenticated or public provider owners" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated or public provider owners"
  ON public.profiles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Categories
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL USING (public.is_admin());

-- Provider Profiles
DROP POLICY IF EXISTS "Provider profiles publicly readable" ON public.provider_profiles;
CREATE POLICY "Provider profiles publicly readable"
  ON public.provider_profiles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Providers insert own profile" ON public.provider_profiles;
CREATE POLICY "Providers insert own profile"
  ON public.provider_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Providers update own profile or admin" ON public.provider_profiles;
CREATE POLICY "Providers update own profile or admin"
  ON public.provider_profiles FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Services & Portfolio
DROP POLICY IF EXISTS "Services publicly readable" ON public.services;
CREATE POLICY "Services publicly readable"
  ON public.services FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Providers manage own services" ON public.services;
CREATE POLICY "Providers manage own services"
  ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Portfolio publicly readable" ON public.portfolio_items;
CREATE POLICY "Portfolio publicly readable"
  ON public.portfolio_items FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Providers manage own portfolio" ON public.portfolio_items;
CREATE POLICY "Providers manage own portfolio"
  ON public.portfolio_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

-- Service Requests
DROP POLICY IF EXISTS "Service requests visible to owner, verified providers, and admins" ON public.service_requests;
CREATE POLICY "Service requests visible to owner, verified providers, and admins"
  ON public.service_requests FOR SELECT USING (
    auth.uid() = client_id
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'provider')
  );

DROP POLICY IF EXISTS "Clients insert own service requests" ON public.service_requests;
CREATE POLICY "Clients insert own service requests"
  ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients update own service requests" ON public.service_requests;
CREATE POLICY "Clients update own service requests"
  ON public.service_requests FOR UPDATE USING (auth.uid() = client_id OR public.is_admin());

-- Inquiries & Messages
DROP POLICY IF EXISTS "Participants view own inquiries" ON public.inquiries;
CREATE POLICY "Participants view own inquiries"
  ON public.inquiries FOR SELECT USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Clients create inquiries" ON public.inquiries;
CREATE POLICY "Clients create inquiries"
  ON public.inquiries FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Participants update inquiry status" ON public.inquiries;
CREATE POLICY "Participants update inquiry status"
  ON public.inquiries FOR UPDATE USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Participants view inquiry messages" ON public.messages;
CREATE POLICY "Participants view inquiry messages"
  ON public.messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      LEFT JOIN public.provider_profiles p ON p.id = i.provider_id
      WHERE i.id = inquiry_id AND (i.client_id = auth.uid() OR p.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Participants send inquiry messages" ON public.messages;
CREATE POLICY "Participants send inquiry messages"
  ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.inquiries i
      LEFT JOIN public.provider_profiles p ON p.id = i.provider_id
      WHERE i.id = inquiry_id AND (i.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- Reviews
DROP POLICY IF EXISTS "Visible reviews publicly readable" ON public.reviews;
CREATE POLICY "Visible reviews publicly readable"
  ON public.reviews FOR SELECT USING (is_hidden = FALSE OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated clients create reviews" ON public.reviews;
CREATE POLICY "Authenticated clients create reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Admins moderate reviews" ON public.reviews;
CREATE POLICY "Admins moderate reviews"
  ON public.reviews FOR UPDATE USING (public.is_admin());

-- Saved Providers
DROP POLICY IF EXISTS "Clients manage saved providers" ON public.saved_providers;
CREATE POLICY "Clients manage saved providers"
  ON public.saved_providers FOR ALL USING (auth.uid() = client_id);

-- Verification Submissions
DROP POLICY IF EXISTS "Providers view own verification submissions" ON public.verification_submissions;
CREATE POLICY "Providers view own verification submissions"
  ON public.verification_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Providers submit verification" ON public.verification_submissions;
CREATE POLICY "Providers submit verification"
  ON public.verification_submissions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_profiles p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins review verifications" ON public.verification_submissions;
CREATE POLICY "Admins review verifications"
  ON public.verification_submissions FOR UPDATE USING (public.is_admin());

-- Contact Submissions
DROP POLICY IF EXISTS "Anyone can submit contact inquiry" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact inquiry"
  ON public.contact_submissions FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins read contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins read contact submissions"
  ON public.contact_submissions FOR SELECT USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. SUPABASE STORAGE BUCKETS & POLICIES
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', TRUE),
  ('portfolios', 'portfolios', TRUE),
  ('verifications', 'verifications', FALSE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public avatar and portfolio read" ON storage.objects;
CREATE POLICY "Public avatar and portfolio read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'portfolios'));

DROP POLICY IF EXISTS "Authenticated users upload own avatars and portfolios" ON storage.objects;
CREATE POLICY "Authenticated users upload own avatars and portfolios"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND bucket_id IN ('avatars', 'portfolios', 'verifications')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own storage files" ON storage.objects;
CREATE POLICY "Users delete own storage files"
  ON storage.objects FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- 7. SEED DATA: 13 NIGERIAN MARKETPLACE CATEGORIES
-- -----------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, icon_name, is_featured, sort_order)
VALUES
  ('Construction', 'construction', 'COREN-certified structural engineers, architects, quantity surveyors, and master builders for residential and commercial builds.', 'HardHat', TRUE, 1),
  ('Home Services', 'home-services', 'Vetted interior architects, solar & inverter technicians, industrial plumbers, and certified electricians across Lagos.', 'Home', TRUE, 2),
  ('Automotive', 'automotive', 'Computerized diagnostics specialists, European & Japanese vehicle mechanics, fleet maintenance, and auto detailing.', 'Car', FALSE, 3),
  ('Fashion & Beauty', 'fashion-beauty', 'Bespoke couture tailors, bridal stylists, editorial makeup artists, and traditional Aso-Oke ateliers.', 'Scissors', TRUE, 4),
  ('Education', 'education', 'IGCSE, SAT, and JAMB private tutors, executive language coaches, and corporate technical trainers.', 'GraduationCap', FALSE, 5),
  ('Technology', 'technology', 'Full-stack product engineers, cybersecurity consultants, smart-home integrators, and cloud architects.', 'Laptop', TRUE, 6),
  ('Food', 'food', 'Private executive chefs, corporate event caterers, pastry ateliers, and weekly gourmet meal preppers.', 'Utensils', FALSE, 7),
  ('Agriculture', 'agriculture', 'Agronomists, greenhouse & hydroponic system designers, poultry farm consultants, and landscape architects.', 'Sprout', FALSE, 8),
  ('Creative', 'creative', 'Commercial photographers, brand identity studios, architectural visualizers, and documentary filmmakers.', 'Camera', TRUE, 9),
  ('Health', 'health', 'Licensed physiotherapists, home-care nurses, certified nutritionists, and executive wellness coaches.', 'HeartPulse', FALSE, 10),
  ('Professional Services', 'professional-services', 'CAC corporate lawyers, ICAN chartered accountants, tax advisors, and HR compliance specialists.', 'Briefcase', TRUE, 11),
  ('Security', 'security', 'Access-control engineers, IP CCTV surveillance specialists, executive protection, and estate security consultants.', 'ShieldCheck', FALSE, 12),
  ('Other', 'other', 'Specialized logistics coordinators, relocation concierges, marine surveyors, and bespoke craftspeople.', 'Layers', FALSE, 13)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;
