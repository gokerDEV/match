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
	const hasViewport = !!extractions.viewportMeta;
	return { raw: hasViewport ? 1.0 : 0.0, normalized: hasViewport ? 1.0 : 0.0 };
};
