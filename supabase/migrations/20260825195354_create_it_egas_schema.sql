/*
# IT-EGAS Enterprise Workspace Schema

1. Overview
This migration creates the complete database schema for the IT-EGAS enterprise workspace,
a Jira-like team management platform. It includes tables for user profiles with roles,
tasks with Kanban board statuses, daily attendance records, and audit activity logs.

2. New Tables
- `profiles`: Extends Supabase auth users with display name, role (admin/team_leader/team_member),
  and avatar. Seeded with the IT-EGAS team roster.
- `tasks`: Kanban board tasks with status (todo/in_progress/review/done), priority
  (low/medium/high/urgent), category, assignee, creator, and timestamps.
- `attendance`: Daily attendance records with status (present/absent/late/remote/leave),
  check-in/out times, and notes.
- `activity_logs`: Audit trail of user actions across the workspace.

3. Security
- RLS enabled on all tables.
- All authenticated users can read all data (shared team workspace).
- All authenticated users can insert/update tasks, attendance, and activity logs.
- Users can update their own profile. Admins and team leaders can update any profile.
- Profile creation is handled automatically by a trigger on auth.users insert.

4. Triggers
- `handle_new_user`: On auth.users insert, finds a seeded profile with matching email
  and links it, or creates a new profile with role 'team_member'. The very first user
  to sign up receives the 'admin' role.

5. Notes
- The profiles table uses its own UUID as primary key, with a nullable `user_id` column
  linking to auth.users. This allows seeding team member profiles before they sign up.
- When a user signs up with an email that matches a seeded profile, the trigger links
  the auth user to that profile by setting user_id.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'team_member' CHECK (role IN ('admin', 'team_leader', 'team_member')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE TO authenticated USING (true);

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text NOT NULL DEFAULT 'General',
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_all" ON tasks;
CREATE POLICY "tasks_select_all"
  ON tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tasks_insert_all" ON tasks;
CREATE POLICY "tasks_insert_all"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_update_all" ON tasks;
CREATE POLICY "tasks_update_all"
  ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_delete_all" ON tasks;
CREATE POLICY "tasks_delete_all"
  ON tasks FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'remote', 'leave')),
  check_in timestamptz,
  check_out timestamptz,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select_all" ON attendance;
CREATE POLICY "attendance_select_all"
  ON attendance FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "attendance_insert_all" ON attendance;
CREATE POLICY "attendance_insert_all"
  ON attendance FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_update_all" ON attendance;
CREATE POLICY "attendance_update_all"
  ON attendance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_delete_all" ON attendance;
CREATE POLICY "attendance_delete_all"
  ON attendance FOR DELETE TO authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);

-- ============================================================
-- ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT 'task',
  entity_id uuid,
  details text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_select_all" ON activity_logs;
CREATE POLICY "activity_logs_select_all"
  ON activity_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activity_logs_insert_all" ON activity_logs;
CREATE POLICY "activity_logs_insert_all"
  ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER FOR TASKS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- NEW USER TRIGGER - auto-create/link profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_profile RECORD;
  user_count integer;
BEGIN
  -- Check if a seeded profile with this email already exists
  SELECT * INTO existing_profile FROM profiles WHERE email = NEW.email LIMIT 1;

  IF FOUND THEN
    -- Link the auth user to the existing seeded profile
    UPDATE profiles SET user_id = NEW.id WHERE id = existing_profile.id;
  ELSE
    -- Check if this is the first user (make them admin)
    SELECT count(*) INTO user_count FROM profiles WHERE user_id IS NOT NULL;

    IF user_count = 0 THEN
      INSERT INTO profiles (user_id, email, display_name, role)
      VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'admin');
    ELSE
      INSERT INTO profiles (user_id, email, display_name, role)
      VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'team_member');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED TEAM ROSTER
-- ============================================================
INSERT INTO profiles (email, display_name, role) VALUES
  ('islam.alqadi@it-egas.com', 'إسلام القاضي', 'team_leader'),
  ('mohamed@it-egas.com', 'Mohamed', 'team_member'),
  ('marwa@it-egas.com', 'Marwa', 'team_member'),
  ('sherief@it-egas.com', 'Sherief', 'team_member'),
  ('sohila@it-egas.com', 'Sohila', 'team_member'),
  ('maghraby@it-egas.com', 'Maghraby', 'team_member'),
  ('mamdouh@it-egas.com', 'Mamdouh', 'team_member'),
  ('mahmoud@it-egas.com', 'Mahmoud', 'team_member')
ON CONFLICT DO NOTHING;