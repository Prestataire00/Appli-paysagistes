"use client";

import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";

const MESSAGES = [
  "Analyse de votre espace extérieur...",
  "Détection des zones à améliorer...",
  "Application des prestations sélectionnées...",
  "Création du rendu paysager...",
  "Finalisation de la visualisation...",
];

interface GenerationLoaderProps {
  preview?: string | null;
}

export default function GenerationLoader({ preview }: GenerationLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    const timeInterval = setInterval(() => {
      setElapsed((t) => t + 1);
    }, 1000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Photo avec overlay */}
      {preview && (
        <div className="relative w-full max-w-sm mx-auto">
          <img
            src={preview}
            alt="Photo en cours de traitement"
            className="w-full rounded-xl object-cover max-h-[220px] brightness-75"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-white/30" />
              <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!preview && (
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-green-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#2E7D32] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="w-7 h-7 text-[#2E7D32]" />
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-[#2E7D32] animate-pulse min-h-[28px]">
          {MESSAGES[msgIndex]}
        </p>
        <p className="text-sm text-gray-400">
          {elapsed}s — Cela prend généralement 15 à 30 secondes
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-[#2E7D32] rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${Math.min((elapsed / 30) * 100, 95)}%` }}
        />
      </div>
    </div>
  );
}
