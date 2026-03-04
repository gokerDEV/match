import { env, pipeline } from "@xenova/transformers";
import fs from "node:fs";
import path from "node:path";

async function downloadModel() {
    console.log("Configuring transformers.js cache directory...");

    // We want to force downloading into the project's public directory
    // so Vite can serve it to the extension
    const modelsDir = path.resolve(process.cwd(), "public", "models");
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
    }

    env.allowLocalModels = true;
    env.useBrowserCache = false;
    env.allowRemoteModels = true;
    // By setting cacheDir in Node, huggingface downloads it there
    env.cacheDir = modelsDir;

    console.log("Downloading Xenova/all-MiniLM-L6-v2...");

    try {
        // Just calling pipeline will fetch and cache the model locally
        await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        console.log("Model successfully downloaded to ./public/models/");
    } catch (error) {
        console.error("Failed to download model:", error);
        process.exit(1);
    }
}

downloadModel();
