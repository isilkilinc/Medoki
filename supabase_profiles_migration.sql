-- ============================================================
-- Medoki: profiles tablosu
-- Supabase Dashboard > SQL Editor'a yapıştırıp çalıştırın
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  blood_type  text default 'Bilinmiyor',
  allergies   text default '',
  chronic_conditions text default '',
  updated_at  timestamptz default now()
);

-- RLS (Row Level Security) — her kullanıcı yalnızca kendi satırına erişsin
alter table public.profiles enable row level security;

-- SELECT: kendi satırını okuyabilir
create policy "Kullanıcı kendi profilini okuyabilir"
  on public.profiles for select
  using (auth.uid() = id);

-- INSERT: kendi satırını oluşturabilir
create policy "Kullanıcı kendi profilini oluşturabilir"
  on public.profiles for insert
  with check (auth.uid() = id);

-- UPDATE: kendi satırını güncelleyebilir
create policy "Kullanıcı kendi profilini güncelleyebilir"
  on public.profiles for update
  using (auth.uid() = id);
