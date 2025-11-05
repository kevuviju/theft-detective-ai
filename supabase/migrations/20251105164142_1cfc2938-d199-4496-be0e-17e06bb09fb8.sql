-- Create theft_detections table
CREATE TABLE public.theft_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_video_url TEXT NOT NULL,
  processed_video_url TEXT,
  thumbnail_url TEXT,
  detection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
  report_summary TEXT,
  confidence_score DECIMAL(5,2),
  person_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.theft_detections ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is required for this app)
CREATE POLICY "Allow public read access to theft_detections" 
ON public.theft_detections 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to theft_detections" 
ON public.theft_detections 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to theft_detections" 
ON public.theft_detections 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_theft_detections_updated_at
BEFORE UPDATE ON public.theft_detections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('theft-videos', 'theft-videos', true);

-- Create storage policies
CREATE POLICY "Allow public read access to theft videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'theft-videos');

CREATE POLICY "Allow public upload to theft videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'theft-videos');

-- Enable realtime for theft_detections
ALTER TABLE public.theft_detections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.theft_detections;