import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CriminalFormProps {
  onCriminalAdded?: () => void;
}

export const CriminalForm = ({ onCriminalAdded }: CriminalFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    criminalId: "",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photoFile) {
      toast({
        title: "Error",
        description: "Please upload a photo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload photo to storage
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('criminal-photos')
        .upload(`photos/${fileName}`, photoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('criminal-photos')
        .getPublicUrl(`photos/${fileName}`);

      // Insert criminal record
      const { error: insertError } = await supabase
        .from('criminals')
        .insert([
          {
            name: formData.name,
            criminal_id: formData.criminalId,
            description: formData.description,
            photo_url: publicUrl,
          },
        ]);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Criminal profile added successfully",
      });

      // Reset form
      setFormData({ name: "", criminalId: "", description: "" });
      setPhotoFile(null);
      setPhotoPreview("");
      onCriminalAdded?.();
    } catch (error) {
      console.error('Error adding criminal:', error);
      toast({
        title: "Error",
        description: "Failed to add criminal profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo">Photo *</Label>
            <div className="flex flex-col items-center gap-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-destructive/20"
                />
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                required
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter criminal's name"
              required
            />
          </div>

          {/* Criminal ID */}
          <div className="space-y-2">
            <Label htmlFor="criminalId">Criminal ID</Label>
            <Input
              id="criminalId"
              value={formData.criminalId}
              onChange={(e) => setFormData({ ...formData, criminalId: e.target.value })}
              placeholder="Enter ID number"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about the criminal"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Criminal Profile"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
