-- ═══════════════════════════════════════════
-- FIX FOR 500 ERRORS (INFINITE RECURSION RLS)
-- ═══════════════════════════════════════════

-- 1. Create a secure function to check admin status bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop the recursive policies that caused the 500 error
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all assessment_results" ON public.assessment_results;
DROP POLICY IF EXISTS "Admins can view all mood_entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Admins can update assessments" ON public.assessments;
DROP POLICY IF EXISTS "Admins can insert assessments" ON public.assessments;
DROP POLICY IF EXISTS "Admins can delete assessments" ON public.assessments;
DROP POLICY IF EXISTS "Admins can insert specialists" ON public.specialists;
DROP POLICY IF EXISTS "Admins can update specialists" ON public.specialists;
DROP POLICY IF EXISTS "Admins can delete specialists" ON public.specialists;

-- 3. Recreate policies using the secure function
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can view all assessment_results" ON public.assessment_results FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can view all mood_entries" ON public.mood_entries FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update assessments" ON public.assessments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert assessments" ON public.assessments FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete assessments" ON public.assessments FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can insert specialists" ON public.specialists FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update specialists" ON public.specialists FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete specialists" ON public.specialists FOR DELETE USING (public.is_admin());
