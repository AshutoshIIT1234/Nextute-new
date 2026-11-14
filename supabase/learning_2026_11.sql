-- Nextute learning platform: mentors, live classes, recordings, notes, test series
-- Run once in Supabase → SQL Editor.

-- 1) Mentor role
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student','institute','admin','mentor'));
alter table public.profiles add column if not exists mentor_subject text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','student');
begin
  if r not in ('student','institute','mentor') then r := 'student'; end if;
  insert into public.profiles (id, full_name, email, phone, role, city, class_level, mentor_subject)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email,
          coalesce(new.raw_user_meta_data->>'phone', right(new.phone, 10)), r,
          new.raw_user_meta_data->>'city', new.raw_user_meta_data->>'class_level',
          new.raw_user_meta_data->>'mentor_subject');
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2) Which mentor teaches which course (only admins can assign = mentor approval)
create table if not exists public.course_mentors (
  course_slug text not null references public.courses(slug) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_slug, mentor_id)
);
alter table public.course_mentors enable row level security;
drop policy if exists "course mentors read" on public.course_mentors;
create policy "course mentors read" on public.course_mentors for select to authenticated using (mentor_id = auth.uid() or public.is_admin());
drop policy if exists "course mentors admin" on public.course_mentors;
create policy "course mentors admin" on public.course_mentors for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, delete on public.course_mentors to authenticated;

