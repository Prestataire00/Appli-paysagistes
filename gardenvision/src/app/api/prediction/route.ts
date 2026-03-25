import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// GET: Check prediction status by ID
export async function GET(request: NextRequest) {
  const predictionId = request.nextUrl.searchParams.get("id");

  if (!predictionId) {
    return NextResponse.json(
      { error: "Prediction ID requis." },
      { status: 400 }
    );
  }

  try {
    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status === "succeeded") {
      // Extract URL from output
      let url: string | null = null;
      const output = prediction.output;

      if (typeof output === "string") {
        url = output;
      } else if (Array.isArray(output) && output.length > 0) {
        url = String(output[0]);
      } else if (output && typeof output === "object") {
        url = String(output);
      }

      return NextResponse.json({ status: "succeeded", url });
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      return NextResponse.json({
        status: "failed",
        error: prediction.error || "La génération a échoué.",
      });
    }

    // Still processing
    return NextResponse.json({ status: prediction.status });
  } catch (error) {
    console.error("Prediction check error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification." },
      { status: 500 }
    );
  }
}
