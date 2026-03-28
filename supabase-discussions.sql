-- Safe migration: add parent_id and is_instructor_reply to existing course_discussions table

-- 1. Add parent_id column (for threaded replies)
ALTER TABLE public.course_discussions
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.course_discussions(id) ON DELETE CASCADE;

-- 2. Add is_instructor_reply flag
ALTER TABLE public.course_discussions
  ADD COLUMN IF NOT EXISTS is_instructor_reply boolean NOT NULL DEFAULT false;

-- 3. Add RLS policy for instructors to post replies (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'course_discussions'
      AND policyname = 'Instructors can post replies to discussions.'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Instructors can post replies to discussions."
      ON public.course_discussions FOR INSERT
      WITH CHECK (
        auth.uid() = student_id
        AND EXISTS (
          SELECT 1 FROM courses
          WHERE id = course_discussions.course_id
            AND instructor_id = auth.uid()
        )
      )
    $policy$;
  END IF;
END $$;

-- 4. Realtime already enabled from initial migration — no action needed.
