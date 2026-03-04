import { env, pipeline } from "@xenova/transformers";

// Extension-specific Xenova Configuration
env.allowLocalModels = true;
// Disable multithreading to prevent Atomics.wait errors in Service Workers
env.backends.onnx.wasm.numThreads = 1;
// We serve files from public/models, which end up in dist/models.
// And accessing it via chrome.runtime.getURL ensures absolute Extension path.
if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
	env.localModelPath = chrome.runtime.getURL("models");
	env.allowRemoteModels = false; // Strictly enforce local
	// Point onnxruntime-web to the wasm directory shipped with the extension.
	// Without this, the runtime tries to fetch .wasm files relative to the
	// bundled JS path, which is unresolvable inside a Service Worker.
	env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("wasm/");
} else {
	// Fallback for node scripts
	env.localModelPath = "./public/models";
	env.allowRemoteModels = true;
}
env.useBrowserCache = false;

const task = "feature-extraction" as const;
const model = "Xenova/all-MiniLM-L6-v2";
// biome-ignore lint/suspicious/noExplicitAny: Pipeline instance from xenova
let instance: any = null;

// biome-ignore lint/suspicious/noExplicitAny: Pipeline instance from xenova
async function getInstance(progress_callback?: any) {
	if (instance === null) {
		instance = await pipeline(task, model, {
			progress_callback,
		});
	}
	return instance;
}

export async function computeSimilarity(
	text1: string,
	text2: string,
): Promise<number> {
	if (!text1 || !text2) return 0.0;

	// Normalize
	const t1 = text1.trim().toLowerCase();
	const t2 = text2.trim().toLowerCase();

	if (!t1 || !t2) return 0.0;
	if (t2.includes(t1)) return 1.0;

	try {
		const extractor = await getInstance();

		const output1 = await extractor(t1, {
			pooling: "mean",
			normalize: true,
		});

		// Simple chunking (e.g., split by periods or double newlines)
		const chunks = t2
			.split(/[.\n]+/)
			.map((c) => c.trim())
			.filter((c) => c.length > 5);

		// If no distinct chunks, just compare whole text
		if (chunks.length === 0) {
			chunks.push(t2);
		}

		let maxSim = 0;

		for (const chunk of chunks) {
			const output2 = await extractor(chunk, {
				pooling: "mean",
				normalize: true,
			});

			const vec1 = output1.data;
			const vec2 = output2.data;

			let dotProduct = 0;
			for (let i = 0; i < vec1.length; i++) {
				dotProduct += vec1[i] * vec2[i];
			}

			if (dotProduct > maxSim) {
				maxSim = dotProduct;
			}
		}

		return Math.max(0, Math.min(1, maxSim));
	} catch (error) {
		console.error("Similarity Calculation Failed:", error);
		return 0.0;
	}
}
