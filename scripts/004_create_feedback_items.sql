-- 004_create_feedback_items.sql
-- Post-launch feedback + support triage foundation.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.feedback_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('bug', 'feature_request', 'general_feedback')),
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'resolved', 'ignored')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS feedback_items_user_id_idx ON public.feedback_items(user_id);
CREATE INDEX IF NOT EXISTS feedback_items_type_idx ON public.feedback_items(feedback_type);
CREATE INDEX IF NOT EXISTS feedback_items_status_idx ON public.feedback_items(status);
CREATE INDEX IF NOT EXISTS feedback_items_created_at_idx ON public.feedback_items(created_at DESC);

ALTER TABLE public.feedback_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback_items;
CREATE POLICY "Users can insert own feedback"
ON public.feedback_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback_items;
CREATE POLICY "Users can view own feedback"
ON public.feedback_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback_items;
CREATE POLICY "Admins can view all feedback"
ON public.feedback_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_admin = true
  )
);

DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback_items;
CREATE POLICY "Admins can update feedback"
ON public.feedback_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_admin = true
  )
);

CREATE OR REPLACE FUNCTION public.touch_feedback_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_items_touch_updated_at ON public.feedback_items;
CREATE TRIGGER feedback_items_touch_updated_at
BEFORE UPDATE ON public.feedback_items
FOR EACH ROW
EXECUTE FUNCTION public.touch_feedback_items_updated_at();
