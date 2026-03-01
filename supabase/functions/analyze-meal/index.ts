import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const ANALYSIS_PROMPT = `You are a precise nutrition expert AI. Analyze the food in this image and respond with ONLY a raw JSON object — no markdown, no code blocks, no explanation text. Just the JSON.

Use this exact structure:
{
  "status": "confident" or "clarification_needed",
  "dish_name": "descriptive name of the dish",
  "calories": <integer: total estimated calories for the visible portion>,
  "protein_g": <number: grams of protein>,
  "carbs_g": <number: grams of carbohydrates>,
  "fat_g": <number: grams of fat>,
  "confidence": <number 0.0-1.0>,
  "portion_description": "e.g. 1 medium bowl, 2 slices, 1 cup",
  "clarification_question": null or "short question asking user to pick the right food",
  "clarification_options": null or [
    { "label": "Food Name", "emoji": "🍎", "calories": <int>, "protein_g": <num>, "carbs_g": <num>, "fat_g": <num> }
  ]
}

Rules:
- Set status to "clarification_needed" when confidence < 0.7 AND there are visually similar foods with meaningfully different calorie counts (e.g., papaya vs mango, zucchini vs cucumber, chicken vs tofu, brown rice vs white rice, sweet potato vs regular potato)
- If clarification_needed, provide exactly 2-3 options in clarification_options
- Estimate calories for the ENTIRE visible portion — never underestimate
- If multiple food items are on the plate, sum all calories and list the dish as the full meal
- Always return valid JSON with no trailing commas`;

/** Convert ArrayBuffer to base64 without stack overflow for large images */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageUrl, clarification } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY secret not set on this function" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Fetch the image from Supabase Storage (public URL)
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to fetch image: HTTP ${imageResponse.status}`,
      );
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = arrayBufferToBase64(imageBuffer);
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    // Build prompt — inject clarification if the user selected an option
    let prompt = ANALYSIS_PROMPT;
    if (clarification) {
      prompt +=
        `\n\nIMPORTANT: The user confirmed the food is "${clarification}". Provide accurate nutritional info specifically for this food. Set status to "confident" and confidence to 0.95.`;
    }

    // Call Gemini 2.0 Flash Lite (free tier: 30 RPM, 1500 RPD)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: contentType,
                  data: imageBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API error ${geminiResponse.status}: ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText: string =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown code fences if Gemini wraps the JSON
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(
        `No JSON found in Gemini response: ${rawText.substring(0, 300)}`,
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("analyze-meal error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
