-- 1. Safely add columns to profiles table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='instructor_title') THEN
        ALTER TABLE public.profiles ADD COLUMN instructor_title text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='website') THEN
        ALTER TABLE public.profiles ADD COLUMN website text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='twitter') THEN
        ALTER TABLE public.profiles ADD COLUMN twitter text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='expertise') THEN
        ALTER TABLE public.profiles ADD COLUMN expertise text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='notify_enrollments') THEN
        ALTER TABLE public.profiles ADD COLUMN notify_enrollments boolean DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='notify_questions') THEN
        ALTER TABLE public.profiles ADD COLUMN notify_questions boolean DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='notify_revenue') THEN
        ALTER TABLE public.profiles ADD COLUMN notify_revenue boolean DEFAULT false;
    END IF;
END $$;

-- 2. Safely setup storage
-- Ensure buckets exist (inserts will fail if they exist, so we use ON CONFLICT)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-media', 'course-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Safely update Storage RLS (Drop first to avoid "already exists" errors)
DROP POLICY IF EXISTS "Public Access Course Media" ON storage.objects;
CREATE POLICY "Public Access Course Media" ON storage.objects FOR SELECT USING (bucket_id = 'course-media');

DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Instructor Uploads" ON storage.objects;
CREATE POLICY "Instructor Uploads" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'course-media' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'instructor'
);

DROP POLICY IF EXISTS "User Avatar Uploads" ON storage.objects;
CREATE POLICY "User Avatar Uploads" ON storage.objects FOR ALL 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
