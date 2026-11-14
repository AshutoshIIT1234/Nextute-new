-- Nextute courses + Razorpay enrolments (NDA Maths April 2027 batch)
-- Run once in Supabase → SQL Editor.

-- Private secrets (never exposed through the API)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_secrets (name text primary key, value text not null);
insert into private.app_secrets (name, value) values ('payments', 'ab4b162c4496aab5b917492fa57b0d534d21d8297d5907d5')
on conflict (name) do nothing;

-- Courses
create table if not exists public.courses (
  slug text primary key,
  title text not null,
  price int not null,              -- in rupees
  mentor_name text,
  mentor_photo text,
  batch_start text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.courses enable row level security;
drop policy if exists "courses read" on public.courses;
create policy "courses read" on public.courses for select using (true);
drop policy if exists "courses admin write" on public.courses;
create policy "courses admin write" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.courses to anon, authenticated;
grant insert, update, delete on public.courses to authenticated;

insert into public.courses (slug, title, price, mentor_name, batch_start)
values ('nda-maths-april-2027', 'NDA Maths Batch — April 2027', 999, 'Aditya Tiwari', 'April 2027')
on conflict (slug) do nothing;

-- Enrolments (one row per Razorpay order)
create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_slug text not null references public.courses(slug),
  amount int not null default 0,   -- in rupees, copied from the course price
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'refunded')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  name text, phone text, email text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists course_enrollments_user on public.course_enrollments (user_id);
alter table public.course_enrollments enable row level security;
drop policy if exists "own enrollments read" on public.course_enrollments;
create policy "own enrollments read" on public.course_enrollments for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own enrollment create" on public.course_enrollments;
create policy "own enrollment create" on public.course_enrollments for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "admin update enrollments" on public.course_enrollments;
create policy "admin update enrollments" on public.course_enrollments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update on public.course_enrollments to authenticated;

-- Students can only create unpaid orders at the real course price
create or replace function public.enrollment_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
declare p int;
begin
  select price into p from courses where slug = new.course_slug and is_active;
  if p is null then raise exception 'This course is not open for enrolment'; end if;
  new.amount := p;
  if not public.is_admin() then
    new.status := 'created';
    new.razorpay_payment_id := null;
    new.paid_at := null;
  end if;
  return new;
end; $$;
drop trigger if exists enrollment_defaults on public.course_enrollments;
create trigger enrollment_defaults before insert on public.course_enrollments
  for each row execute function public.enrollment_defaults();

-- Called only by the website server after verifying Razorpay's signature
create or replace function public.confirm_enrollment(p_order text, p_payment text, p_secret text) returns boolean
language plpgsql security definer set search_path = public, private as $$
begin
  if p_secret is null or p_secret is distinct from (select value from private.app_secrets where name = 'payments') then
    raise exception 'unauthorized';
  end if;
  update course_enrollments set status = 'paid', razorpay_payment_id = p_payment, paid_at = now()
  where razorpay_order_id = p_order and status <> 'paid';
  return found;
end; $$;
revoke execute on function public.confirm_enrollment(text, text, text) from public;
grant execute on function public.confirm_enrollment(text, text, text) to anon, authenticated;

-- Email alert to contact@nextute.com when a payment succeeds
create or replace function public.notify_event() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare body jsonb; i record;
begin
  if tg_table_name = 'queries' then
    select name, phone, whatsapp, area into i from institutes where id = new.institute_id;
    body := jsonb_build_object('type','query','institute_name', i.name, 'institute_area', i.area, 'institute_phone', i.phone, 'institute_whatsapp', i.whatsapp,
      'student_name', new.student_name, 'student_phone', new.student_phone, 'student_email', new.student_email,
      'class_level', new.class_level, 'exam_interest', new.exam_interest, 'preferred_batch', new.preferred_batch, 'message', new.message);
  elsif tg_table_name = 'support_tickets' then
    body := jsonb_build_object('type','ticket','name', new.name, 'email', new.email, 'phone', new.phone,
      'category', new.category, 'subject', new.subject, 'message', new.message);
  elsif tg_table_name = 'course_enrollments' then
    body := jsonb_build_object('type','enrollment','name', new.name, 'phone', new.phone, 'email', new.email,
      'course', new.course_slug, 'amount', new.amount, 'payment_id', new.razorpay_payment_id, 'order_id', new.razorpay_order_id);
  else
    body := jsonb_build_object('type','app_interest','institute_name', new.institute_name, 'contact_name', new.contact_name,
      'phone', new.phone, 'email', new.email, 'services', array_to_string(new.services, ', '), 'students_count', new.students_count, 'note', new.note);
  end if;
  perform net.http_post(
    url := 'https://nextute-chi.vercel.app/api/notify',
    body := body,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', 'ab4b162c4496aab5b917492fa57b0d534d21d8297d5907d5')
  );
  return new;
exception when others then
  return new;
end; $$;
revoke execute on function public.notify_event() from public, anon, authenticated;
drop trigger if exists enrollment_paid_notify on public.course_enrollments;
create trigger enrollment_paid_notify after update on public.course_enrollments
  for each row when (new.status = 'paid' and old.status is distinct from 'paid')
  execute function public.notify_event();
