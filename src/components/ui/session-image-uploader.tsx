import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ImageIcon, Upload, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  sessionId: string;
  chapterId?: string | null;
  currentPrompt?: string;
  userId?: string;
  className?: string;
  maxFiles?: number;
  maxSizeMB?: number;
};

type PendingFile = {
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export function SessionImageUploader({
  sessionId,
  chapterId = null,
  currentPrompt,
  userId,
  className,
  maxFiles = 10,
  maxSizeMB = 8,
}: Props) {
  const [files, setFiles] = React.useState<PendingFile[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onPick = () => inputRef.current?.click();

  const onSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;

    const next = list
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, maxFiles - files.length)
      .map((file) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          return {
            file,
            previewUrl: "",
            progress: 0,
            status: "error" as const,
            error: `Max ${maxSizeMB}MB`,
          };
        }
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          status: "pending" as const,
        };
      });

    setFiles((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = "";
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
    const toUpload = files.map((f, idx) => uploadOne(f, idx));
    await Promise.all(toUpload);
  };

  const uploadOne = async (item: PendingFile, idx: number) => {
    if (item.status === "done") return;

    setFiles((prev) => {
      const copy = [...prev];
      copy[idx] = { ...item, status: "uploading", progress: 5 };
      return copy;
    });

    try {
      const ts = Date.now();
      const path = `${userId ?? "anon"}/${sessionId}/${ts}-${encodeURIComponent(item.file.name)}`;

      // 1) Upload to storage
      const { error: upErr } = await supabase.storage
        .from("session-media")
        .upload(path, item.file, { cacheControl: "3600", upsert: false });

      if (upErr) throw upErr;

      // Update progress
      setFiles((prev) => {
        const copy = [...prev];
        if (copy[idx]) copy[idx] = { ...copy[idx], progress: 50 };
        return copy;
      });

      // 2) Get public URL
      const { data } = supabase.storage.from("session-media").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      // 3) Write metadata
      const { error: insErr } = await supabase
        .from("session_media")
        .insert({
          user_id: userId ?? null,
          session_id: sessionId,
          chapter_id: chapterId ?? null,
          prompt: currentPrompt ?? null,
          file_name: item.file.name,
          mime_type: item.file.type,
          size_bytes: item.file.size,
          url: publicUrl,
        });

      if (insErr) throw insErr;

      // Mark as done
      setFiles((prev) => {
        const copy = [...prev];
        if (copy[idx]) copy[idx] = { ...copy[idx], status: "done", progress: 100 };
        return copy;
      });
    } catch (err: any) {
      setFiles((prev) => {
        const copy = [...prev];
        if (copy[idx]) {
          copy[idx] = { 
            ...copy[idx], 
            status: "error", 
            error: err?.message ?? "Upload failed" 
          };
        }
        return copy;
      });
    }
  };

  const hasPendingUploads = files.some(f => f.status === "pending");

  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Add Photos to This Chapter</h3>
          <Badge variant="secondary">Optional</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onPick} className="gap-2">
            <Upload className="h-4 w-4" />
            Select images
          </Button>
          {hasPendingUploads && (
            <Button onClick={uploadAll} className="gap-2">
              Upload {files.filter(f => f.status !== "done").length} image(s)
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onSelect}
      />

      {/* Grid */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((f, idx) => (
            <div key={idx} className="relative rounded-lg border bg-card overflow-hidden">
              {/* Preview */}
              <div className="aspect-square bg-muted">
                {f.previewUrl ? (
                  <img
                    src={f.previewUrl}
                    alt={f.file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full grid place-content-center text-xs text-muted-foreground">
                    {f.error ? f.error : "Preview"}
                  </div>
                )}
              </div>

              {/* Name + progress */}
              <div className="p-2 space-y-1">
                <div className="text-xs line-clamp-1">{f.file.name}</div>
                {f.status === "uploading" && (
                  <Progress value={f.progress} className="h-2" />
                )}
                {f.status === "done" && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <Check className="h-3.5 w-3.5" /> Uploaded
                  </div>
                )}
                {f.status === "error" && (
                  <div className="text-xs text-destructive">{f.error}</div>
                )}
              </div>

              {/* Remove button */}
              {f.status !== "uploading" && (
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/90 hover:bg-background border"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!files.length && (
        <div
          className="mt-4 w-full rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
          onClick={onPick}
        >
          Click to select or drag & drop family photos (JPG/PNG, up to {maxFiles} images)
        </div>
      )}
    </Card>
  );
}
