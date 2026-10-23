
-- ===== Daily streak & XP =====
CREATE TABLE public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own streak" ON public.user_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own streak" ON public.user_streaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own streak" ON public.user_streaks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_streaks_updated_at BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.record_daily_activity(p_xp integer DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date;
  v_row public.user_streaks;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  v_today := (now() + interval '5 hours 30 minutes')::date;

  SELECT * INTO v_row FROM public.user_streaks WHERE user_id = auth.uid();

  IF v_row.user_id IS NULL THEN
    INSERT INTO public.user_streaks (user_id, xp, streak, longest_streak, last_active_date)
    VALUES (auth.uid(), greatest(p_xp, 0), 1, 1, v_today);
  ELSIF v_row.last_active_date = v_today THEN
    UPDATE public.user_streaks
      SET xp = xp + greatest(p_xp, 0)
      WHERE user_id = auth.uid();
  ELSE
    UPDATE public.user_streaks
      SET xp = xp + greatest(p_xp, 0),
          streak = CASE WHEN v_row.last_active_date = v_today - 1 THEN v_row.streak + 1 ELSE 1 END,
          longest_streak = CASE
            WHEN v_row.last_active_date = v_today - 1
              THEN greatest(v_row.longest_streak, v_row.streak + 1)
            ELSE greatest(v_row.longest_streak, 1)
          END,
          last_active_date = v_today
      WHERE user_id = auth.uid();
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_daily_activity(integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.record_daily_activity(integer) TO authenticated;

-- ===== Community chat =====
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Student',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in students read chat" ON public.chat_messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students post own messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX chat_messages_created_at_idx ON public.chat_messages (created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
