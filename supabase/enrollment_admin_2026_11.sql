-- Applied 13 Nov 2026: admin can add/remove students in a batch
alter table public.course_enrollments drop constraint if exists course_enrollments_status_check;
alter table public.course_enrollments add constraint course_enrollments_status_check check (status in ('created','paid','failed','refunded','removed'));
alter table public.course_enrollments add column if not exists added_by_admin boolean not null default false;
alter table public.course_enrollments add column if not exists note text;
create policy "admin manage enrollments" on public.course_enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- enrollment_defaults(): admins keep their own status/amount; students always start as unpaid at course price
