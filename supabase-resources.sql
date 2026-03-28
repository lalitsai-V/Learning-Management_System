-- Course Resources table
create table if not exists public.course_resources (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.course_resources enable row level security;

-- Anyone can view resources for published courses
create policy "Anyone can view resources for published courses." on course_resources for select
using (
  exists (select 1 from courses where id = course_resources.course_id and is_published = true)
  or exists (select 1 from courses where id = course_resources.course_id and instructor_id = auth.uid())
  or exists (select 1 from enrollments where course_id = course_resources.course_id and student_id = auth.uid())
);

-- Only instructors can manage resources for their own courses
create policy "Instructors can manage resources for their courses." on course_resources for all
using (
  exists (select 1 from courses where id = course_resources.course_id and instructor_id = auth.uid())
);
