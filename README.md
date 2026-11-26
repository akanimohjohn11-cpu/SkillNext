# SkillNest — Nigerian Professional Skills & Services Marketplace

SkillNest connects discerning clients in Lagos and across Nigeria with identity-verified professionals, engineers, designers, legal counsel, and skilled tradespeople.

## Stack

- **Framework**: Next.js 15 App Router, React 19, TypeScript
- **Styling & Motion**: Tailwind CSS v4, Motion (`motion/react`), Lucide Icons
- **Database, Auth & Storage**: Supabase (PostgreSQL + Row Level Security + Storage Buckets)
- **Validation**: Zod schema validation across all API endpoints

## Environment Variables

Copy `.env.example` to `.env.local` (or set in Vercel Project Settings -> Environment Variables):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_PASSCODE=your-chosen-admin-passcode
APP_URL=https://your-domain.vercel.app
```

> **Preview & Local Development**: When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, SkillNest runs cleanly with its server-side signed session layer and Lagos seed directory so all Client, Provider, and Admin flows remain testable immediately. Once Supabase credentials are configured, authentication and image storage route directly through Supabase.

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard and execute the full contents of `supabase/schema.sql`. This creates:
   - Tables (`profiles`, `categories`, `provider_profiles`, `services`, `portfolio_items`, `service_requests`, `inquiries`, `messages`, `reviews`, `saved_providers`, `verification_submissions`, `contact_submissions`)
   - Automatic `updated_at` and provider rating recalculation triggers
   - Row Level Security (RLS) policies on every table
   - Storage buckets (`avatars`, `portfolios`, `verifications`) and storage policies
   - Seed records for all 13 Nigerian marketplace categories
3. Copy your Project URL and `anon` key from **Project Settings -> API** into `.env.local` or Vercel Environment Variables.

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Deploying to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Import the repository in **Vercel -> Add New Project**.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `APP_URL` under **Environment Variables**.
4. Keep the default Next.js build command (`npm run build`) and click **Deploy**.
