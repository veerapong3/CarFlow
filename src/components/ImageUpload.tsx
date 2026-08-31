"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

interface ImageUploadProps {
  password: string;
  value?: string;
  imageUrl?: string;
  onChange: (fileId: string, imageUrl: string) => void;
  onClear: () => void;
}

export default function ImageUpload({
  password,
  value,
  imageUrl,
  onChange,
  onClear,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(imageUrl || "");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");

      URL.revokeObjectURL(localPreview);
      setPreviewUrl(data.imageUrl);
      onChange(data.fileId, data.imageUrl);
    } catch (err) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(imageUrl || "");
      setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClear() {
    setPreviewUrl("");
    setError("");
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayUrl = previewUrl || (value ? `https://lh3.googleusercontent.com/d/${value}` : "");

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {displayUrl ? (
        <div className="flex items-start gap-4">
          <div className="relative h-32 w-48 shrink-0">
            <ImageLightbox
              src={displayUrl}
              alt="รูปรถ"
              className="h-32 w-48"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  เปลี่ยนรูป
                </>
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
              onClick={handleClear}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
              ลบรูป
            </button>
            {value && (
              <p className="text-xs text-slate-400 break-all">ID: {value}</p>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 transition hover:border-primary-400 hover:bg-primary-50/50 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <span className="text-sm text-slate-600">กำลังอัปโหลดไป Google Drive...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                คลิกเพื่ออัปโหลดรูปรถ
              </span>
              <span className="text-xs text-slate-500">
                JPG, PNG, WebP, GIF — สูงสุด 5 MB
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
