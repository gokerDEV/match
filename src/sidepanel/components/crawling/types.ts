import type { Extractions, Inputs, Metrics } from "@/lib/types/engine";

export interface CsvRow {
	id: string;
	searchTerm: string;
	url: string;
}

export interface CrawlingResultItem {
	id: string;
	searchTerm: string;
	url: string;
	visitedUrl: string;
	scores: number[] | null;
	inputs?: Inputs;
	metrics?: Metrics;
	extractions?: Extractions | null;
	error?: string;
	status: "pending" | "done" | "error";
}

export interface CrawlingBatch {
	index: number;
	start: number;
	end: number;
	items: CrawlingResultItem[];
	status: "pending" | "running" | "completed" | "error";
	completedCount: number;
}
