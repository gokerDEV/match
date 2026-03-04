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
	const passes =
		typeof extractions.axePasses === "number" ? extractions.axePasses : 0;
	const violations =
		typeof extractions.axeViolations === "number"
			? extractions.axeViolations
			: 0;

	if (passes === 0 && violations === 0) return { raw: 0.5, normalized: 0.5 }; // neutral if no scan data
	if (violations === 0) return { raw: 1.0, normalized: 1.0 };

	const ratio = passes / (passes + violations);
	return { raw: ratio, normalized: ratio * ratio };
};
