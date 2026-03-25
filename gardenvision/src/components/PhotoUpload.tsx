"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  onPhotoSelected: (file: File, preview: string) => void;
  preview: string | null;
  onClear: () => void;
}

export default function PhotoUpload({
  onPhotoSelected,
  preview,
  onClear,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (max 10 Mo).");
        return;
      }
      const url = URL.createObjectURL(file);
      onPhotoSelected(file, url);
    },
    [onPhotoSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (preview) {
    return (
      <div className="relative w-full max-w-lg mx-auto">
        <img
          src={preview}
          alt="Photo uploadée"
          className="w-full rounded-xl shadow-md object-cover max-h-[400px]"
        />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 bg-white/80 backdrop-blur rounded-full p-1.5 hover:bg-white transition"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-[#2E7D32] bg-green-50"
            : "border-gray-300 hover:border-[#81C784] hover:bg-green-50/50"
        }`}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-[#2E7D32]" />
        <p className="text-lg font-medium mb-1">
          Glissez une photo ici ou cliquez pour parcourir
        </p>
        <p className="text-sm text-gray-500">
          JPG, PNG ou WEBP — max 10 Mo
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div className="mt-4 flex justify-center">
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          <Camera className="w-4 h-4" />
          Prendre une photo
        </Button>
      </div>
    </div>
  );
}
