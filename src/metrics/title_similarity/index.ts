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

	const title =
		typeof extractions.title === "string"
			? extractions.title.toLowerCase()
			: "";
	if (!title) return { raw: 0.0, normalized: 0.0 };

	const similarity = await computeSimilarity(searchTerm, title);
	return { raw: similarity, normalized: similarity };
};
