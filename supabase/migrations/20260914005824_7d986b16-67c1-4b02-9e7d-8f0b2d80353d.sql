CREATE TABLE public.admin_live_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  teacher text,
  join_url text,
  starts_at timestamptz,
  exam text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_live_classes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_live_classes TO authenticated;
GRANT ALL ON public.admin_live_classes TO service_role;
ALTER TABLE public.admin_live_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads live classes" ON public.admin_live_classes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage live classes" ON public.admin_live_classes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER admin_live_classes_updated_at BEFORE UPDATE ON public.admin_live_classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.admin_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_url text,
  file_url text,
  exam text,
  class_name text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_books TO authenticated;
GRANT ALL ON public.admin_books TO service_role;
ALTER TABLE public.admin_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads books" ON public.admin_books FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage books" ON public.admin_books FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER admin_books_updated_at BEFORE UPDATE ON public.admin_books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();