import { metricDescriptions } from "./engine/plan";
import type { EngineResult, Inputs, Metrics } from "./types/engine";

export const generateReport = (
	inputs: Inputs,
	metrics: Metrics,
): EngineResult => {
	const metricValues: Record<string, { raw: number; normalized: number }> = {};

	// Flatten the metrics map to just values for the report
	for (const id of Object.keys(metrics)) {
		metricValues[id] = metrics[id];
	}

	return {
		version: "1.0",
		inputs: inputs,
		descriptions: metricDescriptions,
		metrics: metricValues,
	};
};

export const generateBatchReport = (
	runs: { inputs: Inputs; metrics: Metrics }[],
) => {
	const formattedRuns = runs.map((r) => {
		const metricValues: Record<string, { raw: number; normalized: number }> =
			{};
		for (const id of Object.keys(r.metrics)) {
			metricValues[id] = r.metrics[id];
		}
		return {
			inputs: r.inputs,
			metrics: metricValues,
		};
	});

	return {
		version: "1.0",
		descriptions: metricDescriptions,
		runs: formattedRuns,
	};
};
