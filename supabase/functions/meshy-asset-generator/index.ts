import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  action: string;
  prompt: string;
  art_style?: string;
  asset_category?: string;
  user_id?: string;
  name?: string;
  description?: string;
  tags?: string[];
}

interface CheckStatusRequest {
  action: string;
  meshyRequestId: string;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const meshyApiKey = Deno.env.get("MESHY_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !meshyApiKey) {
      return jsonResponse({ error: "Missing environment variables" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const action = body.action || detectAction(req.url);

    switch (action) {
      case "generate-model":
        return await handleGenerateModel(body as GenerateRequest, meshyApiKey, supabase);
      case "check-status":
        return await handleCheckStatus(body as CheckStatusRequest, meshyApiKey);
      case "list-assets":
        return await handleListAssets(body, supabase);
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("Function error:", error);
    return jsonResponse({ error: "Internal server error", details: String(error) }, 500);
  }
});

function detectAction(url: string): string {
  if (url.includes("generate-model")) return "generate-model";
  if (url.includes("check-status")) return "check-status";
  if (url.includes("list-assets")) return "list-assets";
  return "generate-model";
}

async function handleGenerateModel(
  body: GenerateRequest,
  meshyApiKey: string,
  supabase: ReturnType<typeof createClient>
) {
  const { prompt, art_style, asset_category, user_id, name, description, tags } = body;

  if (!prompt) {
    return jsonResponse({ error: "Prompt is required" }, 400);
  }

  const isCharacter = asset_category === "character";
  const promptPrefix = isCharacter
    ? "A detailed 3D character model."
    : "A detailed 3D game asset.";
  const enhancedPrompt = `${promptPrefix} ${prompt}. Game-ready, optimized for real-time rendering.`;

  const meshyResponse = await fetch("https://api.meshy.ai/v2/text-to-3d", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${meshyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "preview",
      prompt: enhancedPrompt,
      art_style: art_style || "realistic",
      negative_prompt: "low quality, blurry, distorted, broken geometry",
    }),
  });

  if (!meshyResponse.ok) {
    const error = await meshyResponse.json();
    return jsonResponse(
      { error: `Meshy API error: ${error.message || meshyResponse.statusText}` },
      meshyResponse.status
    );
  }

  const meshyData = await meshyResponse.json();

  const assetName = name || `Generated ${asset_category || "asset"} - ${new Date().toISOString().slice(0, 10)}`;
  const assetTags = tags || [asset_category || "model", "generated"];

  const { data: asset, error: assetError } = await supabase
    .from("asset_library")
    .insert([{
      asset_type: "model",
      content_type: "gltf",
      name: assetName,
      description: description || null,
      prompt,
      meshy_request_id: meshyData.id,
      generated_by_user_id: user_id || null,
      status: "pending",
      tags: assetTags,
      metadata: {
        art_style,
        model_type: asset_category || "general",
        enhanced_prompt: enhancedPrompt,
      },
    }])
    .select()
    .single();

  if (assetError) {
    return jsonResponse({ error: `Database error: ${assetError.message}` }, 500);
  }

  if (user_id) {
    await supabase.from("asset_generations").insert([{
      user_id,
      asset_id: asset.id,
      prompt,
      meshy_request_id: meshyData.id,
      status: "pending",
    }]);
  }

  scheduleTaskPolling(meshyApiKey, asset.id, meshyData.id, supabase);

  return jsonResponse({
    success: true,
    asset_id: asset.id,
    meshy_request_id: meshyData.id,
    asset_category: asset_category || "general",
    message: "Asset generation started. Polling for completion in background.",
  });
}

async function handleCheckStatus(body: CheckStatusRequest, meshyApiKey: string) {
  const { meshyRequestId } = body;

  if (!meshyRequestId) {
    return jsonResponse({ error: "meshyRequestId is required" }, 400);
  }

  const meshyResponse = await fetch(`https://api.meshy.ai/v2/text-to-3d/${meshyRequestId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${meshyApiKey}` },
  });

  if (!meshyResponse.ok) {
    return jsonResponse({ error: "Failed to check task status" }, meshyResponse.status);
  }

  const meshyStatus = await meshyResponse.json();

  return jsonResponse({
    status: meshyStatus.status,
    model_urls: meshyStatus.model_urls,
    thumbnail_url: meshyStatus.thumbnail_url,
    error: meshyStatus.error,
  });
}

async function handleListAssets(
  body: { asset_type?: string; tags?: string[]; limit?: number },
  supabase: ReturnType<typeof createClient>
) {
  let query = supabase
    .from("asset_library")
    .select("*")
    .eq("status", "completed")
    .order("usage_count", { ascending: false });

  if (body.asset_type) {
    query = query.eq("asset_type", body.asset_type);
  }
  if (body.tags && body.tags.length > 0) {
    query = query.contains("tags", body.tags);
  }

  const { data, error } = await query.limit(body.limit || 20);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ assets: data || [] });
}

function scheduleTaskPolling(
  meshyApiKey: string,
  assetId: string,
  meshyRequestId: string,
  supabase: ReturnType<typeof createClient>
) {
  EdgeRuntime.waitUntil(
    (async () => {
      const maxAttempts = 600;
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`https://api.meshy.ai/v2/text-to-3d/${meshyRequestId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${meshyApiKey}` },
          });

          if (!response.ok) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }

          const taskStatus = await response.json();

          if (taskStatus.status === "SUCCEEDED") {
            const glbUrl = taskStatus.model_urls?.glb;
            await supabase
              .from("asset_library")
              .update({
                status: "completed",
                file_url: glbUrl,
                preview_url: taskStatus.thumbnail_url || taskStatus.model_urls?.fbx || glbUrl,
                updated_at: new Date().toISOString(),
                metadata: {
                  model_type: "generated",
                  formats: {
                    glb: taskStatus.model_urls?.glb,
                    fbx: taskStatus.model_urls?.fbx,
                    usdz: taskStatus.model_urls?.usdz,
                  },
                  thumbnail_url: taskStatus.thumbnail_url,
                },
              })
              .eq("id", assetId);

            await supabase
              .from("asset_generations")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
              })
              .eq("meshy_request_id", meshyRequestId);

            console.log(`Asset ${assetId} generation completed`);
            return;
          }

          if (taskStatus.status === "FAILED") {
            await supabase
              .from("asset_library")
              .update({
                status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", assetId);

            await supabase
              .from("asset_generations")
              .update({
                status: "failed",
                error_message: taskStatus.error || "Generation failed",
                completed_at: new Date().toISOString(),
              })
              .eq("meshy_request_id", meshyRequestId);

            console.log(`Asset ${assetId} generation failed`);
            return;
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`Error polling task: ${error}`);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.error(`Task polling timeout for asset ${assetId}`);
    })()
  );
}
