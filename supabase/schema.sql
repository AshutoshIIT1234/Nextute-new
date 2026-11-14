-- Nextute — full database schema (already applied to Supabase project "nextute").
-- Run this in the Supabase SQL editor only if you ever need to recreate the database.

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text,
  role text not null default 'student' check (role in ('student','institute','admin')),
  city text, class_level text, is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','student');
begin
  if r not in ('student','institute') then r := 'student'; end if;
  insert into public.profiles (id, full_name, email, phone, role, city, class_level)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone', r,
          new.raw_user_meta_data->>'city', new.raw_user_meta_data->>'class_level');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create or replace function public.protect_profile_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.is_blocked is distinct from old.is_blocked) and not public.is_admin() then
    new.role := old.role; new.is_blocked := old.is_blocked; end if;
  return new;
end; $$;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "admin delete profile" on public.profiles for delete using (public.is_admin());

-- INSTITUTES
create table public.institutes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  slug text unique not null, name text not null, tagline text, description text,
  city text not null default 'Patna', area text not null, address text, pincode text, map_url text,
  contact_name text, phone text, whatsapp text, email text, website text, established_year int,
  classes text[] not null default '{}', exams text[] not null default '{}', subjects text[] not null default '{}', boards text[] not null default '{}',
  mode text not null default 'Offline' check (mode in ('Offline','Online','Hybrid')),
  fee_min int, fee_max int, fee_note text, facilities text[] not null default '{}', batch_size int, timings text, scholarship text,
  gender text default 'Co-ed', cover_image text, photos text[] not null default '{}',
  demo_videos jsonb not null default '[]', faculty jsonb not null default '[]', batches jsonb not null default '[]', results jsonb not null default '[]',
  demo_count int generated always as (jsonb_array_length(demo_videos)) stored,
  faculty_count int generated always as (jsonb_array_length(faculty)) stored,
  status text not null default 'pending' check (status in ('pending','approved','rejected')), rejection_reason text,
  is_verified boolean not null default false, is_featured boolean not null default false, is_sample boolean not null default false,
  rating numeric(2,1) not null default 0, review_count int not null default 0, views int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.institutes (status, city, area);
create index on public.institutes using gin (classes);
create index on public.institutes using gin (exams);
create index on public.institutes using gin (facilities);
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end; $$;
create trigger institutes_touch before update on public.institutes for each row execute function public.touch_updated_at();
create or replace function public.protect_institute_flags() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.is_verified := false; new.is_featured := false; new.is_sample := false;
      new.rating := 0; new.review_count := 0; new.views := 0; new.owner_id := auth.uid();
    else
      new.is_verified := old.is_verified; new.is_featured := old.is_featured; new.is_sample := old.is_sample;
      new.rating := old.rating; new.review_count := old.review_count; new.views := old.views; new.owner_id := old.owner_id;
      if old.status = 'rejected' then new.status := 'pending'; else new.status := old.status; end if;
    end if;
  end if;
  return new;
end; $$;
create trigger institutes_protect before insert or update on public.institutes for each row execute function public.protect_institute_flags();
alter table public.institutes enable row level security;
create policy "public approved read" on public.institutes for select to anon using (status = 'approved');
create policy "auth read" on public.institutes for select to authenticated using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy "institute insert" on public.institutes for insert to authenticated
  with check (public.is_admin() or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'institute'));
create policy "owner/admin update" on public.institutes for update to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy "admin delete" on public.institutes for delete to authenticated using (public.is_admin());
-- signed-out visitors only get preview columns
revoke select on public.institutes from anon;
grant select (id, slug, name, tagline, city, area, established_year, classes, exams, subjects, boards, mode, fee_min, fee_max,
  facilities, batch_size, gender, cover_image, photos, demo_count, faculty_count, status, is_verified, is_featured, is_sample,
  rating, review_count, created_at) on public.institutes to anon;

