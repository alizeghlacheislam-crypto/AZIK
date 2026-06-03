-- ============================================
-- AZIK Studio — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================

-- 1) LEADS — contact form submissions
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  email        text not null,
  project_type text,
  message      text not null,
  language     text default 'ar'
);

-- 2) EVENTS — analytics (whatsapp clicks, form submits, etc.)
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_type  text not null,
  package     text,
  language    text,
  user_agent  text,
  path        text
);

-- 3) PROJECTS — portfolio bento grid (CMS)
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  sort_order      int default 0,
  size            text default 'sm',           -- lg | tall | sm | wide
  category_ar     text,
  category_en     text,
  category_fr     text,
  title_ar        text,
  title_en        text,
  title_fr        text,
  description_ar  text,
  description_en  text,
  description_fr  text,
  image_url       text,
  is_published    boolean default true
);

-- 4) TESTIMONIALS — clients' testimonials bento (CMS)
create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  sort_order    int default 0,
  size          text default 'small',          -- large | tall | small | wide
  name          text,
  initials      text,                          -- e.g. 'YM' (auto-derived if empty)
  role_ar       text,
  role_en       text,
  role_fr       text,
  quote_ar      text,
  quote_en      text,
  quote_fr      text,
  rating        int default 5,
  is_published  boolean default true
);

-- ============================================
-- ROW LEVEL SECURITY — enable + policies
-- ============================================

alter table public.leads         enable row level security;
alter table public.events        enable row level security;
alter table public.projects      enable row level security;
alter table public.testimonials  enable row level security;

-- Anyone (anon) can submit leads
create policy "Anon can insert leads"
  on public.leads for insert to anon
  with check (true);

-- Anyone can submit analytics events
create policy "Anon can insert events"
  on public.events for insert to anon
  with check (true);

-- Anyone can READ published projects
create policy "Public can read published projects"
  on public.projects for select to anon
  using (is_published = true);

-- Anyone can READ published testimonials
create policy "Public can read published testimonials"
  on public.testimonials for select to anon
  using (is_published = true);

-- NOTE: by default, with RLS enabled and no SELECT policy for anon on
-- leads/events, the anon role CANNOT read those tables. Only you (via the
-- Supabase Dashboard or the service_role key) can view submissions.

-- ============================================
-- (Optional) Seed sample projects + testimonials
-- to match the hardcoded HTML, so the live site
-- starts identical to your design.
-- ============================================

insert into public.projects (sort_order, size, category_ar, category_en, category_fr, title_ar, title_en, title_fr, description_ar, description_en, description_fr, image_url) values
(10, 'lg',   'لوحة تحكم / SaaS',        'Dashboard / SaaS',       'Dashboard / SaaS',
              'نظام نيفا المالي — Neval Dashboard',
              'Neval Financial — Dashboard',
              'Système Neval — Dashboard',
              'تصميم واجهة مستخدم متكاملة لإدارة المحافظ الرقمية وتحليل البيانات.',
              'End-to-end UI for managing digital portfolios and analyzing data.',
              'Interface complète pour la gestion de portefeuilles et l''analyse de données.',
              null),
(20, 'tall', 'شعار وهوية بصرية',         'Logo & Identity',        'Logo & Identité',
              'هوية شركة سهم للاستثمار',
              'Sahm Investment — Brand',
              'Sahm Investissement — Identité',
              'شعار هندسي يعكس الثقة والنمو المستقبلي.',
              'A geometric logo conveying trust and future growth.',
              'Un logo géométrique reflétant confiance et croissance.',
              null),
(30, 'sm',   'صفحة هبوط / UI/UX',        'Landing / UI/UX',        'Landing / UI/UX',
              'تطبيق كوانتوم الرقمي', 'Quantum Digital App', 'Application Quantum',
              'واجهة تفاعلية بثيم غامق وتأثيرات بصرية لزيادة المبيعات.',
              'A dark-themed interactive UI engineered to boost sales.',
              'Une interface interactive en thème sombre.',
              null),
(40, 'wide', 'تطبيق ويب / Dashboard',    'Web App / Dashboard',    'App Web / Dashboard',
              'منصة تداول العملات المشفرة', 'Crypto Trading Platform', 'Plateforme de trading crypto',
              'واجهة مستخدم سريعة الاستجابة لمتابعة الأسعار اللحظية.',
              'A highly responsive UI for tracking real-time prices.',
              'Une interface réactive pour suivre les cours en temps réel.',
              null);

insert into public.testimonials (sort_order, size, name, initials, role_ar, role_en, role_fr, quote_ar, quote_en, quote_fr, rating) values
(10, 'large', 'ياسين مرابطي', 'YM',
              'مؤسس · Atlas Capital', 'Founder · Atlas Capital', 'Fondateur · Atlas Capital',
              'من أول جلسة، حسّيت بليهم يفهمو رؤيتنا. الهوية اللي صمموها رفعت مستوى الماركة كاملة، والنتيجة فاقت توقعاتي بمراحل.',
              'From the first call, I knew they understood our vision. The identity they delivered elevated our entire brand — well beyond expectations.',
              'Dès le premier échange, j''ai senti qu''ils comprenaient notre vision. L''identité livrée a élevé toute la marque, bien au-delà de mes attentes.',
              5),
(20, 'tall',  'سارة بن عيسى', 'SB',
              'مديرة تسويق · Souk Digital', 'Marketing · Souk Digital', 'Marketing · Souk Digital',
              'موقع رفع تحويلاتي للضعف في أول شهر بعد الإطلاق.',
              'Our conversions doubled in the first month after launch.',
              'Nos conversions ont doublé dès le premier mois.',
              5),
(30, 'small', 'كريم زغلاش', 'KZ',
              'CTO · Maghreb Lab', 'CTO · Maghreb Lab', 'CTO · Maghreb Lab',
              'Dashboard يفهم البيانات بنظرة واحدة.',
              'A dashboard you grasp at a glance.',
              'Un dashboard que l''on comprend d''un coup d''œil.',
              5),
(40, 'wide',  'لينا بوزيدي', 'LB',
              'مديرة المنتج · Quantum App', 'Product Lead · Quantum App', 'Product Lead · Quantum App',
              'تجربة مستخدم مذهلة، مدروسة بأدق التفاصيل، وفريق محترف من البداية حتى التسليم. أنصح بهم بقوة.',
              'Stunning UX, attention to every detail, and a pro team from kickoff to delivery. Highly recommended.',
              'UX impressionnante, attention aux moindres détails, équipe pro du début à la livraison.',
              5);
