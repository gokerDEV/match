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
	const title =
		typeof extractions.title === "string" ? extractions.title.trim() : "";
	if (title.length > 10 && title.length <= 60)
		return { raw: 1.0, normalized: 1.0 };
	if (title.length > 0 && title.length <= 70)
		return { raw: 0.5, normalized: 0.5 };
	return { raw: 0.0, normalized: 0.0 };
};
