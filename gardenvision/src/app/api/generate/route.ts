import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 60;

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

export async function POST(request: NextRequest) {
  // Rate limiting
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

    // Validate base64 image
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Format d'image invalide." },
        { status: 400 }
      );
    }

    // Build instruction — combine selected services + custom request
    const changes: string[] = [];
    if (prompts) changes.push(prompts);
    if (customRequest) changes.push(customRequest);

    const instruction = `Transform this outdoor space photo into a beautifully renovated garden. Make these visible changes: ${changes.join(". ")}. Show the transformation clearly — the changes should be obvious and dramatic while keeping the same camera angle. Photorealistic, professional landscaping result, high quality.`;

    console.log("Starting generation with instruction:", instruction);

    const output = await replicate.run(
      "black-forest-labs/flux-kontext-pro",
      {
        input: {
          prompt: instruction,
          input_image: image,
          guidance_scale: 7,
          output_format: "png",
          safety_tolerance: 5,
        },
      }
    );

    console.log("Replicate output:", JSON.stringify(output, null, 2));

    // Replicate SDK v1+ returns FileOutput objects
    // Extract the URL string from the output
    let resultUrl: string | null = null;

    if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      // FileOutput has a .url() method or can be converted to string
      if (typeof first === "string") {
        resultUrl = first;
      } else if (first && typeof first === "object") {
        // FileOutput object — convert to string to get URL
        resultUrl = String(first);
      }
    } else if (typeof output === "string") {
      resultUrl = output;
    } else if (output && typeof output === "object") {
      resultUrl = String(output);
    }

    if (!resultUrl) {
      throw new Error("Aucune image générée par le modèle.");
    }

    console.log("Result URL:", resultUrl);

    return NextResponse.json({ url: resultUrl });
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