-- 3) Access helpers
create or replace function public.is_course_mentor(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from course_mentors where course_slug = p_slug and mentor_id = auth.uid()); $$;
create or replace function public.is_enrolled(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from course_enrollments where course_slug = p_slug and user_id = auth.uid() and status = 'paid'); $$;
create or replace function public.can_manage_course(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_course_mentor(p_slug); $$;
create or replace function public.can_access_course(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_course_mentor(p_slug) or public.is_enrolled(p_slug); $$;
grant execute on function public.is_course_mentor(text), public.is_enrolled(text), public.can_manage_course(text), public.can_access_course(text) to authenticated;

-- Mentors can see the students enrolled in their course
drop policy if exists "mentor sees course enrollments" on public.course_enrollments;
create policy "mentor sees course enrollments" on public.course_enrollments for select to authenticated
  using (status = 'paid' and public.is_course_mentor(course_slug));

-- 4) Live classes + recordings (YouTube unlisted video ids)
create table if not exists public.course_videos (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null references public.courses(slug) on delete cascade,
  kind text not null default 'live' check (kind in ('live','recorded')),
  title text not null,
  chapter text,
  description text,
  youtube_id text not null,
  starts_at timestamptz,
  duration_min int default 60,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists course_videos_course on public.course_videos (course_slug, kind);
alter table public.course_videos enable row level security;
drop policy if exists "videos read" on public.course_videos;
create policy "videos read" on public.course_videos for select to authenticated using (public.can_access_course(course_slug));
drop policy if exists "videos manage" on public.course_videos;
create policy "videos manage" on public.course_videos for all to authenticated using (public.can_manage_course(course_slug)) with check (public.can_manage_course(course_slug));
grant select, insert, update, delete on public.course_videos to authenticated;

-- 5) Class notes (files in private storage bucket "course-files/<course_slug>/...")
create table if not exists public.course_notes (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null references public.courses(slug) on delete cascade,
  title text not null,
  chapter text,
  file_path text not null,
  file_name text,
  size_bytes bigint,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.course_notes enable row level security;
drop policy if exists "notes read" on public.course_notes;
create policy "notes read" on public.course_notes for select to authenticated using (public.can_access_course(course_slug));
drop policy if exists "notes manage" on public.course_notes;
create policy "notes manage" on public.course_notes for all to authenticated using (public.can_manage_course(course_slug)) with check (public.can_manage_course(course_slug));
grant select, insert, update, delete on public.course_notes to authenticated;

insert into storage.buckets (id, name, public, file_size_limit) values ('course-files', 'course-files', false, 52428800)
on conflict (id) do nothing;
drop policy if exists "course files read" on storage.objects;
create policy "course files read" on storage.objects for select to authenticated
  using (bucket_id = 'course-files' and public.can_access_course((storage.foldername(name))[1]));
drop policy if exists "course files write" on storage.objects;
create policy "course files write" on storage.objects for insert to authenticated
  with check (bucket_id = 'course-files' and public.can_manage_course((storage.foldername(name))[1]));
drop policy if exists "course files delete" on storage.objects;
create policy "course files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'course-files' and public.can_manage_course((storage.foldername(name))[1]));

-- 6) Test series
create table if not exists public.course_tests (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null references public.courses(slug) on delete cascade,
  title text not null,
  syllabus text,
  duration_min int not null default 60,
  starts_at timestamptz,
  ends_at timestamptz,
  marks_correct numeric not null default 2.5,
  marks_wrong numeric not null default 0.83,
  is_published boolean not null default false,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.course_tests enable row level security;
drop policy if exists "tests read" on public.course_tests;
create policy "tests read" on public.course_tests for select to authenticated
  using (public.can_manage_course(course_slug) or (is_published and public.is_enrolled(course_slug)));
drop policy if exists "tests manage" on public.course_tests;
create policy "tests manage" on public.course_tests for all to authenticated using (public.can_manage_course(course_slug)) with check (public.can_manage_course(course_slug));
grant select, insert, update, delete on public.course_tests to authenticated;

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.course_tests(id) on delete cascade,
  position int not null default 0,
  question text not null,
  options text[] not null,
  chapter text,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists test_questions_test on public.test_questions (test_id, position);

-- correct answers live in a separate table so students cannot read them before submitting
create table if not exists public.test_keys (
  question_id uuid primary key references public.test_questions(id) on delete cascade,
  correct int not null,
  explanation text
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.course_tests(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb not null default '{}',
  score numeric,
  correct int, wrong int, skipped int,
  chapter_stats jsonb,
  unique (test_id, user_id)
);

create or replace function public.test_course(p_test uuid) returns text
language sql stable security definer set search_path = public as $$ select course_slug from course_tests where id = p_test; $$;
grant execute on function public.test_course(uuid) to authenticated;

alter table public.test_questions enable row level security;
drop policy if exists "questions read" on public.test_questions;
create policy "questions read" on public.test_questions for select to authenticated
  using (public.can_manage_course(public.test_course(test_id))
     or exists(select 1 from test_attempts a where a.test_id = test_questions.test_id and a.user_id = auth.uid()));
drop policy if exists "questions manage" on public.test_questions;
create policy "questions manage" on public.test_questions for all to authenticated
  using (public.can_manage_course(public.test_course(test_id))) with check (public.can_manage_course(public.test_course(test_id)));
grant select, insert, update, delete on public.test_questions to authenticated;

alter table public.test_keys enable row level security;
drop policy if exists "keys read" on public.test_keys;
create policy "keys read" on public.test_keys for select to authenticated
  using (exists(select 1 from test_questions q where q.id = question_id and (
    public.can_manage_course(public.test_course(q.test_id))
    or exists(select 1 from test_attempts a where a.test_id = q.test_id and a.user_id = auth.uid() and a.submitted_at is not null))));
drop policy if exists "keys manage" on public.test_keys;
create policy "keys manage" on public.test_keys for all to authenticated
  using (exists(select 1 from test_questions q where q.id = question_id and public.can_manage_course(public.test_course(q.test_id))))
  with check (exists(select 1 from test_questions q where q.id = question_id and public.can_manage_course(public.test_course(q.test_id))));
grant select, insert, update, delete on public.test_keys to authenticated;

alter table public.test_attempts enable row level security;
drop policy if exists "attempts read" on public.test_attempts;
create policy "attempts read" on public.test_attempts for select to authenticated
  using (user_id = auth.uid() or public.can_manage_course(public.test_course(test_id)));
grant select on public.test_attempts to authenticated;

-- Start a test (creates the attempt; questions become visible to this student)
create or replace function public.start_test(p_test uuid) returns public.test_attempts
language plpgsql security definer set search_path = public as $$
declare t course_tests; a test_attempts;
begin
  select * into t from course_tests where id = p_test;
  if t.id is null or not t.is_published then raise exception 'Test not available'; end if;
  if not (public.is_enrolled(t.course_slug) or public.can_manage_course(t.course_slug)) then raise exception 'Enrol in the course to take this test'; end if;
  if t.starts_at is not null and t.starts_at > now() then raise exception 'This test has not started yet'; end if;
  select * into a from test_attempts where test_id = p_test and user_id = auth.uid();
  if a.id is not null then return a; end if;
  if t.ends_at is not null and t.ends_at < now() then raise exception 'This test has closed'; end if;
  insert into test_attempts (test_id, user_id) values (p_test, auth.uid()) returning * into a;
  return a;
end; $$;

-- Submit answers ({"<question_id>": optionIndex}); score is computed on the server
create or replace function public.submit_test(p_test uuid, p_answers jsonb) returns public.test_attempts
language plpgsql security definer set search_path = public as $$
declare t course_tests; a test_attempts; q record; c int := 0; w int := 0; s int := 0; stats jsonb := '{}'; ch text; ans text; cur jsonb;
begin
  select * into t from course_tests where id = p_test;
  select * into a from test_attempts where test_id = p_test and user_id = auth.uid();
  if a.id is null then raise exception 'Start the test first'; end if;
  if a.submitted_at is not null then return a; end if;
  for q in select tq.id, coalesce(nullif(tq.chapter, ''), 'General') as chapter, k.correct
           from test_questions tq left join test_keys k on k.question_id = tq.id where tq.test_id = p_test loop
    ch := q.chapter;
    cur := coalesce(stats->ch, '{"total":0,"correct":0,"wrong":0}'::jsonb);
    cur := jsonb_set(cur, '{total}', to_jsonb((cur->>'total')::int + 1));
    ans := p_answers->>(q.id::text);
    if ans is null or ans = '' then s := s + 1;
    elsif ans::int = q.correct then c := c + 1; cur := jsonb_set(cur, '{correct}', to_jsonb((cur->>'correct')::int + 1));
    else w := w + 1; cur := jsonb_set(cur, '{wrong}', to_jsonb((cur->>'wrong')::int + 1));
    end if;
    stats := jsonb_set(stats, array[ch], cur);
  end loop;
  update test_attempts set submitted_at = now(), answers = coalesce(p_answers, '{}'), correct = c, wrong = w, skipped = s,
    score = round(c * t.marks_correct - w * t.marks_wrong, 2), chapter_stats = stats
  where id = a.id returning * into a;
  return a;
end; $$;

-- Class comparison for the report
create or replace function public.test_summary(p_test uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb; mine numeric;
begin
  if not public.can_access_course(public.test_course(p_test)) then raise exception 'not allowed'; end if;
  select score into mine from test_attempts where test_id = p_test and user_id = auth.uid() and submitted_at is not null;
  select jsonb_build_object(
    'participants', count(*),
    'topper', max(score), 'average', round(avg(score), 2), 'lowest', min(score),
    'my_score', mine,
    'my_rank', case when mine is null then null else (select count(*) + 1 from test_attempts x where x.test_id = p_test and x.submitted_at is not null and x.score > mine) end)
  into r from test_attempts where test_id = p_test and submitted_at is not null;
  return r;
end; $$;
grant execute on function public.start_test(uuid), public.submit_test(uuid, jsonb), public.test_summary(uuid) to authenticated;
