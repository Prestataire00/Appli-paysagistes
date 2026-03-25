import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Simple in-memory rate limiting: max 5 requests per minute per IP
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimit.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  rateLimit.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  return false;
}

// POST: Start a prediction (async — returns prediction ID immediately)
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter une minute." },
      { status: 429 }
    );
  }

  try {
    const { image, prompts, customRequest } = await request.json();

    if (!image || (!prompts && !customRequest)) {
      return NextResponse.json(
        { error: "Image et prestations requises." },
        { status: 400 }
      );
    }

    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Format d'image invalide." },
        { status: 400 }
      );
    }

    const changes: string[] = [];
    if (prompts) changes.push(prompts);
    if (customRequest) changes.push(customRequest);

    const instruction = `Transform this outdoor space photo into a beautifully renovated garden. Make these visible changes: ${changes.join(". ")}. Show the transformation clearly — the changes should be obvious and dramatic while keeping the same camera angle. Photorealistic, professional landscaping result, high quality.`;

    // Create prediction async (does NOT wait for result)
    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-kontext-pro",
      input: {
        prompt: instruction,
        input_image: image,
        guidance_scale: 7,
        output_format: "png",
        safety_tolerance: 5,
      },
    });

    // Return prediction ID immediately (no timeout risk)
    return NextResponse.json({ predictionId: prediction.id });
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la génération: ${message}` },
      { status: 500 }
    );
  }
}
