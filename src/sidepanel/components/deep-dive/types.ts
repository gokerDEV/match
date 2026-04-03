import type { Inputs, Metrics } from "@/lib/types/engine";

export interface LinkInput {
	href: string;
	text: string;
}

export interface PreparedLink {
	text: string;
	normalizedHref: string;
}

export interface DeepDiveResult {
	url: string;
	searchTerm: string;
	scores: number[] | null;
	inputs?: Inputs;
	metrics?: Metrics;
	error?: string;
	status: "pending" | "done" | "error";
}
