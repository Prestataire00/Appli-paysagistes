"use client";

import { useRef, useState, useCallback } from "react";
import { Download, RefreshCw, Share2, Repeat, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultViewProps {
  originalUrl: string;
  generatedUrl: string;
  onReset: () => void;
  onRetry: () => void;
  selectedServices: string[];
}

export default function ResultView({
  originalUrl,
  generatedUrl,
  onReset,
  onRetry,
  selectedServices,
}: ResultViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const dragging = useRef(false);
  const [downloaded, setDownloaded] = useState(false);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    updateSlider(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updateSlider(e.clientX);
  };
  const handlePointerUp = () => {
    dragging.current = false;
  };

  const handleDownload = async () => {
    try {
      // Load both images
      const [beforeImg, afterImg] = await Promise.all([
        loadImage(originalUrl),
        loadImage(generatedUrl),
      ]);

      // Create composite canvas (before | after side by side)
      const labelHeight = 48;
      const gap = 4;
      const w = beforeImg.naturalWidth + afterImg.naturalWidth + gap;
      const h = Math.max(beforeImg.naturalHeight, afterImg.naturalHeight) + labelHeight;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = "#F9FBF7";
      ctx.fillRect(0, 0, w, h);

      // Draw "AVANT" label bar
      ctx.fillStyle = "#1C1C1C";
      ctx.fillRect(0, 0, beforeImg.naturalWidth, labelHeight);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(labelHeight * 0.45)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AVANT", beforeImg.naturalWidth / 2, labelHeight / 2);

      // Draw "APRÈS" label bar
      ctx.fillStyle = "#2E7D32";
      ctx.fillRect(beforeImg.naturalWidth + gap, 0, afterImg.naturalWidth, labelHeight);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        "APRÈS",
        beforeImg.naturalWidth + gap + afterImg.naturalWidth / 2,
        labelHeight / 2
      );

      // Draw images
      ctx.drawImage(beforeImg, 0, labelHeight);
      ctx.drawImage(afterImg, beforeImg.naturalWidth + gap, labelHeight);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gardenvision-avant-apres-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch {
      // Fallback: download generated image only
      const res = await fetch(generatedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gardenvision-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const res = await fetch(generatedUrl);
        const blob = await res.blob();
        const file = new File([blob], "gardenvision.png", {
          type: "image/png",
        });
        await navigator.share({
          title: "GardenVision — Visualisation paysagère",
          text: "Voici la visualisation avant/après de votre espace extérieur.",
          files: [file],
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Lien copié !");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Split view */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden shadow-xl cursor-col-resize select-none touch-none bg-gray-100"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* After (full background) */}
        <img
          src={generatedUrl}
          alt="Après"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Before (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={originalUrl}
            alt="Avant"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              width: containerRef.current
                ? `${containerRef.current.offsetWidth}px`
                : "100%",
            }}
            draggable={false}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white/80 z-10"
          style={{ left: `${sliderPos}%`, transform: "translateX(-1px)" }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center gap-0.5">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg">
          AVANT
        </div>
        <div className="absolute top-4 right-4 bg-[#2E7D32] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
          APRÈS
        </div>
      </div>

      {/* Services applied */}
      {selectedServices.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {selectedServices.map((label) => (
            <span
              key={label}
              className="bg-green-50 text-[#2E7D32] text-xs font-medium px-3 py-1 rounded-full border border-green-200"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={handleDownload}
          size="lg"
          className="gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] rounded-xl px-6"
        >
          <Download className="w-4 h-4" />
          {downloaded ? "Téléchargé !" : "Télécharger l'image"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleShare}
          className="gap-2 rounded-xl px-6"
        >
          <Share2 className="w-4 h-4" />
          Envoyer au client
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={onRetry}
          className="gap-2 text-gray-500 hover:text-[#2E7D32]"
        >
          <Repeat className="w-4 h-4" />
          Autres prestations (même photo)
        </Button>
        <Button
          variant="ghost"
          onClick={onReset}
          className="gap-2 text-gray-500 hover:text-[#2E7D32]"
        >
          <RefreshCw className="w-4 h-4" />
          Nouvelle photo
        </Button>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
