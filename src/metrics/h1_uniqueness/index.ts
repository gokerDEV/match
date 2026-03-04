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
	const h1List = Array.isArray(extractions.h1List) ? extractions.h1List : [];
	if (h1List.length === 1) return { raw: 1.0, normalized: 1.0 };
	if (h1List.length > 1) return { raw: 0.5, normalized: 0.5 };
	return { raw: 0.0, normalized: 0.0 };
};
