/*
# Fix owner column defaults and split RLS policies

## What this migration does

1. Adds `DEFAULT auth.uid()` to the `user_id` columns on `enrollments` and
   `lesson_progress` so inserts that omit `user_id` still satisfy the INSERT
   policy's `WITH CHECK (auth.uid() = user_id)`.
2. Replaces the single `FOR ALL` policy on each table with four separate
   per-verb policies (SELECT, INSERT, UPDATE, DELETE) as required by the
   project's RLS conventions.

## Tables affected

- `enrollments` — `user_id` now defaults to `auth.uid()`; policies split.
- `lesson_progress` — `user_id` now defaults to `auth.uid()`; policies split.
- `profiles` — `id` is a FK to `auth.users.id` (no default needed); policies split.

## Security

All three tables keep RLS enabled. Every policy is scoped to `authenticated`
with an ownership check via `auth.uid()`. No `USING (true)` shortcuts.
*/

-- ──────────────────────────────────────────────
-- 1. enrollments: add DEFAULT auth.uid() to user_id
-- ──────────────────────────────────────────────
ALTER TABLE enrollments
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ──────────────────────────────────────────────
-- 2. lesson_progress: add DEFAULT auth.uid() to user_id
-- ──────────────────────────────────────────────
ALTER TABLE lesson_progress
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ──────────────────────────────────────────────
-- 3. enrollments: replace FOR ALL policy with 4 per-verb policies
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own enrollments" ON enrollments;

CREATE POLICY "select_own_enrollments" ON enrollments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_enrollments" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_enrollments" ON enrollments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_enrollments" ON enrollments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- 4. lesson_progress: replace FOR ALL policy with 4 per-verb policies
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own progress" ON lesson_progress;

CREATE POLICY "select_own_progress" ON lesson_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_progress" ON lesson_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_progress" ON lesson_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_progress" ON lesson_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- 5. profiles: replace FOR ALL policy with 4 per-verb policies
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
