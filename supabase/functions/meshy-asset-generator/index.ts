import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractTaskId(meshyData: Record<string, unknown>): string | null {
  return (meshyData.result as string) || (meshyData.id as string) || null;
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
    const action = body.action || "generate-model";

    switch (action) {
      case "generate-model":
        return await handleGenerateModel(body, meshyApiKey, supabase);
      case "seed-single":
        return await handleSeedSingle(body, meshyApiKey, supabase);
      case "check-status":
        return await handleCheckStatus(body, meshyApiKey);
      case "poll-and-update":
        return await handlePollAndUpdate(body, meshyApiKey, supabase);
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

async function callMeshyGenerate(meshyApiKey: string, prompt: string, artStyle: string) {
  const response = await fetch("https://api.meshy.ai/v2/text-to-3d", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${meshyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "preview",
      prompt,
      art_style: artStyle || "realistic",
      negative_prompt: "low quality, blurry, distorted, broken geometry, text, watermark",
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    let errMsg: string;
    try {
      const parsed = JSON.parse(errBody);
      errMsg = parsed.message || parsed.error || response.statusText;
    } catch {
      errMsg = errBody || response.statusText;
    }
    return { ok: false as const, error: errMsg, status: response.status };
  }

  const data = await response.json();
  const taskId = extractTaskId(data);

  if (!taskId) {
    return {
      ok: false as const,
      error: `No task ID in Meshy response. Keys: ${Object.keys(data).join(", ")}. Raw: ${JSON.stringify(data).slice(0, 200)}`,
      status: 500,
    };
  }

  return { ok: true as const, taskId, rawResponse: data };
}

async function handleGenerateModel(
  body: {
    prompt: string;
    art_style?: string;
    asset_category?: string;
    user_id?: string;
    name?: string;
    description?: string;
    tags?: string[];
  },
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

  const meshyResult = await callMeshyGenerate(meshyApiKey, enhancedPrompt, art_style || "realistic");

  if (!meshyResult.ok) {
    return jsonResponse({ error: `Meshy API error: ${meshyResult.error}` }, meshyResult.status);
  }

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
      meshy_request_id: meshyResult.taskId,
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

  scheduleTaskPolling(meshyApiKey, asset.id, meshyResult.taskId, supabase);

  return jsonResponse({
    success: true,
    asset_id: asset.id,
    meshy_request_id: meshyResult.taskId,
    asset_category: asset_category || "general",
  });
}

async function handleSeedSingle(
  body: {
    name: string;
    prompt: string;
    art_style?: string;
    category?: string;
    tags?: string[];
    description?: string;
  },
  meshyApiKey: string,
  supabase: ReturnType<typeof createClient>
) {
  const { name, prompt, art_style, category, tags, description } = body;

  if (!name || !prompt) {
    return jsonResponse({ error: "name and prompt are required" }, 400);
  }

  const { data: existing } = await supabase
    .from("asset_library")
    .select("id, status, meshy_request_id")
    .eq("name", name)
    .maybeSingle();

  if (existing && existing.meshy_request_id) {
    return jsonResponse({
      success: true,
      asset_id: existing.id,
      status: existing.status,
      skipped: true,
      reason: "already_exists",
    });
  }

  const enhancedPrompt = `${prompt}. Game-ready, optimized for real-time rendering.`;

  const meshyResult = await callMeshyGenerate(meshyApiKey, enhancedPrompt, art_style || "realistic");

  if (!meshyResult.ok) {
    if (existing) {
      await supabase
        .from("asset_library")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return jsonResponse({
      success: false,
      error: meshyResult.error,
      asset_id: existing?.id || null,
    }, 200);
  }

  let assetId: string;

  if (existing) {
    await supabase
      .from("asset_library")
      .update({
        meshy_request_id: meshyResult.taskId,
        status: "pending",
        updated_at: new Date().toISOString(),
        metadata: {
          art_style: art_style || "realistic",
          model_type: category || "general",
          enhanced_prompt: enhancedPrompt,
          seed_generated: true,
        },
      })
      .eq("id", existing.id);
    assetId = existing.id;
  } else {
    const { data: asset, error: insertError } = await supabase
      .from("asset_library")
      .insert([{
        asset_type: "model",
        content_type: "gltf",
        name,
        description: description || null,
        prompt,
        meshy_request_id: meshyResult.taskId,
        status: "pending",
        tags: tags || [category || "model", "generated"],
        metadata: {
          art_style: art_style || "realistic",
          model_type: category || "general",
          enhanced_prompt: enhancedPrompt,
          seed_generated: true,
        },
      }])
      .select()
      .single();

    if (insertError) {
      return jsonResponse({ success: false, error: insertError.message }, 200);
    }
    assetId = asset.id;
  }

  scheduleTaskPolling(meshyApiKey, assetId, meshyResult.taskId, supabase);

  return jsonResponse({
    success: true,
    asset_id: assetId,
    meshy_request_id: meshyResult.taskId,
  });
}

async function handlePollAndUpdate(
  body: { asset_id: string; meshy_request_id: string },
  meshyApiKey: string,
  supabase: ReturnType<typeof createClient>
) {
  const { asset_id, meshy_request_id } = body;

  if (!asset_id || !meshy_request_id) {
    return jsonResponse({ error: "asset_id and meshy_request_id required" }, 400);
  }

  const response = await fetch(`https://api.meshy.ai/v2/text-to-3d/${meshy_request_id}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${meshyApiKey}` },
  });

  if (!response.ok) {
    return jsonResponse({ status: "error", error: "Failed to check Meshy status" });
  }

  const taskStatus = await response.json();

  if (taskStatus.status === "SUCCEEDED") {
    const glbUrl = taskStatus.model_urls?.glb;
    await supabase
      .from("asset_library")
      .update({
        status: "completed",
        file_url: glbUrl,
        preview_url: taskStatus.thumbnail_url || glbUrl,
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
      .eq("id", asset_id);

    return jsonResponse({ status: "completed", file_url: glbUrl, preview_url: taskStatus.thumbnail_url });
  }

  if (taskStatus.status === "FAILED") {
    await supabase
      .from("asset_library")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", asset_id);

    return jsonResponse({ status: "failed", error: taskStatus.task_error?.message || "Generation failed" });
  }

  return jsonResponse({
    status: "processing",
    progress: taskStatus.progress || 0,
  });
}

async function handleCheckStatus(
  body: { meshyRequestId: string },
  meshyApiKey: string
) {
  const { meshyRequestId } = body;

  if (!meshyRequestId) {
    return jsonResponse({ error: "meshyRequestId is required" }, 400);
  }

  const response = await fetch(`https://api.meshy.ai/v2/text-to-3d/${meshyRequestId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${meshyApiKey}` },
  });

  if (!response.ok) {
    return jsonResponse({ error: "Failed to check task status" }, response.status);
  }

  const meshyStatus = await response.json();

  return jsonResponse({
    status: meshyStatus.status,
    progress: meshyStatus.progress,
    model_urls: meshyStatus.model_urls,
    thumbnail_url: meshyStatus.thumbnail_url,
    error: meshyStatus.task_error,
  });
}

async function handleListAssets(
  body: { asset_type?: string; tags?: string[]; limit?: number; include_pending?: boolean },
  supabase: ReturnType<typeof createClient>
) {
  let query = supabase
    .from("asset_library")
    .select("*")
    .order("usage_count", { ascending: false });

  if (!body.include_pending) {
    query = query.eq("status", "completed");
  }
  if (body.asset_type) {
    query = query.eq("asset_type", body.asset_type);
  }
  if (body.tags && body.tags.length > 0) {
    query = query.contains("tags", body.tags);
  }

  const { data, error } = await query.limit(body.limit || 50);

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
      const maxAttempts = 120;
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        try {
          const response = await fetch(`https://api.meshy.ai/v2/text-to-3d/${meshyRequestId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${meshyApiKey}` },
          });

          if (!response.ok) continue;

          const taskStatus = await response.json();

          if (taskStatus.status === "SUCCEEDED") {
            const glbUrl = taskStatus.model_urls?.glb;
            await supabase
              .from("asset_library")
              .update({
                status: "completed",
                file_url: glbUrl,
                preview_url: taskStatus.thumbnail_url || glbUrl,
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

            console.log(`Asset ${assetId} completed`);
            return;
          }

          if (taskStatus.status === "FAILED") {
            await supabase
              .from("asset_library")
              .update({ status: "failed", updated_at: new Date().toISOString() })
              .eq("id", assetId);
            console.log(`Asset ${assetId} failed`);
            return;
          }
        } catch (error) {
          console.error(`Poll error for ${assetId}: ${error}`);
        }
      }

      await supabase
        .from("asset_library")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", assetId);
      console.error(`Polling timeout for ${assetId}`);
    })()
  );
}
