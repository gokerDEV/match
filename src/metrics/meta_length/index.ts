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
	const metaDesc =
		typeof extractions.metaDescription === "string"
			? extractions.metaDescription.trim()
			: "";
	if (metaDesc.length > 50 && metaDesc.length <= 160)
		return { raw: 1.0, normalized: 1.0 };
	if (metaDesc.length > 0 && metaDesc.length <= 200)
		return { raw: 0.5, normalized: 0.5 };
	return { raw: 0.0, normalized: 0.0 };
};
