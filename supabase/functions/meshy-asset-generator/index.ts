import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MESHY_V1_BASE = "https://api.meshy.ai/openapi/v1";
const MESHY_V2_BASE = "https://api.meshy.ai/v2";

const GAME_ANIMATIONS: Record<string, number> = {
  idle: 0,
  walk: 1,
  run: 13,
  attack: 4,
  death: 8,
};

const RIGGABLE_CATEGORIES = ["character", "enemy", "npc"];

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractTaskId(meshyData: Record<string, unknown>): string | null {
  return (meshyData.result as string) || (meshyData.id as string) || null;
}

function meshyHeaders(apiKey: string) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
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
      case "rig-model":
        return await handleRigModel(body, meshyApiKey, supabase);
      case "check-rig-status":
        return await handleCheckRigStatus(body, meshyApiKey, supabase);
      case "check-animation-progress":
        return await handleCheckAnimationProgress(body, supabase);
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("Function error:", error);
    return jsonResponse({ error: "Internal server error", details: String(error) }, 500);
  }
});

async function callMeshyGenerate(meshyApiKey: string, prompt: string, _artStyle: string) {
  const response = await fetch(`${MESHY_V2_BASE}/text-to-3d`, {
    method: "POST",
    headers: meshyHeaders(meshyApiKey),
    body: JSON.stringify({
      mode: "preview",
      prompt,
      art_style: "realistic",
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

  const shouldRig = RIGGABLE_CATEGORIES.includes(asset_category || "");
  const promptPrefix = shouldRig
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

  scheduleModelPolling(meshyApiKey, asset.id, meshyResult.taskId, shouldRig, supabase);

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

  const shouldRig = RIGGABLE_CATEGORIES.includes(category || "") ||
    (tags || []).some((t: string) => RIGGABLE_CATEGORIES.includes(t));

  scheduleModelPolling(meshyApiKey, assetId, meshyResult.taskId, shouldRig, supabase);

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

  const response = await fetch(`${MESHY_V2_BASE}/text-to-3d/${meshy_request_id}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${meshyApiKey}` },
  });

  if (!response.ok) {
    return jsonResponse({ status: "error", error: "Failed to check Meshy status" });
  }

  const taskStatus = await response.json();

  if (taskStatus.status === "SUCCEEDED") {
    const glbUrl = taskStatus.model_urls?.glb;

    const { data: currentAsset } = await supabase
      .from("asset_library")
      .select("metadata, tags")
      .eq("id", asset_id)
      .maybeSingle();
    const existingMeta = currentAsset?.metadata || {};

    await supabase
      .from("asset_library")
      .update({
        status: "completed",
        file_url: glbUrl,
        preview_url: taskStatus.thumbnail_url || glbUrl,
        updated_at: new Date().toISOString(),
        metadata: {
          ...existingMeta,
          formats: {
            glb: taskStatus.model_urls?.glb,
            fbx: taskStatus.model_urls?.fbx,
            usdz: taskStatus.model_urls?.usdz,
          },
          thumbnail_url: taskStatus.thumbnail_url,
        },
      })
      .eq("id", asset_id);

    const category = existingMeta.model_type || "";
    const assetTags: string[] = currentAsset?.tags || [];
    const shouldRig = RIGGABLE_CATEGORIES.includes(category) ||
      assetTags.some((t: string) => RIGGABLE_CATEGORIES.includes(t));

    if (shouldRig && glbUrl) {
      console.log(`poll-and-update: auto-rigging asset ${asset_id}`);
      await startRiggingPipeline(meshyApiKey, asset_id, glbUrl, supabase);
    }

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

  const response = await fetch(`${MESHY_V2_BASE}/text-to-3d/${meshyRequestId}`, {
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

async function handleRigModel(
  body: { asset_id: string; model_url?: string },
  meshyApiKey: string,
  supabase: ReturnType<typeof createClient>
) {
  const { asset_id, model_url } = body;

  if (!asset_id) {
    return jsonResponse({ error: "asset_id is required" }, 400);
  }

  const { data: asset } = await supabase
    .from("asset_library")
    .select("*")
    .eq("id", asset_id)
    .maybeSingle();

  if (!asset) {
    return jsonResponse({ error: "Asset not found" }, 404);
  }

  const glbUrl = model_url || asset.file_url;
  if (!glbUrl) {
    return jsonResponse({ error: "No model URL available for rigging" }, 400);
  }

  const rigResponse = await fetch(`${MESHY_V1_BASE}/rigging`, {
    method: "POST",
    headers: meshyHeaders(meshyApiKey),
    body: JSON.stringify({
      model_url: glbUrl,
      height_meters: 1.7,
    }),
  });

  if (!rigResponse.ok) {
    const errText = await rigResponse.text();
    return jsonResponse({ error: `Rigging API error: ${errText}` }, rigResponse.status);
  }

  const rigData = await rigResponse.json();
  const rigTaskId = rigData.result || rigData.id;

  if (!rigTaskId) {
    return jsonResponse({ error: "No rig task ID returned" }, 500);
  }

  const existingMetadata = asset.metadata || {};
  await supabase
    .from("asset_library")
    .update({
      updated_at: new Date().toISOString(),
      metadata: {
        ...existingMetadata,
        rigging: {
          task_id: rigTaskId,
          status: "PENDING",
          started_at: new Date().toISOString(),
        },
        animations: {},
      },
    })
    .eq("id", asset_id);

  scheduleRiggingPipeline(meshyApiKey, asset_id, rigTaskId, supabase);

  return jsonResponse({
    success: true,
    asset_id,
    rig_task_id: rigTaskId,
    status: "rigging_started",
  });
}

async function handleCheckRigStatus(
  body: { asset_id: string; rig_task_id?: string },
  meshyApiKey: string,
  supabase: ReturnType<typeof createClient>
) {
  const { asset_id, rig_task_id } = body;

  if (!rig_task_id && !asset_id) {
    return jsonResponse({ error: "rig_task_id or asset_id required" }, 400);
  }

  let taskId = rig_task_id;

  if (!taskId && asset_id) {
    const { data: asset } = await supabase
      .from("asset_library")
      .select("metadata")
      .eq("id", asset_id)
      .maybeSingle();

    taskId = asset?.metadata?.rigging?.task_id;
    if (!taskId) {
      return jsonResponse({ error: "No rigging task found for this asset" }, 404);
    }
  }

  const response = await fetch(`${MESHY_V1_BASE}/rigging/${taskId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${meshyApiKey}` },
  });

  if (!response.ok) {
    return jsonResponse({ error: "Failed to check rig status" }, response.status);
  }

  const rigStatus = await response.json();

  return jsonResponse({
    status: rigStatus.status,
    progress: rigStatus.progress,
    result: rigStatus.result,
    error: rigStatus.task_error,
  });
}

async function handleCheckAnimationProgress(
  body: { asset_id: string },
  supabase: ReturnType<typeof createClient>
) {
  const { asset_id } = body;

  if (!asset_id) {
    return jsonResponse({ error: "asset_id is required" }, 400);
  }

  const { data: asset } = await supabase
    .from("asset_library")
    .select("metadata")
    .eq("id", asset_id)
    .maybeSingle();

  if (!asset) {
    return jsonResponse({ error: "Asset not found" }, 404);
  }

  const metadata = asset.metadata || {};
  const rigging = metadata.rigging || {};
  const animations = metadata.animations || {};

  const animationSummary: Record<string, { status: string; glb_url?: string }> = {};
  let allComplete = true;
  let anyFailed = false;

  for (const [name, data] of Object.entries(animations) as [string, any][]) {
    animationSummary[name] = {
      status: data.status || "PENDING",
      glb_url: data.glb_url,
    };
    if (data.status !== "SUCCEEDED") allComplete = false;
    if (data.status === "FAILED") anyFailed = true;
  }

  const totalAnimations = Object.keys(GAME_ANIMATIONS).length;
  const completedAnimations = Object.values(animations).filter(
    (a: any) => a.status === "SUCCEEDED"
  ).length;

  let overallStatus = "pending";
  if (rigging.status === "PENDING" || rigging.status === "IN_PROGRESS") {
    overallStatus = "rigging";
  } else if (rigging.status === "FAILED") {
    overallStatus = "failed";
  } else if (rigging.status === "SUCCEEDED" && completedAnimations === 0) {
    overallStatus = "animating";
  } else if (allComplete && completedAnimations === totalAnimations) {
    overallStatus = "completed";
  } else if (anyFailed && completedAnimations > 0) {
    overallStatus = "partial";
  } else {
    overallStatus = "animating";
  }

  return jsonResponse({
    asset_id,
    overall_status: overallStatus,
    rigging: {
      status: rigging.status || "NOT_STARTED",
      rigged_glb_url: rigging.rigged_glb_url,
    },
    animations: animationSummary,
    progress: {
      completed: completedAnimations,
      total: totalAnimations,
    },
  });
}

function scheduleModelPolling(
  meshyApiKey: string,
  assetId: string,
  meshyRequestId: string,
  shouldAutoRig: boolean,
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
          const response = await fetch(`${MESHY_V2_BASE}/text-to-3d/${meshyRequestId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${meshyApiKey}` },
          });

          if (!response.ok) continue;

          const taskStatus = await response.json();

          if (taskStatus.status === "SUCCEEDED") {
            const glbUrl = taskStatus.model_urls?.glb;

            const { data: currentAsset } = await supabase
              .from("asset_library")
              .select("metadata")
              .eq("id", assetId)
              .maybeSingle();
            const existingMeta = currentAsset?.metadata || {};

            await supabase
              .from("asset_library")
              .update({
                status: "completed",
                file_url: glbUrl,
                preview_url: taskStatus.thumbnail_url || glbUrl,
                updated_at: new Date().toISOString(),
                metadata: {
                  ...existingMeta,
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

            if (shouldAutoRig && glbUrl) {
              console.log(`Auto-rigging asset ${assetId} (category detected as riggable)`);
              await startRiggingPipeline(meshyApiKey, assetId, glbUrl, supabase);
            }
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

async function startRiggingPipeline(
  meshyApiKey: string,
  assetId: string,
  glbUrl: string,
  supabase: ReturnType<typeof createClient>
) {
  try {
    const rigResponse = await fetch(`${MESHY_V1_BASE}/rigging`, {
      method: "POST",
      headers: meshyHeaders(meshyApiKey),
      body: JSON.stringify({
        model_url: glbUrl,
        height_meters: 1.7,
      }),
    });

    if (!rigResponse.ok) {
      console.error(`Rigging request failed for ${assetId}: ${await rigResponse.text()}`);
      await updateAssetMetadata(supabase, assetId, {
        rigging: { status: "FAILED", error: "Rigging request failed" },
      });
      return;
    }

    const rigData = await rigResponse.json();
    const rigTaskId = rigData.result || rigData.id;

    if (!rigTaskId) {
      console.error(`No rig task ID for ${assetId}`);
      return;
    }

    await updateAssetMetadata(supabase, assetId, {
      rigging: {
        task_id: rigTaskId,
        status: "PENDING",
        started_at: new Date().toISOString(),
      },
      animations: {},
    });

    await pollRiggingAndAnimate(meshyApiKey, assetId, rigTaskId, supabase);
  } catch (error) {
    console.error(`startRiggingPipeline error for ${assetId}: ${error}`);
  }
}

function scheduleRiggingPipeline(
  meshyApiKey: string,
  assetId: string,
  rigTaskId: string,
  supabase: ReturnType<typeof createClient>
) {
  EdgeRuntime.waitUntil(
    pollRiggingAndAnimate(meshyApiKey, assetId, rigTaskId, supabase)
  );
}

async function pollRiggingAndAnimate(
  meshyApiKey: string,
  assetId: string,
  rigTaskId: string,
  supabase: ReturnType<typeof createClient>
) {
  const maxAttempts = 120;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    try {
      const response = await fetch(`${MESHY_V1_BASE}/rigging/${rigTaskId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${meshyApiKey}` },
      });

      if (!response.ok) continue;

      const rigStatus = await response.json();

      if (rigStatus.status === "SUCCEEDED") {
        const result = rigStatus.result || {};
        await updateAssetMetadata(supabase, assetId, {
          rigging: {
            task_id: rigTaskId,
            status: "SUCCEEDED",
            rigged_glb_url: result.rigged_character_glb_url,
            rigged_fbx_url: result.rigged_character_fbx_url,
            basic_animations: result.basic_animations,
            finished_at: new Date().toISOString(),
          },
        });

        console.log(`Rigging completed for ${assetId}, starting animations`);
        await startAnimationBatch(meshyApiKey, assetId, rigTaskId, supabase);
        return;
      }

      if (rigStatus.status === "FAILED") {
        await updateAssetMetadata(supabase, assetId, {
          rigging: {
            task_id: rigTaskId,
            status: "FAILED",
            error: rigStatus.task_error?.message || "Rigging failed",
          },
        });
        console.log(`Rigging failed for ${assetId}`);
        return;
      }

      await updateAssetMetadata(supabase, assetId, {
        rigging: {
          task_id: rigTaskId,
          status: rigStatus.status,
          progress: rigStatus.progress,
        },
      });
    } catch (error) {
      console.error(`Rig poll error for ${assetId}: ${error}`);
    }
  }

  await updateAssetMetadata(supabase, assetId, {
    rigging: { task_id: rigTaskId, status: "FAILED", error: "Polling timeout" },
  });
}

async function startAnimationBatch(
  meshyApiKey: string,
  assetId: string,
  rigTaskId: string,
  supabase: ReturnType<typeof createClient>
) {
  const animationTasks: Record<string, string> = {};

  for (const [name, actionId] of Object.entries(GAME_ANIMATIONS)) {
    try {
      const animResponse = await fetch(`${MESHY_V1_BASE}/animations`, {
        method: "POST",
        headers: meshyHeaders(meshyApiKey),
        body: JSON.stringify({
          rig_task_id: rigTaskId,
          action_id: actionId,
        }),
      });

      if (!animResponse.ok) {
        const errText = await animResponse.text();
        console.error(`Animation ${name} request failed: ${errText}`);
        await updateAnimationStatus(supabase, assetId, name, {
          status: "FAILED",
          error: errText,
          action_id: actionId,
        });
        continue;
      }

      const animData = await animResponse.json();
      const animTaskId = animData.result || animData.id;

      if (animTaskId) {
        animationTasks[name] = animTaskId;
        await updateAnimationStatus(supabase, assetId, name, {
          task_id: animTaskId,
          status: "PENDING",
          action_id: actionId,
          started_at: new Date().toISOString(),
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Animation ${name} error: ${error}`);
      await updateAnimationStatus(supabase, assetId, name, {
        status: "FAILED",
        error: String(error),
        action_id: actionId,
      });
    }
  }

  for (const [name, taskId] of Object.entries(animationTasks)) {
    await pollAnimationTask(meshyApiKey, assetId, name, taskId, supabase);
  }

  console.log(`All animation polling complete for ${assetId}`);
}

async function pollAnimationTask(
  meshyApiKey: string,
  assetId: string,
  animName: string,
  animTaskId: string,
  supabase: ReturnType<typeof createClient>
) {
  const maxAttempts = 120;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    try {
      const response = await fetch(`${MESHY_V1_BASE}/animations/${animTaskId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${meshyApiKey}` },
      });

      if (!response.ok) continue;

      const animStatus = await response.json();

      if (animStatus.status === "SUCCEEDED") {
        const result = animStatus.result || {};
        await updateAnimationStatus(supabase, assetId, animName, {
          task_id: animTaskId,
          status: "SUCCEEDED",
          glb_url: result.animation_glb_url,
          fbx_url: result.animation_fbx_url,
          finished_at: new Date().toISOString(),
        });
        console.log(`Animation ${animName} completed for ${assetId}`);
        return;
      }

      if (animStatus.status === "FAILED") {
        await updateAnimationStatus(supabase, assetId, animName, {
          task_id: animTaskId,
          status: "FAILED",
          error: animStatus.task_error?.message || "Animation failed",
        });
        console.log(`Animation ${animName} failed for ${assetId}`);
        return;
      }
    } catch (error) {
      console.error(`Animation poll error ${animName} for ${assetId}: ${error}`);
    }
  }

  await updateAnimationStatus(supabase, assetId, animName, {
    task_id: animTaskId,
    status: "FAILED",
    error: "Polling timeout",
  });
}

async function updateAssetMetadata(
  supabase: ReturnType<typeof createClient>,
  assetId: string,
  partialMetadata: Record<string, unknown>
) {
  const { data: asset } = await supabase
    .from("asset_library")
    .select("metadata")
    .eq("id", assetId)
    .maybeSingle();

  const existing = asset?.metadata || {};
  await supabase
    .from("asset_library")
    .update({
      metadata: { ...existing, ...partialMetadata },
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId);
}

async function updateAnimationStatus(
  supabase: ReturnType<typeof createClient>,
  assetId: string,
  animName: string,
  animData: Record<string, unknown>
) {
  const { data: asset } = await supabase
    .from("asset_library")
    .select("metadata")
    .eq("id", assetId)
    .maybeSingle();

  const existing = asset?.metadata || {};
  const animations = existing.animations || {};
  animations[animName] = { ...(animations[animName] || {}), ...animData };

  await supabase
    .from("asset_library")
    .update({
      metadata: { ...existing, animations },
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId);
}
