-- Upgrade: near-me map search (lat/lng), phone-OTP-friendly profiles, WhatsApp alert webhook
alter table public.institutes add column if not exists lat double precision, add column if not exists lng double precision;
grant select (lat, lng) on public.institutes to anon;

create table if not exists public.area_coords (name text primary key, lat double precision not null, lng double precision not null);
alter table public.area_coords enable row level security;
drop policy if exists "area coords readable" on public.area_coords;
create policy "area coords readable" on public.area_coords for select using (true);
insert into public.area_coords (name, lat, lng) values
('boring road',25.6170,85.1170),('kankarbagh',25.5960,85.1630),('rajendra nagar',25.6070,85.1580),('bailey road',25.6100,85.0950),
('patliputra colony',25.6270,85.1000),('ashok rajpath',25.6180,85.1550),('musallahpur hat',25.6080,85.1600),('saguna more',25.6200,85.0450),
('danapur',25.6350,85.0480),('bhikhna pahari',25.6100,85.1620),('frazer road',25.6120,85.1360),('raja bazar',25.6080,85.0980),
('anisabad',25.5900,85.1080),('gandhi maidan',25.6190,85.1450),('exhibition road',25.6110,85.1400),('kidwaipuri',25.6110,85.1050),
('mahendru',25.6170,85.1700),('phulwari sharif',25.5770,85.0780),('khajpura',25.6000,85.1000),('rukanpura',25.6100,85.0700),
('shastri nagar',25.6080,85.1050),('boring canal road',25.6140,85.1220),('kurji',25.6290,85.0870),('digha',25.6400,85.0800),('bypass',25.5880,85.1800),
('city:patna',25.6093,85.1376),('city:hajipur',25.6858,85.2146),('city:gaya',24.7955,85.0002),('city:muzaffarpur',26.1209,85.3647),
('city:bhagalpur',25.2425,86.9842),('city:ara',25.5541,84.6603),('city:bihar sharif',25.1982,85.5149)
on conflict (name) do nothing;

create or replace function public.set_institute_coords() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if new.lat is null or new.lng is null or (tg_op = 'UPDATE' and (new.area is distinct from old.area or new.city is distinct from old.city)) then
    select lat, lng into c from area_coords where name = lower(trim(new.area));
    if not found then select lat, lng into c from area_coords where name = 'city:' || lower(trim(new.city)); end if;
    if found then
      new.lat := c.lat + (random() - 0.5) * 0.006;
      new.lng := c.lng + (random() - 0.5) * 0.006;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists institutes_coords on public.institutes;
create trigger institutes_coords before insert or update on public.institutes for each row execute function public.set_institute_coords();
revoke execute on function public.set_institute_coords() from public, anon, authenticated;

alter table public.institutes disable trigger institutes_protect;
update public.institutes set lat = null where lat is null;
alter table public.institutes enable trigger institutes_protect;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','student');
begin
  if r not in ('student','institute') then r := 'student'; end if;
  insert into public.profiles (id, full_name, email, phone, role, city, class_level)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email,
          coalesce(new.raw_user_meta_data->>'phone', right(new.phone, 10)), r,
          new.raw_user_meta_data->>'city', new.raw_user_meta_data->>'class_level');
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- District headquarters (Bihar) for distance fallback
insert into public.area_coords (name, lat, lng) values
('city:araria',26.15,87.52),('city:arwal',25.25,84.68),('city:aurangabad',24.75,84.37),('city:banka',24.88,86.92),('city:begusarai',25.42,86.13),
('city:bhojpur',25.56,84.66),('city:buxar',25.56,83.98),('city:darbhanga',26.15,85.90),('city:east champaran',26.65,84.92),
('city:gopalganj',26.47,84.44),('city:jamui',24.92,86.22),('city:jehanabad',25.21,84.99),('city:kaimur',25.04,83.61),('city:katihar',25.54,87.57),
('city:khagaria',25.50,86.48),('city:kishanganj',26.10,87.95),('city:lakhisarai',25.17,86.09),('city:madhepura',25.92,86.79),('city:madhubani',26.35,86.07),
('city:munger',25.37,86.47),('city:nalanda',25.20,85.52),('city:nawada',24.88,85.54),('city:purnia',25.78,87.47),('city:rohtas',24.95,84.03),
('city:saharsa',25.88,86.60),('city:samastipur',25.86,85.78),('city:saran',25.78,84.73),('city:sheikhpura',25.14,85.85),('city:sheohar',26.51,85.29),
('city:sitamarhi',26.59,85.49),('city:siwan',26.22,84.36),('city:supaul',26.12,86.60),('city:vaishali',25.69,85.21),('city:west champaran',26.80,84.50)
on conflict (name) do nothing;

-- Full course vs subject-wise
alter table public.institutes add column if not exists course_types text[] not null default '{Full course}';
grant select (course_types) on public.institutes to anon;

-- Partner app waitlist (launch 25 Nov 2026)
create table if not exists public.partner_interest (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  institute_id uuid references public.institutes(id) on delete cascade,
  institute_name text, contact_name text, phone text, email text,
  services text[] not null default '{}', students_count int, note text,
  created_at timestamptz not null default now(),
  unique (owner_id)
);
alter table public.partner_interest enable row level security;
create policy "own interest" on public.partner_interest for all to authenticated
  using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

-- Alerts (email to contact@nextute.com + optional WhatsApp) via the website's /api/notify
create extension if not exists pg_net with schema extensions;
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
  return new; -- never block a submission because of a notification problem
end; $$;
revoke execute on function public.notify_event() from public, anon, authenticated;
drop trigger if exists queries_notify on public.queries;
create trigger queries_notify after insert on public.queries for each row execute function public.notify_event();
drop trigger if exists tickets_notify on public.support_tickets;
create trigger tickets_notify after insert on public.support_tickets for each row execute function public.notify_event();
drop trigger if exists interest_notify on public.partner_interest;
create trigger interest_notify after insert on public.partner_interest for each row execute function public.notify_event();
