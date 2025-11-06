import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export const CriminalList = () => {
  const { toast } = useToast();

  const { data: criminals, isLoading, refetch } = useQuery({
    queryKey: ['criminals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('criminals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, photoUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const filePath = `photos/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage
        .from('criminal-photos')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('criminals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Criminal profile deleted",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting criminal:', error);
      toast({
        title: "Error",
        description: "Failed to delete criminal profile",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!criminals || criminals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Criminals Registered</h3>
          <p className="text-sm text-muted-foreground">
            Add criminal profiles to enable face detection in video analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="grid gap-4">
        {criminals.map((criminal) => (
          <Card key={criminal.id} className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Photo */}
                <img
                  src={criminal.photo_url}
                  alt={criminal.name}
                  className="w-24 h-24 object-cover rounded-lg border-2 border-destructive/20"
                />

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{criminal.name}</h3>
                      {criminal.criminal_id && (
                        <Badge variant="outline" className="mt-1">
                          ID: {criminal.criminal_id}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(criminal.id, criminal.photo_url)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {criminal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {criminal.description}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Added: {new Date(criminal.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
