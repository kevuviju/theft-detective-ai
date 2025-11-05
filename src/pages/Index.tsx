import { useState } from "react";
import { VideoUpload } from "@/components/VideoUpload";
import { TheftList } from "@/components/TheftList";
import { DetectionDetails } from "@/components/DetectionDetails";

const Index = () => {
  const [selectedDetection, setSelectedDetection] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">GodsEye</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Video Analysis</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & List */}
          <div className="lg:col-span-1 space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-4">Upload Video</h2>
              <VideoUpload onUploadComplete={(id) => console.log('Uploaded:', id)} />
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">Detection History</h2>
              <TheftList 
                onSelectDetection={setSelectedDetection}
                selectedId={selectedDetection?.id || null}
              />
            </section>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            {selectedDetection ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Detection Details</h2>
                <DetectionDetails detection={selectedDetection} />
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
                    <div className="h-8 w-8 text-muted-foreground">👁️</div>
                  </div>
                  <h3 className="text-xl font-semibold">No Detection Selected</h3>
                  <p className="text-muted-foreground max-w-md">
                    Upload a video or select a detection from the history to view detailed analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;