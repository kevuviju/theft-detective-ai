-- Create criminals table to store criminal profiles
CREATE TABLE public.criminals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  description TEXT,
  criminal_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.criminals ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can restrict these later)
CREATE POLICY "Allow public read access to criminals"
  ON public.criminals FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to criminals"
  ON public.criminals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to criminals"
  ON public.criminals FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to criminals"
  ON public.criminals FOR DELETE
  USING (true);

-- Create storage bucket for criminal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('criminal-photos', 'criminal-photos', true);

-- Create storage policies
CREATE POLICY "Allow public read access to criminal photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'criminal-photos');

CREATE POLICY "Allow public insert access to criminal photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'criminal-photos');

CREATE POLICY "Allow public delete access to criminal photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'criminal-photos');

-- Create matched_criminals table for detection matches
CREATE TABLE public.matched_criminals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  detection_id UUID NOT NULL REFERENCES public.theft_detections(id) ON DELETE CASCADE,
  criminal_id UUID NOT NULL REFERENCES public.criminals(id) ON DELETE CASCADE,
  confidence_score NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matched_criminals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to matched_criminals"
  ON public.matched_criminals FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to matched_criminals"
  ON public.matched_criminals FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_criminals_updated_at
  BEFORE UPDATE ON public.criminals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();