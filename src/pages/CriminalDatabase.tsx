import { useState } from "react";
import { CriminalForm } from "@/components/CriminalForm";
import { CriminalList } from "@/components/CriminalList";
import { NavigationMenu } from "@/components/NavigationMenu";
import { Database, Users } from "lucide-react";

const CriminalDatabase = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCriminalAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Database className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Criminal Database</h1>
                <p className="text-sm text-muted-foreground">Manage known criminal profiles for detection</p>
              </div>
            </div>
            <NavigationMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Criminal */}
          <div className="lg:col-span-1">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-destructive" />
                <h2 className="text-lg font-semibold">Add Criminal Profile</h2>
              </div>
              <CriminalForm onCriminalAdded={handleCriminalAdded} />
            </section>
          </div>

          {/* Right Column - Criminal List */}
          <div className="lg:col-span-2">
            <section>
              <h2 className="text-lg font-semibold mb-4">Registered Criminals</h2>
              <CriminalList key={refreshKey} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CriminalDatabase;
