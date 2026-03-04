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
	const langScore = metrics.lang_presence?.normalized ?? 0.0;
	const viewportScore = metrics.viewport_presence?.normalized ?? 0.0;
	return {
		raw: (langScore + viewportScore) / 2,
		normalized: clamp((langScore + viewportScore) / 2),
	};
};
