"use client";

import { useState, useCallback } from "react";
import PhotoUpload from "@/components/PhotoUpload";
import ServiceSelector, { SERVICES } from "@/components/ServiceSelector";
import GenerationLoader from "@/components/GenerationLoader";
import ResultView from "@/components/ResultView";
import History from "@/components/History";
import { addToHistory, type HistoryEntry } from "@/lib/history";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Leaf,
  Camera,
  CheckCircle,
  ArrowRight,
  Wand2,
  Clock,
} from "lucide-react";

type Step = "landing" | "upload" | "services" | "loading" | "result" | "history";

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoSelected = useCallback(
    (file: File, previewUrl: string) => {
      setPhoto(file);
      setPreview(previewUrl);
      setStep("services");
    },
    []
  );

  const handleClearPhoto = useCallback(() => {
    setPhoto(null);
    setPreview(null);
    setStep("upload");
  }, []);

  const handleToggleService = useCallback((code: string) => {
    setSelectedServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }, []);

  const handleGenerate = async () => {
    if (!photo || (selectedServices.length === 0 && !customRequest.trim())) return;

    setStep("loading");
    setError(null);

    try {
      const base64 = await fileToBase64(photo);

      const prompts = selectedServices
        .map((code) => SERVICES.find((s) => s.code === code)?.prompt)
        .filter(Boolean)
        .join(", ");

      // Step 1: Start the prediction (returns immediately)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          prompts,
          customRequest: customRequest.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la génération.");
      }

      const { predictionId } = await res.json();

      // Step 2: Poll for result every 2 seconds
      const result = await pollPrediction(predictionId);
      setGeneratedUrl(result);

      // Save to history
      if (preview) {
        addToHistory({
          originalUrl: preview,
          generatedUrl: result,
          services: selectedServices.map(
            (code) => SERVICES.find((s) => s.code === code)?.label || code
          ),
          customRequest: customRequest.trim() || undefined,
        });
      }

      setStep("result");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue."
      );
      setStep("services");
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setPreview(null);
    setSelectedServices([]);
    setCustomRequest("");
    setGeneratedUrl(null);
    setError(null);
    setStep("upload");
  };

  const handleRetryWithSamePhoto = () => {
    setSelectedServices([]);
    setCustomRequest("");
    setGeneratedUrl(null);
    setError(null);
    setStep("services");
  };

  const handleViewHistoryEntry = (entry: HistoryEntry) => {
    setPreview(entry.originalUrl);
    setGeneratedUrl(entry.generatedUrl);
    setSelectedServices(
      entry.services
        .map((label) => SERVICES.find((s) => s.label === label)?.code)
        .filter(Boolean) as string[]
    );
    setCustomRequest(entry.customRequest || "");
    setStep("result");
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F9FBF7]">
      {/* Header */}
      <header className="border-b border-green-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setStep("landing")}
            className="flex items-center gap-2.5 hover:opacity-80 transition"
          >
            <div className="w-9 h-9 bg-[#2E7D32] rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1C1C1C] leading-tight">
                GardenVision
              </h1>
              <p className="text-[10px] text-gray-400 leading-tight">
                par IA Infinity
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {step !== "loading" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("history")}
                className="gap-1.5 text-xs text-gray-500"
              >
                <Clock className="w-4 h-4" />
                Historique
              </Button>
            )}
            {step !== "landing" && step !== "loading" && step !== "history" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs"
              >
                Nouvelle session
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        {/* ===== LANDING ===== */}
        {step === "landing" && (
          <div className="max-w-5xl mx-auto px-4">
            {/* Hero */}
            <section className="py-16 md:py-24 text-center">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
                <Wand2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span className="text-xs font-medium text-[#2E7D32]">
                  Propulsé par IA Infinity
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#1C1C1C] mb-4 leading-tight">
                Montrez à vos clients
                <br />
                <span className="text-[#2E7D32]">le résultat avant de commencer</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
                Prenez une photo du jardin, sélectionnez vos prestations,
                et obtenez une visualisation avant/après en quelques secondes.
              </p>
              <Button
                onClick={() => setStep("upload")}
                size="lg"
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-base px-8 py-6 rounded-xl shadow-lg shadow-green-200 gap-2"
              >
                <Camera className="w-5 h-5" />
                Commencer une visualisation
              </Button>
            </section>

            {/* How it works */}
            <section className="pb-16">
              <h3 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
                Comment ça marche
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    title: "Prenez une photo",
                    desc: "Photographiez l'espace extérieur de votre client depuis votre téléphone ou importez une photo.",
                    icon: Camera,
                  },
                  {
                    step: "2",
                    title: "Choisissez les prestations",
                    desc: "Sélectionnez les services que vous proposez : tonte, haies, massifs, allées...",
                    icon: CheckCircle,
                  },
                  {
                    step: "3",
                    title: "Montrez le résultat",
                    desc: "L'IA génère une visualisation réaliste du jardin après vos interventions.",
                    icon: Sparkles,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm"
                  >
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-[#2E7D32]" />
                    </div>
                    <div className="text-xs font-bold text-[#2E7D32] mb-2">
                      ÉTAPE {item.step}
                    </div>
                    <h4 className="font-bold text-[#1C1C1C] mb-2">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Value proposition */}
            <section className="pb-20">
              <div className="bg-[#2E7D32] rounded-2xl p-8 md:p-12 text-center text-white">
                <h3 className="text-2xl font-bold mb-3">
                  Accélérez vos ventes
                </h3>
                <p className="text-green-100 max-w-lg mx-auto mb-6">
                  Vos clients hésitent car ils ne visualisent pas le résultat ?
                  Montrez-leur en direct lors du rendez-vous commercial.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  {[
                    { value: "< 30s", label: "de génération" },
                    { value: "0", label: "formation requise" },
                    { value: "+40%", label: "de conversion" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-extrabold">{stat.value}</div>
                      <div className="text-xs text-green-200">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===== UPLOAD ===== */}
        {step === "upload" && (
          <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Stepper */}
            <Stepper current={0} />

            <section className="mt-8 space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2 text-[#1C1C1C]">
                  Prenez ou importez une photo
                </h2>
                <p className="text-gray-500">
                  Photographiez l&apos;espace extérieur du client à transformer
                </p>
              </div>
              <PhotoUpload
                onPhotoSelected={handlePhotoSelected}
                preview={preview}
                onClear={handleClearPhoto}
              />
              <div className="bg-[#FFF9C4] border border-yellow-200 rounded-xl p-4 mt-6 max-w-lg mx-auto">
                <p className="text-sm text-yellow-800">
                  <strong>Conseil :</strong> Prenez la photo en plein jour, de face,
                  en montrant bien l&apos;ensemble de l&apos;espace à traiter.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* ===== SERVICES ===== */}
        {step === "services" && (
          <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Stepper */}
            <Stepper current={1} />

            <section className="mt-8 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-[#1C1C1C]">
                  Quelles prestations proposez-vous ?
                </h2>
                <p className="text-gray-500">
                  Sélectionnez les services à visualiser sur cette photo
                </p>
              </div>

              {/* Photo preview with overlay */}
              {preview && (
                <div className="relative max-w-md mx-auto">
                  <img
                    src={preview}
                    alt="Photo du client"
                    className="w-full rounded-xl shadow-md object-cover max-h-[250px]"
                  />
                  <button
                    onClick={handleClearPhoto}
                    className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-xs font-medium px-3 py-1.5 rounded-lg shadow hover:bg-white transition flex items-center gap-1"
                  >
                    Changer la photo
                  </button>
                </div>
              )}

              <ServiceSelector
                selected={selectedServices}
                onToggle={handleToggleService}
              />

              {/* Custom request field */}
              <div className="max-w-xl mx-auto space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Wand2 className="w-4 h-4 text-[#2E7D32]" />
                  <label
                    htmlFor="custom-request"
                    className="text-sm font-semibold text-[#1C1C1C]"
                  >
                    Demande personnalisée
                    <span className="font-normal text-gray-400"> (optionnel)</span>
                  </label>
                </div>
                <textarea
                  id="custom-request"
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  placeholder="Ex : Ajouter une terrasse en bois sur la droite, installer un éclairage de jardin le long de l'allée, remplacer le gravier par du gazon..."
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-green-100 transition resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-400 px-1">
                  Décrivez en français ce que vous souhaitez — l&apos;IA s&apos;occupe du reste.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Selected summary */}
              {(selectedServices.length > 0 || customRequest.trim()) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-lg mx-auto space-y-1">
                  {selectedServices.length > 0 && (
                    <p className="text-sm text-[#2E7D32] font-medium">
                      {selectedServices.length} prestation{selectedServices.length > 1 ? "s" : ""} :{" "}
                      {selectedServices
                        .map(
                          (code) =>
                            SERVICES.find((s) => s.code === code)?.label
                        )
                        .join(", ")}
                    </p>
                  )}
                  {customRequest.trim() && (
                    <p className="text-sm text-[#2E7D32]">
                      + Demande personnalisée
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={selectedServices.length === 0 && !customRequest.trim()}
                  size="lg"
                  className="bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-40 disabled:cursor-not-allowed gap-2 px-8 py-6 rounded-xl text-base shadow-lg shadow-green-200 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Générer la visualisation
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </section>
          </div>
        )}

        {/* ===== LOADING ===== */}
        {step === "loading" && (
          <div className="max-w-2xl mx-auto px-4 py-10">
            <GenerationLoader preview={preview} />
          </div>
        )}

        {/* ===== HISTORY ===== */}
        {step === "history" && (
          <History
            onBack={() => setStep("landing")}
            onViewEntry={handleViewHistoryEntry}
          />
        )}

        {/* ===== RESULT ===== */}
        {step === "result" && preview && generatedUrl && (
          <div className="max-w-4xl mx-auto px-4 py-10">
            <section className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-4">
                  <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
                  <span className="text-sm font-medium text-[#2E7D32]">
                    Visualisation générée
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-[#1C1C1C]">
                  Voici le résultat pour votre client
                </h2>
                <p className="text-gray-500">
                  Glissez le curseur pour comparer l&apos;avant et l&apos;après
                </p>
              </div>
              <ResultView
                originalUrl={preview}
                generatedUrl={generatedUrl}
                onReset={handleReset}
                onRetry={handleRetryWithSamePhoto}
                selectedServices={selectedServices.map(
                  (code) =>
                    SERVICES.find((s) => s.code === code)?.label || code
                )}
              />
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      {step === "landing" && (
        <footer className="border-t border-green-100 py-6 text-center">
          <p className="text-xs text-gray-400">
            GardenVision v0.1 — Propulsé par IA Infinity
          </p>
        </footer>
      )}
    </main>
  );
}

/* ===== STEPPER ===== */
function Stepper({ current }: { current: number }) {
  const steps = [
    { label: "Photo", icon: Camera },
    { label: "Prestations", icon: CheckCircle },
    { label: "Résultat", icon: Sparkles },
  ];
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                i < current
                  ? "bg-[#2E7D32] text-white"
                  : i === current
                  ? "bg-[#2E7D32] text-white ring-4 ring-green-100"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < current ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <s.icon className="w-5 h-5" />
              )}
            </div>
            <span
              className={`text-[11px] font-medium ${
                i <= current ? "text-[#2E7D32]" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 h-0.5 mx-2 mb-5 rounded ${
                i < current ? "bg-[#2E7D32]" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

async function pollPrediction(predictionId: string): Promise<string> {
  const maxAttempts = 60; // 2 minutes max
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const res = await fetch(`/api/prediction?id=${predictionId}`);
    const data = await res.json();

    if (data.status === "succeeded" && data.url) {
      return data.url;
    }
    if (data.status === "failed") {
      throw new Error(data.error || "La génération a échoué.");
    }
    // "starting" or "processing" → continue polling
  }
  throw new Error("La génération a pris trop de temps.");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
