-- Migration: Allow family partners to view and update logistics on activities
-- Apply in Supabase SQL Editor (Primary Database, Role: postgres)

-- ── 1. Create helper function (SECURITY DEFINER avoids RLS recursion) ────────
CREATE OR REPLACE FUNCTION is_family_partner_of(me uuid, other_user uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = me
      AND fm2.user_id = other_user
      AND me <> other_user
  );
$$;

-- ── 2. Drop existing SELECT policies on activities (common names) ─────────────
DROP POLICY IF EXISTS "Users can view own activities"                    ON activities;
DROP POLICY IF EXISTS "Enable read access for users based on user_id"    ON activities;
DROP POLICY IF EXISTS "activities_select_own"                            ON activities;
DROP POLICY IF EXISTS "activities_family_select"                         ON activities;

-- ── 3. New SELECT: own OR family partner's activities ────────────────────────
CREATE POLICY "activities_family_select" ON activities
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_family_partner_of(auth.uid(), user_id)
  );

-- ── 4. Drop existing UPDATE policies on activities ───────────────────────────
DROP POLICY IF EXISTS "Users can update own activities"                  ON activities;
DROP POLICY IF EXISTS "activities_update_own"                            ON activities;
DROP POLICY IF EXISTS "activities_family_update"                         ON activities;

-- ── 5. New UPDATE: own OR family partner's activities (for logistics chips) ──
CREATE POLICY "activities_family_update" ON activities
  FOR UPDATE USING (
    user_id = auth.uid()
    OR is_family_partner_of(auth.uid(), user_id)
  );
