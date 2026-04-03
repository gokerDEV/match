import type { Extractions, Inputs, Metrics } from "@/lib/types/engine";

export type MessageType =
	| "EXTRACT_SIGNALS"
	| "RUN_ANALYSIS"
	| "GET_CACHED_EXTRACTIONS"
	| "RUN_DEEP_DIVE"
	| "PAUSE_DEEP_DIVE"
	| "RESUME_DEEP_DIVE"
	| "DEEP_DIVE_PROGRESS"
	| "DEEP_DIVE_COMPLETE";

export interface EXTRACT_SIGNALS_MESSAGE {
	type: "EXTRACT_SIGNALS";
}

export interface EXTRACT_SIGNALS_RESPONSE {
	success: boolean;
	data?: Extractions;
	error?: string;
	debug?: string[];
}

export interface GET_CACHED_EXTRACTIONS_MESSAGE {
	type: "GET_CACHED_EXTRACTIONS";
	payload: {
		url: string;
	};
}

export interface GET_CACHED_EXTRACTIONS_RESPONSE {
	success: boolean;
	data?: Extractions;
	error?: string;
}

export interface RUN_ANALYSIS_MESSAGE {
	type: "RUN_ANALYSIS";
	payload: {
		searchTerm: string;
		tabId?: number;
		url?: string;
		force?: boolean;
	};
}

export interface RUN_ANALYSIS_RESPONSE {
	success: boolean;
	scores?: number[];
	metrics?: Metrics;
	inputs?: Inputs;
	logs?: string[];
	error?: string;
}

export interface RUN_DEEP_DIVE_MESSAGE {
	type: "RUN_DEEP_DIVE";
	payload: {
		tabId: number;
		links: Array<{
			href: string;
			text: string;
		}>;
	};
}

export interface RUN_DEEP_DIVE_RESPONSE {
	success: boolean;
	jobId?: string;
	error?: string;
}

export interface PAUSE_DEEP_DIVE_MESSAGE {
	type: "PAUSE_DEEP_DIVE";
}

export interface RESUME_DEEP_DIVE_MESSAGE {
	type: "RESUME_DEEP_DIVE";
}

export interface DEEP_DIVE_CONTROL_RESPONSE {
	success: boolean;
	error?: string;
}

export interface DEEP_DIVE_PROGRESS_MESSAGE {
	type: "DEEP_DIVE_PROGRESS";
	payload: {
		jobId: string;
		index: number;
		total: number;
		url: string;
		searchTerm: string;
		scores?: number[];
		error?: string;
	};
}

export interface DEEP_DIVE_COMPLETE_MESSAGE {
	type: "DEEP_DIVE_COMPLETE";
	payload: {
		jobId: string;
		total: number;
		completed: number;
	};
}
