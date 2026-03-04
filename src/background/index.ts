import { runMetrics } from "@/lib/engine/plan";
import type { Extractions, Inputs } from "@/lib/types/engine";
import type {
	EXTRACT_SIGNALS_MESSAGE,
	EXTRACT_SIGNALS_RESPONSE,
	RUN_ANALYSIS_MESSAGE,
	RUN_ANALYSIS_RESPONSE,
} from "@/services/messaging";
import { historyService, settingsService, storage } from "@/services/storage";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Send EXTRACT_SIGNALS to the tab. If the content script is missing,
 *  inject it programmatically and retry once. */
async function extractFromTab(
	tabId: number,
): Promise<EXTRACT_SIGNALS_RESPONSE> {
	const send = () =>
		chrome.tabs.sendMessage<EXTRACT_SIGNALS_MESSAGE, EXTRACT_SIGNALS_RESPONSE>(
			tabId,
			{ type: "EXTRACT_SIGNALS" },
		);

	try {
		return await send();
	} catch {
		// Content script not present in this tab.
		// Dynamically inject the correct hashed content script from the manifest.
		const manifest = chrome.runtime.getManifest();
		const scriptFile = manifest.content_scripts?.[0]?.js?.[0];

		if (!scriptFile) {
			throw new Error("Could not find content script in manifest to inject.");
		}

		console.warn("[MATCH] Content script missing, injecting into tab", tabId);
		try {
			await chrome.scripting.executeScript({
				target: { tabId },
				files: [scriptFile],
			});
		} catch (injectErr) {
			throw new Error(
				`Cannot inject content script (restricted page?): ${injectErr instanceof Error ? injectErr.message : injectErr}`,
			);
		}

		// Give the script time to register its message listener
		await new Promise((r) => setTimeout(r, 500));
		try {
			return await send();
		} catch (retryErr) {
			throw new Error(
				`Content script injected but still unreachable: ${retryErr instanceof Error ? retryErr.message : retryErr}`,
			);
		}
	}
}

// ── Message Listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
	(message: RUN_ANALYSIS_MESSAGE, _sender, sendResponse) => {
		if (message.type !== "RUN_ANALYSIS") return;

		(async () => {
			try {
				const settings = await settingsService.getSettings();
				const { logsEnabled } = settings;

				let targetTabId = message.payload.tabId;
				let url = message.payload.url;

				if (!targetTabId || !url) {
					const tabs = await chrome.tabs.query({
						active: true,
						currentWindow: true,
					});
					const activeTab = tabs[0];
					if (!activeTab?.id || !activeTab.url) {
						throw new Error("No active tab found");
					}
					targetTabId = activeTab.id;
					url = activeTab.url;
				}

				const searchTerm = message.payload.searchTerm || "";
				const urlHash = storage.hash(url);

				const force = message.payload.force === true;
				let extractions = force
					? null
					: await storage.get<Extractions>(`ext_${urlHash}`);

				let extractionDebug: string[] = [];
				if (!extractions) {
					const response = await extractFromTab(targetTabId);

					if (!response?.success || !response.data) {
						throw new Error(
							response?.error ?? "Failed to extract signals from page.",
						);
					}

					extractionDebug = response.debug ?? [];
					if (logsEnabled && extractionDebug.length) {
						console.group("[MATCH] Extraction Debug");
						for (const line of extractionDebug) console.log(line);
						console.groupEnd();
					}

					extractions = response.data;
					await storage.set(`ext_${urlHash}`, extractions);
				}

				const inputs: Inputs = {
					url,
					searchTerm,
					timestamp: Date.now(),
				};

				const { metrics: metricsMap, logs } = await runMetrics(
					extractions,
					inputs,
				);
				const allLogs = [...extractionDebug, ...logs];

				const finalScores = [
					metricsMap.metadata_precision?.normalized ?? 0,
					metricsMap.access_quality?.normalized ?? 0,
					metricsMap.technical_hygiene?.normalized ?? 0,
					metricsMap.contextual_relevancy?.normalized ?? 0,
					metricsMap.hierarchy_integrity?.normalized ?? 0,
				];

				await historyService.addHistory(
					{
						id:
							Date.now().toString(36) + Math.random().toString(36).substring(2),
						url,
						searchTerm,
						timestamp: Date.now(),
						scores: finalScores,
					},
					settings.historyLimit,
				);

				await historyService.trimCache(settings.cacheLimit);

				sendResponse({
					success: true,
					scores: finalScores,
					metrics: metricsMap,
					inputs,
					logs: logsEnabled ? allLogs : [],
				} as RUN_ANALYSIS_RESPONSE);
			} catch (err: unknown) {
				console.error("[MATCH] Analysis failed:", err);
				sendResponse({
					success: false,
					error: err instanceof Error ? err.message : "Analysis failed",
				} as RUN_ANALYSIS_RESPONSE);
			}
		})();

		return true; // keep channel open for async response
	},
);
