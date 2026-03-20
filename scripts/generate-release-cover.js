import fs from "fs";
import path from "path";

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiUrl =
    process.env.OPENROUTER_API_URL ||
    "https://openrouter.ai/api/v1/images/generate";
  const tag =
    process.env.GITHUB_REF_NAME || process.env.GITHUB_REF || "release";
  const outDir = path.resolve(process.cwd(), "artifacts");
  const outPath = path.join(outDir, "release-cover.png");

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set. Skipping image generation.");
    process.exit(0);
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const defaultPrompt = `Clippy in a 3D world reminiscent of Toy Story, vibrant cinematic lighting, full-bleed banner composition, include the text "Clippy" and the version "${tag}" prominently, retro Windows 95 color accents.`;
  const envPrompt = process.env.COVER_PROMPT;
  // If user sets COVER_PROMPT and includes {version}, replace it; otherwise append version
  let prompt = envPrompt
    ? envPrompt.replace(/\{version\}/g, tag)
    : defaultPrompt;

  console.log("Generating cover image with prompt:", prompt);

  try {
    const size = process.env.COVER_SIZE || "1920x600";
    const model = process.env.COVER_MODEL || "bytedance-seed/seedream-4.5";
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, size, model }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Image generation failed:", res.status, body);
      console.warn("Continuing without cover image (non-fatal).");
      return;
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.startsWith("image/")) {
      const arrayBuf = await res.arrayBuffer();
      fs.writeFileSync(outPath, Buffer.from(arrayBuf));
      console.log("Wrote image to", outPath);
      return;
    }

    const json = await res.json();

    // Try common locations for base64 image data
    let b64 = null;
    if (json.output && Array.isArray(json.output) && json.output[0]) {
      if (typeof json.output[0] === "string") b64 = json.output[0];
      else if (json.output[0].b64_json) b64 = json.output[0].b64_json;
      else if (json.output[0].image) b64 = json.output[0].image;
    }
    if (!b64 && json.data && Array.isArray(json.data) && json.data[0]) {
      b64 = json.data[0].b64_json || json.data[0].b64 || json.data[0].image;
    }
    if (!b64 && json.image) b64 = json.image;

    if (!b64) {
      console.error(
        "No image data found in response:",
        JSON.stringify(json).slice(0, 1000),
      );
      console.warn("Continuing without cover image (non-fatal).");
      return;
    }

    // Strip data URL prefix if present
    const match = b64.match(/^data:([a-zA-Z0-9/\-+.]+);base64,(.*)$/s);
    let base64Str = b64;
    if (match) base64Str = match[2];

    fs.writeFileSync(outPath, Buffer.from(base64Str, "base64"));
    console.log("Wrote image to", outPath);
  } catch (err) {
    console.error("Error generating image:", err);
    console.warn("Continuing without cover image (non-fatal).");
    return;
  }
}

main();
