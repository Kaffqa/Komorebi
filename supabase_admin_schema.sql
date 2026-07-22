-- ═══════════════════════════════════════════
-- ADMIN ROLE — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- ═══════════════════════════════════════════
-- 1. ADD COLUMNS TO profiles
-- ═══════════════════════════════════════════
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- ═══════════════════════════════════════════
-- 2. SPECIALISTS TABLE
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  rating TEXT DEFAULT '90%',
  experience TEXT DEFAULT '5 Years',
  price TEXT DEFAULT 'Rp. 0',
  location TEXT,
  hospital TEXT,
  phone TEXT,
  email TEXT,
  expertise TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on specialists
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

-- Everyone can read specialists
CREATE POLICY "Anyone can view specialists"
  ON public.specialists FOR SELECT
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert specialists"
  ON public.specialists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update
CREATE POLICY "Admins can update specialists"
  ON public.specialists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete
CREATE POLICY "Admins can delete specialists"
  ON public.specialists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════
-- 3. ADMIN RLS POLICIES FOR EXISTING TABLES
-- ═══════════════════════════════════════════

-- Admin can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update any profile (for ban/promote)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can read all assessment_results
CREATE POLICY "Admins can view all assessment_results"
  ON public.assessment_results FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can read all mood_entries
CREATE POLICY "Admins can view all mood_entries"
  ON public.mood_entries FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can manage assessments (for editing questions)
CREATE POLICY "Anyone can view assessments"
  ON public.assessments FOR SELECT
  USING (true);

CREATE POLICY "Admins can update assessments"
  ON public.assessments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete assessments"
  ON public.assessments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════
-- 4. RPC FUNCTIONS FOR ADMIN STATS
-- ═══════════════════════════════════════════

-- Get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'active_today', (SELECT COUNT(DISTINCT user_id) FROM public.mood_entries WHERE entry_date = CURRENT_DATE),
    'total_posts', (SELECT COUNT(*) FROM public.forum_posts),
    'total_assessments', (SELECT COUNT(*) FROM public.assessment_results),
    'avg_mood', (SELECT ROUND(AVG(mood_score)::numeric, 1) FROM public.mood_entries WHERE entry_date >= CURRENT_DATE - INTERVAL '7 days'),
    'new_users_week', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days'),
    'total_journal_entries', (SELECT COUNT(*) FROM public.journal_entries),
    'banned_users', (SELECT COUNT(*) FROM public.profiles WHERE is_banned = true)
  ) INTO result;
  RETURN result;
END;
$$;

-- Get assessment severity distribution
CREATE OR REPLACE FUNCTION get_assessment_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'severity_distribution', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT severity_level, COUNT(*) as count
        FROM public.assessment_results
        GROUP BY severity_level
        ORDER BY count DESC
      ) t
    ),
    'monthly_trend', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as count,
          ROUND(AVG(percentage)::numeric, 1) as avg_percentage
        FROM public.assessment_results
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
      ) t
    ),
    'total', (SELECT COUNT(*) FROM public.assessment_results)
  ) INTO result;
  RETURN result;
END;
$$;

-- ═══════════════════════════════════════════
-- 5. SEED DEFAULT SPECIALISTS (from hardcoded data)
-- ═══════════════════════════════════════════
INSERT INTO public.specialists (name, title, bio, avatar_url, rating, experience, price, location, hospital, phone, email, expertise, status)
VALUES
  (
    'Dr. Rina Kusuma, Sp.KJ',
    'Psikiater',
    'Dr. Rina Kusuma adalah psikiater bersertifikat dengan pengalaman lebih dari 15 tahun dalam menangani gangguan kecemasan, depresi, dan trauma. Beliau menerapkan pendekatan holistik yang menggabungkan terapi farmakologi dengan psikoterapi untuk hasil yang optimal.',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&h=400&fit=crop&crop=face',
    '98%', '15 Years', 'Rp. 500.000', 'Jakarta Selatan', 'RS Pondok Indah',
    '+62 812-3456-7890', 'dr.rina@example.com',
    ARRAY['Anxiety & Trauma Specialist', 'Work-Life Balance', 'Resilience Training', 'Chronic Stress'],
    'Available'
  ),
  (
    'Dr. Budi Santoso, M.Psi',
    'Psikolog Klinis',
    'Dr. Budi Santoso adalah psikolog klinis yang berfokus pada Cognitive Behavioral Therapy (CBT). Beliau membantu klien mengidentifikasi dan mengubah pola pikir negatif yang memengaruhi emosi dan perilaku mereka.',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&h=400&fit=crop&crop=face',
    '95%', '12 Years', 'Rp. 400.000', 'Jakarta Pusat', 'Klinik Jiwa Sehat',
    '+62 813-9876-5432', 'dr.budi@example.com',
    ARRAY['Cognitive Behavioral Therapy', 'Stress Management', 'Self Improvement'],
    'Available'
  ),
  (
    'Dr. Sari Dewi, Sp.KJ(K)',
    'Konsultan Psikiater',
    'Dr. Sari Dewi adalah konsultan psikiater senior yang mengkhususkan diri dalam psikiatri anak dan remaja. Dengan pengalaman 20 tahun, beliau menangani berbagai permasalahan perkembangan mental anak.',
    'https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=500&h=400&fit=crop&crop=face',
    '99%', '20 Years', 'Rp. 800.000', 'Bandung', 'RS Hasan Sadikin',
    '+62 811-2233-4455', 'dr.sari@example.com',
    ARRAY['Child & Adolescent Psychiatry', 'Autism', 'ADHD'],
    'Available'
  ),
  (
    'Dr. Arief Wicaksono, M.Psi',
    'Psikolog Klinis',
    'Dr. Arief Wicaksono adalah psikolog klinis yang berfokus pada trauma dan proses berduka. Beliau menggunakan pendekatan EMDR dan mindfulness-based therapy untuk membantu klien melewati pengalaman traumatis.',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&h=400&fit=crop&crop=face',
    '92%', '10 Years', 'Rp. 350.000', 'Yogyakarta', 'Klinik Sejiwa',
    '+62 856-7890-1234', 'dr.arief@example.com',
    ARRAY['Trauma & Grief Counseling', 'Mindfulness', 'Emotional Regulation'],
    'Available'
  ),
  (
    'Dr. Maya Putri, Sp.KJ',
    'Psikiater',
    'Dr. Maya Putri adalah psikiater yang berpengalaman menangani gangguan bipolar dan gangguan mood lainnya. Beliau menerapkan pendekatan berbasis bukti dalam perawatan psikiatri dan sangat terampil dalam manajemen obat.',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=500&h=400&fit=crop&crop=face',
    '96%', '14 Years', 'Rp. 600.000', 'Surabaya', 'RS Siloam Surabaya',
    '+62 878-5566-7788', 'dr.maya@example.com',
    ARRAY['Bipolar', 'Mood Disorders', 'Depression'],
    'Available'
  ),
  (
    'Dr. Hendra Wijaya, M.Psi',
    'Psikolog Klinis',
    'Dr. Hendra Wijaya adalah psikolog klinis yang fokus pada masalah kecanduan dan pemulihan. Beliau menggunakan terapi motivasi dan program 12 langkah yang telah terbukti efektif.',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&h=400&fit=crop&crop=face',
    '94%', '8 Years', 'Rp. 300.000', 'Semarang', 'Klinik Pulih Sehat',
    '+62 821-9988-7766', 'dr.hendra@example.com',
    ARRAY['Addiction', 'Recovery', 'Group Therapy'],
    'Available'
  );
