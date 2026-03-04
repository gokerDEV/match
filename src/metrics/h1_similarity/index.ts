import { computeSimilarity } from "@/lib/ai/similarity";
import type {
	Extractions,
	Inputs,
	Metrics,
	Resolver,
} from "@/lib/types/engine";

export const resolver: Resolver = async (
	extractions: Extractions,
	_metrics: Metrics,
	inputs: Inputs,
) => {
	const searchTerm = (inputs.searchTerm || "").trim().toLowerCase();
	if (!searchTerm) return { raw: 0.0, normalized: 0.0 };

	const h1List = Array.isArray(extractions.h1List) ? extractions.h1List : [];
	if (h1List.length === 0) return { raw: 0.0, normalized: 0.0 };

	const h1Text = h1List.join(" ").toLowerCase();

	const similarity = await computeSimilarity(searchTerm, h1Text);
	return { raw: similarity, normalized: similarity };
};
