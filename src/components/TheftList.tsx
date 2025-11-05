import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TheftDetection {
  id: string;
  original_video_url: string;
  processed_video_url: string | null;
  thumbnail_url: string | null;
  detection_timestamp: string;
  status: string;
  report_summary: string | null;
  confidence_score: number | null;
  person_detected: boolean;
}

interface TheftListProps {
  onSelectDetection: (detection: TheftDetection) => void;
  selectedId: string | null;
}

export const TheftList = ({ onSelectDetection, selectedId }: TheftListProps) => {
  const [detections, setDetections] = useState<TheftDetection[]>([]);

  useEffect(() => {
    fetchDetections();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('theft-detections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'theft_detections'
        },
        () => {
          fetchDetections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDetections = async () => {
    const { data, error } = await supabase
      .from('theft_detections')
      .select('*')
      .order('detection_timestamp', { ascending: false });

    if (!error && data) {
      setDetections(data);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-primary animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive"
    };
    
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (detections.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Detections Yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload a video to start theft detection analysis
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {detections.map((detection) => (
        <Card
          key={detection.id}
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedId === detection.id ? 'border-primary shadow-primary/20' : ''
          }`}
          onClick={() => onSelectDetection(detection)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(detection.status)}
                <span className="text-xs text-muted-foreground">
                  {new Date(detection.detection_timestamp).toLocaleString()}
                </span>
              </div>
              
              {detection.person_detected && detection.status === 'completed' && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-alert" />
                  <span className="text-sm font-medium text-alert">Theft Detected</span>
                </div>
              )}
              
              {detection.confidence_score && (
                <div className="text-sm text-muted-foreground">
                  Confidence: {detection.confidence_score}%
                </div>
              )}
            </div>
            
            {getStatusBadge(detection.status)}
          </div>
        </Card>
      ))}
    </div>
  );
};