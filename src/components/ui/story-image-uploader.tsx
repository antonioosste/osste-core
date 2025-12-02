import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ImageIcon, Upload, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BACKEND_URL } from "@/config/backend";

/**
 * StoryImageUploader Props
 * 
 * IMPORTANT: Per new backend schema, images MUST be linked to at least one of:
 * - chapter_id
 * - turn_id
 * - story_id
 * 
 * session_id is only used for file path organization, not stored in DB.
 */
type Props = {
  sessionId?: string;   // For file path organization only (not stored in DB)
  storyId?: string;     // Link to story
  chapterId?: string;   // Link to chapter
  turnId?: string;      // Link to turn
  usage?: string;
  className?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  onUploadSuccess?: (images: UploadedImage[]) => void;
};

export interface UploadedImage {
  id: string;
  file_name: string;
  url: string;
  width?: number;
  height?: number;
  usage: string;
}

type PendingFile = {
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  uploadedImage?: UploadedImage;
  error?: string;
};

export function StoryImageUploader({
  sessionId,
  storyId,
  chapterId,
  turnId,
  usage = "embedded",
  className,
  maxFiles = 10,
  maxSizeMB = 8,
  onUploadSuccess,
}: Props) {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Validate that at least one context ID is provided
  const hasRequiredContext = !!(chapterId || turnId || storyId);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/gif"];
    
    if (!validTypes.includes(file.type)) {
      return "Invalid file type. Only JPEG, PNG, WEBP, HEIC, and GIF are allowed.";
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }
    
    return null;
  };

  const onPick = () => fileInputRef.current?.click();

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList)
      .slice(0, maxFiles - files.length)
      .map((file) => {
        const error = validateFile(file);
        return {
          file,
          previewUrl: error ? "" : URL.createObjectURL(file),
          progress: 0,
          status: error ? ("error" as const) : ("pending" as const),
          error,
        };
      });

    setFiles((prev) => [...prev, ...newFiles]);
    
    if (newFiles.some(f => f.error)) {
      toast({
        title: "Some files were rejected",
        description: "Check file types and sizes",
        variant: "destructive",
      });
    }
  };

  const onSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const copy = [...prev];
      const f = copy[idx];
      if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const uploadAll = async () => {
    if (!hasRequiredContext) {
      toast({
        title: "Missing context",
        description: "Images must be linked to a chapter, turn, or story",
        variant: "destructive",
      });
      return;
    }

    const toUpload = files
      .map((f, idx) => ({ file: f, index: idx }))
      .filter((item) => item.file.status === "pending");
    
    if (toUpload.length === 0) return;

    const uploadedImages: UploadedImage[] = [];

    for (const item of toUpload) {
      const result = await uploadOne(item.file, item.index);
      if (result) {
        uploadedImages.push(result);
      }
    }
    
    if (uploadedImages.length > 0) {
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${uploadedImages.length} image(s)`,
      });
      
      if (onUploadSuccess) {
        onUploadSuccess(uploadedImages);
      }
    }
  };

  const uploadOne = async (item: PendingFile, idx: number): Promise<UploadedImage | null> => {
    if (item.status !== "pending") return null;

    // Verify context before upload
    if (!hasRequiredContext) {
      setFiles((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          status: "error",
          error: "Missing chapter_id, turn_id, or story_id",
        };
        return copy;
      });
      return null;
    }

    setFiles((prev) => {
      const copy = [...prev];
      copy[idx] = { ...item, status: "uploading", progress: 10 };
      return copy;
    });

    try {
      // Get Supabase JWT token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      // Build FormData - Must include chapter_id, turn_id, or story_id
      const formData = new FormData();
      formData.append("file", item.file);
      
      // Optional: session_id for file path organization only
      if (sessionId) formData.append("session_id", sessionId);
      
      // REQUIRED: At least one of these must be provided
      if (storyId) formData.append("story_id", storyId);
      if (chapterId) formData.append("chapter_id", chapterId);
      if (turnId) formData.append("turn_id", turnId);
      
      formData.append("usage", usage);

      setFiles((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], progress: 30 };
        return copy;
      });

      // Upload to backend API
      const response = await fetch(`${BACKEND_URL}/api/story/upload-image`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      setFiles((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], progress: 70 };
        return copy;
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.image) {
        throw new Error("Invalid response from server");
      }

      const uploadedImage: UploadedImage = result.image;

      setFiles((prev) => {
        const copy = [...prev];
        copy[idx] = { 
          ...copy[idx], 
          status: "done", 
          progress: 100,
          uploadedImage 
        };
        return copy;
      });

      return uploadedImage;
    } catch (err: any) {
      console.error("Upload error:", err);
      
      setFiles((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          status: "error",
          error: err?.message ?? "Upload failed",
        };
        return copy;
      });

      toast({
        title: "Upload failed",
        description: err?.message ?? "Failed to upload image",
        variant: "destructive",
      });

      return null;
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const isUploading = uploadingCount > 0;

  return (
    <Card className={cn("bg-card backdrop-blur", className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Upload Images</h3>
            <Badge variant="secondary" className="text-xs">
              {files.length}/{maxFiles}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onPick} 
              className="gap-2" 
              size="sm"
              disabled={isUploading || files.length >= maxFiles || !hasRequiredContext}
            >
              <Upload className="h-4 w-4" />
              Select Images
            </Button>
            {pendingCount > 0 && (
              <Button 
                onClick={uploadAll} 
                size="sm"
                disabled={isUploading || !hasRequiredContext}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${pendingCount}`
                )}
              </Button>
            )}
          </div>
        </div>

        {!hasRequiredContext && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            Images must be linked to a chapter, turn, or story.
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/gif"
          multiple
          className="hidden"
          onChange={onSelect}
        />

        {files.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="relative rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-md"
              >
                <div className="aspect-square bg-muted">
                  {f.previewUrl ? (
                    <img
                      src={f.previewUrl}
                      alt={f.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-content-center text-xs text-muted-foreground px-2 text-center">
                      {f.error || "No preview"}
                    </div>
                  )}
                </div>

                <div className="p-2 space-y-1">
                  <div className="text-xs line-clamp-1 text-foreground">
                    {f.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(f.file.size / 1024).toFixed(0)} KB
                  </div>
                  
                  {f.status === "uploading" && (
                    <Progress value={f.progress} className="h-2" />
                  )}
                  
                  {f.status === "done" && (
                    <div className="flex items-center gap-1 text-success text-xs">
                      <Check className="h-3.5 w-3.5" /> Uploaded
                    </div>
                  )}
                  
                  {f.status === "error" && (
                    <div className="text-xs text-destructive line-clamp-2">
                      {f.error}
                    </div>
                  )}
                </div>

                {f.status !== "uploading" && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/90 hover:bg-background border border-border transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "w-full rounded-lg border-2 border-dashed p-8 text-center text-sm transition-colors cursor-pointer",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50",
              !hasRequiredContext && "opacity-50 cursor-not-allowed"
            )}
            onClick={hasRequiredContext ? onPick : undefined}
            onDrop={hasRequiredContext ? onDrop : undefined}
            onDragOver={hasRequiredContext ? onDragOver : undefined}
            onDragLeave={onDragLeave}
          >
            <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-1">
              Click to select or drag and drop images
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WEBP, HEIC, GIF • Max {maxFiles} files • {maxSizeMB}MB each
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
