-- ============================================================
-- ETHIO FICTION — Supabase schema
-- Run this once in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- 1. PROFILES ---------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  plan text not null default 'free' check (plan in ('free','premium')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admins can update all profiles"
  on profiles for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 2. BOOKS --------------------------------------------------------
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  genre text default 'Fiction',
  cover_url text,
  pdf_url text not null,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

alter table books enable row level security;

create policy "Anyone signed in can read books"
  on books for select using (auth.role() = 'authenticated');

create policy "Admins can manage books"
  on books for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 3. FAVORITES ------------------------------------------------------
create table if not exists favorites (
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

alter table favorites enable row level security;

create policy "Users manage their own favorites"
  on favorites for all using (auth.uid() = user_id);

-- 4. DOWNLOADS (for statistics) --------------------------------------
create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

alter table downloads enable row level security;

create policy "Users can log their own downloads"
  on downloads for insert with check (auth.uid() = user_id);

create policy "Users can view their own downloads"
  on downloads for select using (auth.uid() = user_id);

create policy "Admins can view all downloads"
  on downloads for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 5. PAYMENT ACCOUNTS (admin-managed, visible to everyone) -----------
create table if not exists payment_accounts (
  method text primary key check (method in ('birr','usdt')),
  bank_name text,
  account_name text,
  account_number text,
  usdt_network text,
  usdt_address text,
  amount_1yr text,
  amount_2yr text,
  updated_at timestamptz not null default now()
);

alter table payment_accounts enable row level security;

create policy "Anyone signed in can view payment accounts"
  on payment_accounts for select using (auth.role() = 'authenticated');

create policy "Admins can manage payment accounts"
  on payment_accounts for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 6. PAYMENTS (user submissions for approval) -------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan text not null check (plan in ('1yr','2yr')),
  method text,
  proof_text text,
  proof_image_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table payments enable row level security;

create policy "Users can submit their own payments"
  on payments for insert with check (auth.uid() = user_id);

create policy "Users can view their own payments"
  on payments for select using (auth.uid() = user_id);

create policy "Admins can view and update all payments"
  on payments for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- STORAGE BUCKETS
-- Run each of these, or create the buckets from the Storage tab
-- in the dashboard with matching names and public settings.
-- ============================================================
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false) on conflict (id) do nothing;

create policy "Public can read covers"
  on storage.objects for select using (bucket_id = 'covers');

create policy "Admins can upload covers"
  on storage.objects for insert with check (
    bucket_id = 'covers' and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Public can read pdfs"
  on storage.objects for select using (bucket_id = 'pdfs');

create policy "Admins can upload pdfs"
  on storage.objects for insert with check (
    bucket_id = 'pdfs' and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Users can upload their own payment proofs"
  on storage.objects for insert with check (
    bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins can read payment proofs"
  on storage.objects for select using (
    bucket_id = 'payment-proofs' and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- To make your own account an admin after you sign up once in the app:
--   update profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================
