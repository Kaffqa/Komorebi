-- Supabase Schema for Dashboard Features
-- Run this in your Supabase SQL Editor

-- 1. Mood Entries Table
CREATE TABLE IF NOT EXISTS public.mood_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood entries" 
    ON public.mood_entries FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood entries" 
    ON public.mood_entries FOR INSERT 
    WITH CHECK (auth.uid() = user_id);


-- 2. Assessment Results Table
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assessment results" 
    ON public.assessment_results FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment results" 
    ON public.assessment_results FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
