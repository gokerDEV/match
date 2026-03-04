export interface Extractions {
	// Explicit keys OR index signature (v1 can use index signature)
	[key: string]:
		| string
		| string[]
		| number
		| boolean
		| null
		| Record<string, unknown>
		| Array<Record<string, unknown>>;
}

export interface Metrics {
	[metricId: string]: { normalized: number; raw: number };
}

export interface Inputs {
	url: string;
	searchTerm: string;
	timestamp: number;
}

export type Resolver = (
	extractions: Extractions,
	metrics: Metrics,
	inputs: Inputs,
) =>
	| Promise<{ raw: number; normalized: number }>
	| { raw: number; normalized: number };

export interface MetricConfig {
	id: string;
	type: "absolute" | "proxy";
	inputs?: string[];
	dependencies?: string[];
	// constraints?: Record<string, number>; //  NO NEED  min 0 max  1  and  ideal  should be  1  for  each metric
	description: string;
}

export interface EngineResult {
	version: string;
	inputs: Inputs;
	descriptions: Record<string, string>;
	metrics: Record<string, { raw: number; normalized: number }>;
}
