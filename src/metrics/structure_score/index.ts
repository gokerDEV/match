import type {
	Extractions,
	Inputs,
	Metrics,
	Resolver,
} from "@/lib/types/engine";

export const resolver: Resolver = (
	extractions: Extractions,
	_metrics: Metrics,
	_inputs: Inputs,
) => {
	const countMain =
		typeof extractions.countMain === "number" ? extractions.countMain : 0;
	const countArticle =
		typeof extractions.countArticle === "number" ? extractions.countArticle : 0;

	let structureScore = 0;
	if (countMain > 0) structureScore += 0.8;
	if (countArticle > 0) structureScore += 0.2;

	// Penalize multiple main tags (HTML spec says there should be only one visible)
	if (countMain > 1) structureScore -= 0.4;

	return {
		raw: Math.max(0, Math.min(1.0, structureScore)),
		normalized: Math.max(0, Math.min(1.0, structureScore)),
	};
};
