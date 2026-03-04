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
	const axeScore = metrics.axe_score?.normalized ?? 0.0;
	return { raw: axeScore, normalized: clamp(axeScore) };
};
