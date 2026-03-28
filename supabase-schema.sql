-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Custom Types
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('student', 'instructor');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_type') THEN
        CREATE TYPE public.lesson_type AS ENUM ('video', 'article', 'assessment');
    END IF;
END $$;

-- 2. Tables

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role user_role default 'student'::user_role not null,
  full_name text,
  avatar_url text,
  instructor_title text,
  bio text,
  website text,
  twitter text,
  expertise text,
  notify_enrollments boolean default true,
  notify_questions boolean default true,
  notify_revenue boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courses table
create table if not exists public.courses (
  id uuid default uuid_generate_v4() primary key,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  thumbnail_url text,
  category text,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Modules table
create table if not exists public.modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lessons table
create table if not exists public.lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.modules(id) on delete cascade not null,
  title text not null,
  type lesson_type default 'video'::lesson_type not null,
  content text, -- for articles or rich text instructions
  media_url text, -- for videos or images from storage
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enrollments table
create table if not exists public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  progress_percent integer default 0 not null,
  is_completed boolean default false not null,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, course_id)
);

-- Lesson Progress table
create table if not exists public.lesson_progress (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, lesson_id)
);

-- 3. Row Level Security (RLS) Policies

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- Profiles: Anyone can read profiles. Users can update their own profile.
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Courses: 
-- Anyone can see published courses.
create policy "Published courses are viewable by everyone." on courses for select using (is_published = true);
create policy "Instructors can CRUD own courses." on courses for all using (auth.uid() = instructor_id);
-- Explicit delete policy to ensure permanent deletion
create policy "Instructors can delete own courses." on courses for delete using (auth.uid() = instructor_id);

-- Modules:
-- Anyone can view modules of published courses.
create policy "Modules of published courses are viewable by everyone." on modules for select 
using (
  exists (
    select 1 from courses where id = modules.course_id and is_published = true
  )
);
-- Instructors can CRUD modules for their courses.
create policy "Instructors can CRUD modules for their courses." on modules for all 
using (
  exists (
    select 1 from courses where id = modules.course_id and instructor_id = auth.uid()
  )
);

-- Lessons:
-- Enrolled students and anyone (if we want previews) can view lessons of published courses. 
-- For now, keep it simple: Anyone can view lessons of published courses (app UI handles locking).
create policy "Lessons are viewable by everyone if course is published." on lessons for select 
using (
  exists (
    select 1 from modules
    join courses on courses.id = modules.course_id
    where modules.id = lessons.module_id and courses.is_published = true
  )
);
-- Instructors can CRUD lessons for their modules.
create policy "Instructors can CRUD lessons." on lessons for all 
using (
  exists (
    select 1 from modules
    join courses on courses.id = modules.course_id
    where modules.id = lessons.module_id and courses.instructor_id = auth.uid()
  )
);

-- Enrollments:
-- Students can see their own enrollments.
create policy "Students can view own enrollments." on enrollments for select using (auth.uid() = student_id);
-- Students can create their own enrollments (Bucket Learn List).
create policy "Students can create own enrollments." on enrollments for insert with check (auth.uid() = student_id);
-- Students can update their own enrollments (progress).
create policy "Students can update own enrollments." on enrollments for update using (auth.uid() = student_id);
-- Students can delete their own enrollments (unenroll).
create policy "Students can delete own enrollments." on enrollments for delete using (auth.uid() = student_id);
-- Instructors can view enrollments for their courses (for analytics).
create policy "Instructors can view enrollments for their courses." on enrollments for select 
using (
  exists (
    select 1 from courses where id = enrollments.course_id and instructor_id = auth.uid()
  )
);

-- Lesson Progress:
-- Students can manage their own lesson progress.
create policy "Students can manage own progress." on lesson_progress for all using (auth.uid() = student_id);

-- 4. Supabase Storage Setup (Run these manually in SQL Editor or via UI)
-- Requires Storage to be enabled in Supabase!
insert into storage.buckets (id, name, public) values ('course-media', 'course-media', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage RLS
-- Anyone can read public bucket
create policy "Public Access Course Media" on storage.objects for select using (bucket_id = 'course-media');
create policy "Public Access Avatars" on storage.objects for select using (bucket_id = 'avatars');

-- Only Instructors can upload to course-media bucket
create policy "Instructor Uploads" on storage.objects for insert with check (
  bucket_id = 'course-media' and (select role from public.profiles where id = auth.uid()) = 'instructor'
);

-- Users can upload their own avatars
create policy "User Avatar Uploads" on storage.objects for all 
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Course Ratings table
create table if not exists public.course_ratings (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, course_id)
);

alter table public.course_ratings enable row level security;

-- Ratings RLS
create policy "Anyone can view ratings." on course_ratings for select using (true);
-- Wishlist table
create table if not exists public.wishlist (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, course_id)
);

alter table public.wishlist enable row level security;

-- Wishlist RLS
create policy "Students can view own wishlist." on wishlist for select using (auth.uid() = student_id);
create policy "Students can manage own wishlist." on wishlist for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- Allow instructors to see who wishlisted their courses
create policy "Instructors can view wishlist for their courses." on wishlist for select 
using (
  exists (
    select 1 from courses where id = wishlist.course_id and instructor_id = auth.uid()
  )
);
