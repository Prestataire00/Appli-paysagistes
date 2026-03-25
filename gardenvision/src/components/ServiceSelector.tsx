"use client";

import { cn } from "@/lib/utils";
import { Scissors, TreePine, Flower2, Route, Axe, Shrub } from "lucide-react";
import { type LucideIcon } from "lucide-react";

export interface Service {
  code: string;
  label: string;
  description: string;
  icon: LucideIcon;
  prompt: string;
}

export const SERVICES: Service[] = [
  {
    code: "TONTE",
    label: "Tonte de pelouse",
    description: "Gazon tondu proprement, herbe courte et uniforme",
    icon: Shrub,
    prompt: "perfectly mowed lawn, neat short green grass, landscaped garden",
  },
  {
    code: "HAIE",
    label: "Taille de haies",
    description: "Haies taillées nettement, formes régulières",
    icon: Scissors,
    prompt: "trimmed hedges, clean-cut bushes, professional hedge trimming",
  },
  {
    code: "MASSIF",
    label: "Massifs fleuris",
    description: "Parterres de fleurs colorés, bordures plantées",
    icon: Flower2,
    prompt: "colorful flower beds, planted borders, blooming garden",
  },
  {
    code: "ALLEE",
    label: "Nettoyage d'allées",
    description: "Chemins propres, sans mousse ni mauvaises herbes",
    icon: Route,
    prompt: "clean garden path, pressure-washed walkway, tidy driveway",
  },
  {
    code: "ELAGAGE",
    label: "Élagage d'arbres",
    description: "Arbres élagués, branches taillées, canopée aérée",
    icon: TreePine,
    prompt: "pruned trees, shaped canopy, professional tree trimming",
  },
  {
    code: "DECO",
    label: "Aménagement végétal",
    description: "Plantes ornementales, pots, décorations vertes",
    icon: Axe,
    prompt: "ornamental plants, garden decoration, potted plants arrangement",
  },
];

interface ServiceSelectorProps {
  selected: string[];
  onToggle: (code: string) => void;
}

export default function ServiceSelector({
  selected,
  onToggle,
}: ServiceSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
      {SERVICES.map((service) => {
        const isSelected = selected.includes(service.code);
        const Icon = service.icon;
        return (
          <button
            key={service.code}
            onClick={() => onToggle(service.code)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all text-left",
              isSelected
                ? "border-[#2E7D32] bg-green-50 shadow-md shadow-green-100"
                : "border-gray-200 bg-white hover:border-[#81C784] hover:shadow-sm"
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-[#2E7D32] rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            <div
              className={cn(
                "w-11 h-11 rounded-lg flex items-center justify-center transition-colors",
                isSelected ? "bg-[#2E7D32] text-white" : "bg-green-50 text-[#2E7D32]"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="text-sm font-semibold block leading-tight text-[#1C1C1C]">
                {service.label}
              </span>
              <span className="text-[11px] text-gray-400 leading-tight mt-0.5 block">
                {service.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
