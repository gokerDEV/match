import { clamp, geometricMean } from "@/lib/engine/runner";
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
	const titleScore = metrics.title_length?.normalized ?? 0.0;
	const metaScore = metrics.meta_length?.normalized ?? 0.0;

	return {
		raw: geometricMean([titleScore, metaScore]),
		normalized: clamp(geometricMean([titleScore, metaScore])),
	};
};
