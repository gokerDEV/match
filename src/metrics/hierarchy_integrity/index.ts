import { clamp } from "@/lib/engine/runner";
import type {
	Extractions,
	Inputs,
	Metrics,
	Resolver,
} from "@/lib/types/engine";

export const resolver: Resolver = (
	_extractions: Extractions,
	metrics: Metrics,
	_inputs: Inputs,
) => {
	const h1Score = metrics.h1_uniqueness?.normalized ?? 0.0;
	const structureScore = metrics.structure_score?.normalized ?? 0.0;

	let raw = h1Score * 0.5 + structureScore * 0.5;

	// Penalize hierarchy heavily if there is no readable content
	const mainText =
		typeof _extractions.mainText === "string"
			? _extractions.mainText.trim()
			: "";

	console.log("mainText", mainText);

	if (!mainText || mainText.length < 20) {
		raw *= 0.1;
	}

	return {
		raw,
		normalized: clamp(raw),
	};
};
