import { useState, useCallback } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoUploadProps {
  onUploadComplete: (detectionId: string) => void;
}

export const VideoUpload = ({ onUploadComplete }: VideoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload video to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('theft-videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('theft-videos')
        .getPublicUrl(filePath);

      // Create detection record
      const { data: detection, error: dbError } = await supabase
        .from('theft_detections')
        .insert({
          original_video_url: publicUrl,
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger processing via edge function
      const { error: functionError } = await supabase.functions.invoke('analyze-theft', {
        body: { 
          detectionId: detection.id,
          videoUrl: publicUrl 
        }
      });

      if (functionError) throw functionError;

      toast({
        title: "Upload Successful",
        description: "Video is being analyzed for theft detection",
      });

      onUploadComplete(detection.id);

      // Set up real-time subscription for criminal matches
      const channel = supabase
        .channel(`detection-${detection.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matched_criminals',
            filter: `detection_id=eq.${detection.id}`
          },
          async (payload) => {
            // Fetch criminal details
            const { data: criminal } = await supabase
              .from('criminals')
              .select('*')
              .eq('id', payload.new.criminal_id)
              .single();

            if (criminal) {
              toast({
                title: "⚠️ Known Criminal Detected!",
                description: `${criminal.name} has been identified in the video`,
                variant: "destructive",
              });
            }
          }
        )
        .subscribe();

      // Clean up subscription after 2 minutes
      setTimeout(() => {
        channel.unsubscribe();
      }, 120000);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <Card 
      className={`p-8 transition-all duration-300 ${
        isDragging ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`rounded-full p-6 transition-colors ${
          isDragging ? 'bg-primary/10' : 'bg-secondary'
        }`}>
          <Upload className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Upload Video for Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop your video file here, or click to browse
          </p>
        </div>

        <Button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileUpload(file);
            };
            input.click();
          }}
          disabled={isUploading}
          variant="default"
        >
          {isUploading ? 'Uploading...' : 'Select Video'}
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Supported formats: MP4, AVI, MOV, WebM</span>
        </div>
      </div>
    </Card>
  );
};