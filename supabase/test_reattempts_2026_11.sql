-- Re-attempts: students can retake a test; rank is based on each student's best score.
alter table public.test_attempts drop constraint if exists test_attempts_test_id_user_id_key;
alter table public.test_attempts add column if not exists attempt_no int not null default 1;
create unique index if not exists test_attempts_unique_no on public.test_attempts (test_id, user_id, attempt_no);

-- Start (or resume) an attempt. A new attempt is created only if the previous one was submitted.
create or replace function public.start_test(p_test uuid) returns public.test_attempts
language plpgsql security definer set search_path = public as $$
declare t course_tests; a test_attempts; n int;
begin
  select * into t from course_tests where id = p_test;
  if t.id is null or not t.is_published then raise exception 'Test not available'; end if;
  if not (public.is_enrolled(t.course_slug) or public.can_manage_course(t.course_slug)) then raise exception 'Enrol in the course to take this test'; end if;
  if t.starts_at is not null and t.starts_at > now() then raise exception 'This test has not started yet'; end if;
  select * into a from test_attempts where test_id = p_test and user_id = auth.uid() and submitted_at is null order by attempt_no desc limit 1;
  if a.id is not null then return a; end if;
  if t.ends_at is not null and t.ends_at < now() then raise exception 'This test has closed'; end if;
  select coalesce(max(attempt_no), 0) + 1 into n from test_attempts where test_id = p_test and user_id = auth.uid();
  insert into test_attempts (test_id, user_id, attempt_no) values (p_test, auth.uid(), n) returning * into a;
  return a;
end; $$;

-- Submit the open attempt; score computed on the server
create or replace function public.submit_test(p_test uuid, p_answers jsonb) returns public.test_attempts
language plpgsql security definer set search_path = public as $$
declare t course_tests; a test_attempts; q record; c int := 0; w int := 0; s int := 0; stats jsonb := '{}'; ch text; ans text; cur jsonb;
begin
  select * into t from course_tests where id = p_test;
  select * into a from test_attempts where test_id = p_test and user_id = auth.uid() and submitted_at is null order by attempt_no desc limit 1;
  if a.id is null then
    select * into a from test_attempts where test_id = p_test and user_id = auth.uid() order by attempt_no desc limit 1;
    if a.id is null then raise exception 'Start the test first'; end if;
    return a;
  end if;
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

-- Class comparison based on each student's BEST score, plus my attempt history with rank per attempt
create or replace function public.test_summary(p_test uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb; mine numeric; hist jsonb;
begin
  if not public.can_access_course(public.test_course(p_test)) then raise exception 'not allowed'; end if;
  select max(score) into mine from test_attempts where test_id = p_test and user_id = auth.uid() and submitted_at is not null;
  with best as (select user_id, max(score) s from test_attempts where test_id = p_test and submitted_at is not null group by user_id)
  select jsonb_build_object(
    'participants', count(*), 'topper', max(s), 'average', round(avg(s), 2), 'lowest', min(s),
    'my_best', mine,
    'my_rank', case when mine is null then null else (select count(*) + 1 from best b2 where b2.s > mine) end)
  into r from best;
  with best as (select user_id, max(score) s from test_attempts where test_id = p_test and submitted_at is not null group by user_id)
  select coalesce(jsonb_agg(jsonb_build_object(
      'attempt_no', a.attempt_no, 'score', a.score, 'correct', a.correct, 'wrong', a.wrong, 'skipped', a.skipped,
      'submitted_at', a.submitted_at,
      'rank', (select count(*) + 1 from best b where b.user_id <> auth.uid() and b.s > a.score)) order by a.attempt_no), '[]')
  into hist from test_attempts a where a.test_id = p_test and a.user_id = auth.uid() and a.submitted_at is not null;
  return r || jsonb_build_object('attempts', hist);
end; $$;

-- One row per published test in a course for the current student: attempts, best, rank, class stats
create or replace function public.my_test_overview(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.can_access_course(p_slug) then raise exception 'not allowed'; end if;
  select coalesce(jsonb_agg(row_to_json(x) order by x.created_at), '[]') into r from (
    select t.id as test_id, t.title, t.created_at,
      (select count(*) from test_questions q where q.test_id = t.id) * t.marks_correct as max_marks,
      (select count(*) from test_attempts a where a.test_id = t.id and a.user_id = auth.uid() and a.submitted_at is not null) as attempts,
      (select max(score) from test_attempts a where a.test_id = t.id and a.user_id = auth.uid() and a.submitted_at is not null) as best,
      b.participants, b.topper, b.average, b.lowest,
      (select count(*) + 1 from (select user_id, max(score) s from test_attempts where test_id = t.id and submitted_at is not null group by user_id) z
         where z.s > (select max(score) from test_attempts a where a.test_id = t.id and a.user_id = auth.uid() and a.submitted_at is not null)) as rank
    from course_tests t
    left join lateral (
      select count(*) participants, max(s) topper, round(avg(s), 2) average, min(s) lowest
      from (select user_id, max(score) s from test_attempts where test_id = t.id and submitted_at is not null group by user_id) bb
    ) b on true
    where t.course_slug = p_slug and t.is_published
  ) x;
  return r;
end; $$;
grant execute on function public.start_test(uuid), public.submit_test(uuid, jsonb), public.test_summary(uuid), public.my_test_overview(text) to authenticated;
