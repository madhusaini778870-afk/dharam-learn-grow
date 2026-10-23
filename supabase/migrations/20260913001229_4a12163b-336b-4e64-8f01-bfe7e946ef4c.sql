-- Roles ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp helper ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- App settings --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;
CREATE POLICY "Anyone can read settings" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.app_settings;
CREATE POLICY "Admins manage settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (key, value) VALUES
  ('sources', '{"primary":"https://physicswallahx.vercel.app","batchList":"https://physicswallahx.vercel.app/batches","additional":["https://www.pwmarco.site/study/batches","https://vidya-verse.ai.studio/"]}'::jsonb),
  ('community', '{"whatsappEnabled":true,"whatsappUrl":"https://whatsapp.com/channel/0029VbB3XKSK0IBqD72ndg2i","telegramEnabled":true,"telegramUrl":"https://t.me/mrlokygamer","title":"Join Dharam Bhai Study","message":"Get class updates, announcements and study updates.","cooldownDays":3}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Admin catalogue -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  category text,
  class_name text,
  exam text,
  source_url text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.admin_courses(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT 'General',
  chapter text NOT NULL DEFAULT 'General',
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  video_url text,
  notes_url text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.admin_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_overrides (
  course_id text PRIMARY KEY,
  hidden boolean NOT NULL DEFAULT false,
  title text,
  description text,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_courses TO anon, authenticated;
GRANT SELECT ON public.admin_lectures TO anon, authenticated;
GRANT SELECT ON public.admin_notes TO anon, authenticated;
GRANT SELECT ON public.course_overrides TO anon, authenticated;
GRANT ALL ON public.admin_courses TO service_role;
GRANT ALL ON public.admin_lectures TO service_role;
GRANT ALL ON public.admin_notes TO service_role;
GRANT ALL ON public.course_overrides TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.admin_courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.admin_lectures TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.admin_notes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_overrides TO authenticated;

ALTER TABLE public.admin_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads admin courses" ON public.admin_courses;
CREATE POLICY "Anyone reads admin courses" ON public.admin_courses
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage admin courses" ON public.admin_courses;
CREATE POLICY "Admins manage admin courses" ON public.admin_courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone reads admin lectures" ON public.admin_lectures;
CREATE POLICY "Anyone reads admin lectures" ON public.admin_lectures
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage admin lectures" ON public.admin_lectures;
CREATE POLICY "Admins manage admin lectures" ON public.admin_lectures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone reads admin notes" ON public.admin_notes;
CREATE POLICY "Anyone reads admin notes" ON public.admin_notes
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage admin notes" ON public.admin_notes;
CREATE POLICY "Admins manage admin notes" ON public.admin_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone reads course overrides" ON public.course_overrides;
CREATE POLICY "Anyone reads course overrides" ON public.course_overrides
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage course overrides" ON public.course_overrides;
CREATE POLICY "Admins manage course overrides" ON public.course_overrides
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS admin_courses_updated_at ON public.admin_courses;
CREATE TRIGGER admin_courses_updated_at BEFORE UPDATE ON public.admin_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS admin_lectures_updated_at ON public.admin_lectures;
CREATE TRIGGER admin_lectures_updated_at BEFORE UPDATE ON public.admin_lectures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS admin_notes_updated_at ON public.admin_notes;
CREATE TRIGGER admin_notes_updated_at BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS course_overrides_updated_at ON public.course_overrides;
CREATE TRIGGER course_overrides_updated_at BEFORE UPDATE ON public.course_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Progress + enrollments ----------------------------------------------------
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS position_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS subject_id text,
  ADD COLUMN IF NOT EXISTS chapter_id text,
  ADD COLUMN IF NOT EXISTS lesson_title text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_lesson_key UNIQUE (user_id, lesson_id);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS last_lesson_id text,
  ADD COLUMN IF NOT EXISTS last_lesson_title text,
  ADD COLUMN IF NOT EXISTS last_subject_id text,
  ADD COLUMN IF NOT EXISTS last_chapter_id text,
  ADD COLUMN IF NOT EXISTS last_watched_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.enrollments
    ADD CONSTRAINT enrollments_user_course_key UNIQUE (user_id, course_id);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read all enrollments" ON public.enrollments;
CREATE POLICY "Admins read all enrollments" ON public.enrollments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read all progress" ON public.lesson_progress;
CREATE POLICY "Admins read all progress" ON public.lesson_progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));