-- Assessment Questions table (one set of questions per course)
create table if not exists public.assessment_questions (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('a','b','c','d')),
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.assessment_questions enable row level security;

-- Instructors manage their own course questions
create policy "Instructors can manage assessment questions." on assessment_questions for all
using (
  exists (select 1 from courses where id = assessment_questions.course_id and instructor_id = auth.uid())
);

-- Students & anyone enrolled can view questions
create policy "Enrolled students can view assessment questions." on assessment_questions for select
using (
  exists (select 1 from enrollments where course_id = assessment_questions.course_id and student_id = auth.uid())
  or exists (select 1 from courses where id = assessment_questions.course_id and instructor_id = auth.uid())
);

-- Student Assessment Attempts
create table if not exists public.assessment_attempts (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null,          -- number of correct answers
  total integer not null,          -- total questions
  passed boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (course_id, student_id)   -- one attempt record per student per course (upserted)
);

alter table public.assessment_attempts enable row level security;

create policy "Students can manage their own attempts." on assessment_attempts for all
using (auth.uid() = student_id);

create policy "Instructors can view attempts for their courses." on assessment_attempts for select
using (
  exists (select 1 from courses where id = assessment_attempts.course_id and instructor_id = auth.uid())
);
