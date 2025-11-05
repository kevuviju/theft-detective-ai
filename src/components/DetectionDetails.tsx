import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Video, Clock } from "lucide-react";

interface Detection {
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

interface DetectionDetailsProps {
  detection: Detection;
}

export const DetectionDetails = ({ detection }: DetectionDetailsProps) => {
  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Video className="h-5 w-5" />
              {detection.processed_video_url ? 'Processed Video' : 'Original Video'}
            </h3>
            {detection.person_detected && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Theft Detected
              </Badge>
            )}
          </div>
          
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <video
              controls
              className="w-full h-full"
              src={detection.processed_video_url || detection.original_video_url}
            >
              Your browser does not support video playback.
            </video>
          </div>
          
          {detection.status === 'processing' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>Video is being processed with AI detection...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Detection Report */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detection Report
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Detection Time</p>
              <p className="text-sm font-medium">
                {new Date(detection.detection_timestamp).toLocaleString()}
              </p>
            </div>
            
            {detection.confidence_score && (
              <div>
                <p className="text-sm text-muted-foreground">Confidence Score</p>
                <p className="text-sm font-medium">{detection.confidence_score}%</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={detection.status === 'completed' ? 'default' : 'secondary'}>
                {detection.status}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Person Detected</p>
              <p className="text-sm font-medium">
                {detection.person_detected ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {detection.report_summary && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Summary</p>
              <p className="text-sm leading-relaxed">{detection.report_summary}</p>
            </div>
          )}

          {!detection.report_summary && detection.status === 'completed' && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">No theft activity detected in this video.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};