-- QUERIES (admission enquiries)
create table public.queries (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_name text not null, student_phone text not null, student_email text, class_level text, exam_interest text,
  preferred_batch text, message text,
  status text not null default 'new' check (status in ('new','contacted','visited','admitted','closed')),
  institute_note text, created_at timestamptz not null default now()
);
create index on public.queries (institute_id, created_at desc);
alter table public.queries enable row level security;
create policy "student insert own query" on public.queries for insert to authenticated with check (student_id = auth.uid());
create policy "read queries" on public.queries for select to authenticated using (student_id = auth.uid() or public.is_admin()
  or exists(select 1 from public.institutes i where i.id = institute_id and i.owner_id = auth.uid()));
create policy "institute/admin update" on public.queries for update to authenticated using (public.is_admin()
  or exists(select 1 from public.institutes i where i.id = institute_id and i.owner_id = auth.uid()));
create policy "delete queries" on public.queries for delete to authenticated using (public.is_admin() or student_id = auth.uid());

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_name text, rating int not null check (rating between 1 and 5), comment text,
  created_at timestamptz not null default now(), unique (institute_id, student_id)
);
alter table public.reviews enable row level security;
create policy "reviews readable" on public.reviews for select to authenticated using (true);
create policy "student writes own review" on public.reviews for insert to authenticated with check (student_id = auth.uid());
create policy "student updates own review" on public.reviews for update to authenticated using (student_id = auth.uid());
create policy "delete review" on public.reviews for delete to authenticated using (student_id = auth.uid() or public.is_admin());
create or replace function public.refresh_rating() returns trigger language plpgsql security definer set search_path = public as $$
declare iid uuid := coalesce(new.institute_id, old.institute_id);
begin
  update public.institutes set
    rating = coalesce((select round(avg(rating)::numeric,1) from public.reviews where institute_id = iid),0),
    review_count = (select count(*) from public.reviews where institute_id = iid)
  where id = iid;
  return null;
end; $$;
create trigger reviews_rating after insert or update or delete on public.reviews for each row execute function public.refresh_rating();

-- SHORTLIST
create table public.shortlists (
  student_id uuid not null references public.profiles(id) on delete cascade,
  institute_id uuid not null references public.institutes(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (student_id, institute_id)
);
alter table public.shortlists enable row level security;
create policy "own shortlist" on public.shortlists for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

-- SUPPORT TICKETS
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null, email text, phone text, category text default 'General', subject text, message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')), admin_note text,
  created_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
create policy "anyone can raise ticket" on public.support_tickets for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());
create policy "read own tickets" on public.support_tickets for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin update tickets" on public.support_tickets for update to authenticated using (public.is_admin());
create policy "admin delete tickets" on public.support_tickets for delete to authenticated using (public.is_admin());

-- RPCs
create or replace function public.increment_views(iid uuid) returns void language sql security definer set search_path = public as $$
  update public.institutes set views = views + 1 where id = iid and status = 'approved'; $$;
create or replace function public.platform_stats() returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'institutes', (select count(*) from institutes where status='approved'),
    'areas', (select count(distinct area) from institutes where status='approved'),
    'demos', (select coalesce(sum(demo_count),0) from institutes where status='approved'),
    'students', (select count(*) from profiles where role='student')); $$;
grant execute on function public.increment_views(uuid) to anon, authenticated;
grant execute on function public.platform_stats() to anon, authenticated;
revoke execute on function public.handle_new_user(), public.protect_institute_flags(), public.protect_profile_role(), public.refresh_rating() from public, anon, authenticated;

-- STORAGE (public bucket for photos / demo videos; users upload into a folder named after their user id)
insert into storage.buckets (id, name, public, file_size_limit) values ('media','media', true, 52428800) on conflict (id) do nothing;
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "media update own" on storage.objects for update to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Make someone an admin (run once, replace the email):
-- alter table public.profiles disable trigger profiles_protect_role;
-- update public.profiles set role = 'admin' where email = 'you@example.com';
-- alter table public.profiles enable trigger profiles_protect_role;
