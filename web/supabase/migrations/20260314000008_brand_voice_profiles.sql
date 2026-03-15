-- Brand voice profile per user
CREATE TABLE public.brand_voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tone TEXT,
  writing_rules TEXT,
  example_content TEXT,
  avoid_phrases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand voice profile"
  ON public.brand_voice_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand voice profile"
  ON public.brand_voice_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand voice profile"
  ON public.brand_voice_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER brand_voice_profiles_updated_at
  BEFORE UPDATE ON public.brand_voice_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
