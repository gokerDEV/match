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
	const hasLang = !!extractions.htmlLang;
	return { raw: hasLang ? 1.0 : 0.0, normalized: hasLang ? 1.0 : 0.0 };
};
