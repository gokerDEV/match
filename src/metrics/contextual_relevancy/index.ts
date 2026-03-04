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
	inputs: Inputs,
) => {
	const searchTerm = (inputs.searchTerm || "").trim().toLowerCase();
	if (!searchTerm) return { raw: 0.0, normalized: 0.0 };

	const mainScore = metrics.main_similarity?.normalized ?? 0.0;
	const titleScore = metrics.title_similarity?.normalized ?? 0.0;
	const h1Score = metrics.h1_similarity?.normalized ?? 0.0;

	// In the real version we'd probably use a weighted sum or geometric mean
	// Let's use weighted for MVP
	const combined = mainScore * 0.7 + titleScore * 0.2 + h1Score * 0.1;

	return { raw: combined, normalized: clamp(combined) };
};
