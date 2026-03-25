"use client";

import { useState } from "react";
import {
  type HistoryEntry,
  getHistory,
  deleteFromHistory,
  clearHistory,
} from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Clock, Eye, Download, AlertTriangle } from "lucide-react";

interface HistoryProps {
  onBack: () => void;
  onViewEntry: (entry: HistoryEntry) => void;
}

export default function History({ onBack, onViewEntry }: HistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>(getHistory());
  const [confirmClear, setConfirmClear] = useState(false);

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setEntries(getHistory());
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearHistory();
    setEntries([]);
    setConfirmClear(false);
  };

  const handleDownload = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `gardenvision-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#1C1C1C]">Historique</h2>
            <p className="text-sm text-gray-500">
              {entries.length} visualisation{entries.length !== 1 ? "s" : ""} générée{entries.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {entries.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className={`gap-1.5 text-xs ${
              confirmClear
                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {confirmClear ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                Confirmer la suppression
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Tout effacer
              </>
            )}
          </Button>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            Aucune visualisation pour le moment
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Vos générations apparaîtront ici automatiquement.
          </p>
          <Button
            onClick={onBack}
            className="bg-[#2E7D32] hover:bg-[#1B5E20]"
          >
            Créer une visualisation
          </Button>
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group"
          >
            {/* Images */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={entry.generatedUrl}
                alt="Résultat"
                className="w-full h-full object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  onClick={() => onViewEntry(entry)}
                  className="bg-white rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-gray-100 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Voir
                </button>
                <button
                  onClick={() => handleDownload(entry.generatedUrl)}
                  className="bg-white rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-gray-100 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <div className="flex flex-wrap gap-1">
                {entry.services.map((s) => (
                  <span
                    key={s}
                    className="bg-green-50 text-[#2E7D32] text-[10px] font-medium px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
                {entry.customRequest && (
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Personnalisé
                  </span>
                )}
              </div>
              {entry.customRequest && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {entry.customRequest}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  {formatDate(entry.createdAt)}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-300 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
