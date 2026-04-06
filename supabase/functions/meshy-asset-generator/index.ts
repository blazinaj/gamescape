import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateModelRequest {
  prompt: string;
  art_style?: string;
  user_id?: string;
  name?: string;
  description?: string;
  tags?: string[];
}

interface TaskStatus {
  taskId: string;
  meshyRequestId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const meshyApiKey = Deno.env.get("MESHY_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !meshyApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Generate character model endpoint
    if (pathname === "/functions/v1/meshy-asset-generator/generate-model" && req.method === "POST") {
      const body: GenerateModelRequest = await req.json();
      const { prompt, art_style, user_id, name, description, tags } = body;

      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "Prompt is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Call Meshy API to generate model
      const meshyResponse = await fetch("https://api.meshy.ai/v2/text-to-3d", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${meshyApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "preview",
          prompt: `A detailed 3D character model. ${prompt}. Game-ready, optimized for real-time rendering.`,
          art_style: art_style || "realistic",
          negative_prompt: "low quality, blurry, distorted",
        }),
      });

      if (!meshyResponse.ok) {
        const error = await meshyResponse.json();
        return new Response(
          JSON.stringify({ error: `Meshy API error: ${error.message}` }),
          { status: meshyResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const meshyData = await meshyResponse.json();

      // Create asset record in database
      const assetName = name || `Generated Character - ${new Date().toISOString().slice(0, 10)}`;

      const { data: asset, error: assetError } = await supabase
        .from("asset_library")
        .insert([
          {
            asset_type: "model",
            content_type: "gltf",
            name: assetName,
            description: description || null,
            prompt,
            meshy_request_id: meshyData.id,
            generated_by_user_id: user_id || null,
            status: "pending",
            tags: tags || ["character", "generated"],
            metadata: {
              art_style,
              model_type: "character",
            },
          },
        ])
        .select()
        .single();

      if (assetError) {
        return new Response(
          JSON.stringify({ error: `Database error: ${assetError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create generation log
      if (user_id) {
        await supabase
          .from("asset_generations")
          .insert([
            {
              user_id,
              asset_id: asset.id,
              prompt,
              meshy_request_id: meshyData.id,
              status: "pending",
            },
          ]);
      }

      // Schedule async polling for completion
      scheduleTaskPolling(meshyApiKey, asset.id, meshyData.id, supabaseUrl, supabaseServiceKey);

      return new Response(
        JSON.stringify({
          success: true,
          asset_id: asset.id,
          meshy_request_id: meshyData.id,
          message: "Asset generation started. Polling for completion in background.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check task status endpoint
    if (pathname === "/functions/v1/meshy-asset-generator/check-status" && req.method === "POST") {
      const body: TaskStatus = await req.json();
      const { meshyRequestId } = body;

      if (!meshyRequestId) {
        return new Response(
          JSON.stringify({ error: "meshyRequestId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check status from Meshy
      const meshyResponse = await fetch(`https://api.meshy.ai/v2/text-to-3d/${meshyRequestId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${meshyApiKey}`,
        },
      });

      if (!meshyResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to check task status" }),
          { status: meshyResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const meshyStatus = await meshyResponse.json();

      return new Response(
        JSON.stringify({
          status: meshyStatus.status,
          model_urls: meshyStatus.model_urls,
          error: meshyStatus.error,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function scheduleTaskPolling(
  meshyApiKey: string,
  assetId: string,
  meshyRequestId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  EdgeRuntime.waitUntil(
    (async () => {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const maxAttempts = 600; // 30 minutes with 3-second intervals
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          // Check status with Meshy
          const response = await fetch(`https://api.meshy.ai/v2/text-to-3d/${meshyRequestId}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${meshyApiKey}`,
            },
          });

          if (!response.ok) {
            console.error(`Failed to check task status: ${response.statusText}`);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }

          const taskStatus = await response.json();

          if (taskStatus.status === "SUCCEEDED") {
            // Update asset with completion data
            const glbUrl = taskStatus.model_urls?.glb;
            await supabase
              .from("asset_library")
              .update({
                status: "completed",
                file_url: glbUrl,
                preview_url: taskStatus.model_urls?.fbx || glbUrl,
                updated_at: new Date().toISOString(),
                metadata: {
                  model_type: "character",
                  formats: {
                    glb: taskStatus.model_urls?.glb,
                    fbx: taskStatus.model_urls?.fbx,
                    usdz: taskStatus.model_urls?.usdz,
                  },
                },
              })
              .eq("id", assetId);

            // Update generation log
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
            // Update asset with failure
            await supabase
              .from("asset_library")
              .update({
                status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", assetId);

            // Update generation log
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

          // Still pending
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`Error polling task: ${error}`);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Timeout reached
      console.error(`Task polling timeout for asset ${assetId}`);
    })()
  );
}
