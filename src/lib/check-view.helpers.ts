import type {
	RUN_ANALYSIS_MESSAGE,
	RUN_ANALYSIS_RESPONSE,
} from "@/services/messaging";

export const CHECK_VIEW_HYDRATE_KEY = "match_check_view_hydrate";

interface HydrateCheckViewParams {
	tabId: number;
	url: string;
	searchTerm: string;
	force?: boolean;
}

export const hydrateAndOpenCheckView = async ({
	tabId,
	url,
	searchTerm,
	force = false,
}: HydrateCheckViewParams): Promise<void> => {
	const response = await chrome.runtime.sendMessage<
		RUN_ANALYSIS_MESSAGE,
		RUN_ANALYSIS_RESPONSE
	>({
		type: "RUN_ANALYSIS",
		payload: {
			tabId,
			url,
			searchTerm,
			force,
		},
	});

	if (
		!response?.success ||
		!response.scores ||
		!response.metrics ||
		!response.inputs
	) {
		throw new Error(response?.error || "Failed to hydrate Check view.");
	}

	await chrome.storage.session.set({
		[CHECK_VIEW_HYDRATE_KEY]: {
			url,
			searchTerm,
			scores: response.scores,
			fullMetrics: response.metrics,
			fullInputs: response.inputs,
		},
	});

	window.dispatchEvent(
		new CustomEvent("match:navigate-view", {
			detail: { id: "check" },
		}),
	);
};
