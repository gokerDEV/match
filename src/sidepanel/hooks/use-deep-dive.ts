import { useCallback, useEffect, useMemo, useState } from "react";
import { hydrateAndOpenCheckView } from "@/lib/check-view.helpers";
import { metricDescriptions } from "@/lib/engine/plan";
import { getLinkItems } from "@/lib/extraction.helpers";
import type { Extractions } from "@/lib/types/engine";
import type {
	DEEP_DIVE_COMPLETE_MESSAGE,
	DEEP_DIVE_CONTROL_RESPONSE,
	DEEP_DIVE_PROGRESS_MESSAGE,
	GET_CACHED_EXTRACTIONS_MESSAGE,
	GET_CACHED_EXTRACTIONS_RESPONSE,
	PAUSE_DEEP_DIVE_MESSAGE,
	RESUME_DEEP_DIVE_MESSAGE,
	RUN_DEEP_DIVE_MESSAGE,
	RUN_DEEP_DIVE_RESPONSE,
} from "@/services/messaging";
import type {
	DeepDiveResult,
	LinkInput,
	PreparedLink,
} from "@/sidepanel/types";

const SESSION_TAB_KEY = "match_last_tab_id";
const DEFAULT_DEEP_DIVE_MAX_LINKS = 100;

interface DeepDiveCacheState {
	initialized: boolean;
	tabUrl: string;
	tabId: number | null;
	rawInternalLinks: LinkInput[];
	results: DeepDiveResult[];
	loadingLinks: boolean;
	running: boolean;
	paused: boolean;
	error: string | null;
	jobId: string | null;
	removeDuplicateLinks: boolean;
}

let deepDiveCache: DeepDiveCacheState = {
	initialized: false,
	tabUrl: "",
	tabId: null,
	rawInternalLinks: [],
	results: [],
	loadingLinks: false,
	running: false,
	paused: false,
	error: null,
	jobId: null,
	removeDuplicateLinks: true,
};

const fetchActiveTab = async (): Promise<{
	tabId: number;
	url: string;
} | null> => {
	try {
		const result = await chrome.storage.session.get(SESSION_TAB_KEY);
		const tabId = result[SESSION_TAB_KEY];
		if (typeof tabId !== "number") return null;
		const tab = await chrome.tabs.get(tabId);
		if (tab?.id && tab.url) return { tabId: tab.id, url: tab.url };
		return null;
	} catch {
		return null;
	}
};

const getCachedExtractions = async (
	url: string,
): Promise<Extractions | null> => {
	try {
		const response = await chrome.runtime.sendMessage<
			GET_CACHED_EXTRACTIONS_MESSAGE,
			GET_CACHED_EXTRACTIONS_RESPONSE
		>({
			type: "GET_CACHED_EXTRACTIONS",
			payload: { url },
		});
		if (response?.success && response.data) {
			return response.data;
		}
		return null;
	} catch {
		return null;
	}
};

const normalizeLink = (href: string): string | null => {
	try {
		const parsed = new URL(href);
		if (!/^https?:$/i.test(parsed.protocol)) return null;
		parsed.hash = "";
		if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
			parsed.pathname = parsed.pathname.replace(/\/+$/, "");
		}
		return parsed.toString();
	} catch {
		return null;
	}
};

const toPendingRows = (links: PreparedLink[]): DeepDiveResult[] =>
	links.map((link) => ({
		url: link.normalizedHref,
		searchTerm: link.text,
		scores: null,
		status: "pending",
	}));

const waitForTabComplete = async (
	tabId: number,
	timeoutMs = 20000,
): Promise<void> => {
	const tab = await chrome.tabs.get(tabId);
	if (tab.status === "complete") return;

	await new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			chrome.tabs.onUpdated.removeListener(onUpdated);
			reject(new Error("Timed out waiting for navigation to complete."));
		}, timeoutMs);

		const onUpdated = (
			updatedTabId: number,
			changeInfo: { status?: string },
		) => {
			if (updatedTabId !== tabId) return;
			if (changeInfo.status !== "complete") return;
			clearTimeout(timeout);
			chrome.tabs.onUpdated.removeListener(onUpdated);
			resolve();
		};

		chrome.tabs.onUpdated.addListener(onUpdated);
	});
};

export const useDeepDive = () => {
	const [tabUrl, setTabUrl] = useState<string>(() => deepDiveCache.tabUrl);
	const [tabId, setTabId] = useState<number | null>(() => deepDiveCache.tabId);
	const [rawInternalLinks, setRawInternalLinks] = useState<LinkInput[]>(
		() => deepDiveCache.rawInternalLinks,
	);
	const [results, setResults] = useState<DeepDiveResult[]>(
		() => deepDiveCache.results,
	);
	const [loadingLinks, setLoadingLinks] = useState(
		() => deepDiveCache.loadingLinks,
	);
	const [running, setRunning] = useState(() => deepDiveCache.running);
	const [paused, setPaused] = useState(() => deepDiveCache.paused);
	const [error, setError] = useState<string | null>(() => deepDiveCache.error);
	const [jobId, setJobId] = useState<string | null>(() => deepDiveCache.jobId);
	const [removeDuplicateLinks, setRemoveDuplicateLinks] = useState(
		() => deepDiveCache.removeDuplicateLinks,
	);
	const [exportingResults, setExportingResults] = useState(false);
	const [exportingExtractions, setExportingExtractions] = useState(false);

	const preparedLinks = useMemo<PreparedLink[]>(() => {
		const normalized = rawInternalLinks
			.map((link) => {
				const normalizedHref = normalizeLink(link.href);
				if (!normalizedHref) return null;
				return {
					text: link.text,
					normalizedHref,
				};
			})
			.filter((link): link is PreparedLink => link !== null);

		if (!removeDuplicateLinks) return normalized;

		const seen = new Set<string>();
		const unique: PreparedLink[] = [];
		for (const link of normalized) {
			if (seen.has(link.normalizedHref)) continue;
			seen.add(link.normalizedHref);
			unique.push(link);
		}
		return unique;
	}, [rawInternalLinks, removeDuplicateLinks]);
	const limitedPreparedLinks = useMemo(
		() => preparedLinks.slice(0, DEFAULT_DEEP_DIVE_MAX_LINKS),
		[preparedLinks],
	);

	const loadInternalLinks = useCallback(async () => {
		setLoadingLinks(true);
		setError(null);
		try {
			const activeTab = await fetchActiveTab();
			if (!activeTab) {
				throw new Error("No active tab found.");
			}
			setTabUrl(activeTab.url);
			setTabId(activeTab.tabId);

			const extracted = await getCachedExtractions(activeTab.url);
			if (!extracted) {
				throw new Error(
					"No cached extraction found. Please run a MATCH check first.",
				);
			}

			setRawInternalLinks(getLinkItems(extracted.internalLinks));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load internal links.",
			);
		} finally {
			setLoadingLinks(false);
		}
	}, []);

	useEffect(() => {
		if (deepDiveCache.initialized) return;
		deepDiveCache.initialized = true;
		loadInternalLinks().then();
	}, [loadInternalLinks]);

	useEffect(() => {
		if (results.length > 0 || running) return;
		if (limitedPreparedLinks.length === 0) return;
		setResults(toPendingRows(limitedPreparedLinks));
	}, [limitedPreparedLinks, results.length, running]);

	useEffect(() => {
		const listener = (
			message: DEEP_DIVE_PROGRESS_MESSAGE | DEEP_DIVE_COMPLETE_MESSAGE,
		) => {
			if (message.type === "DEEP_DIVE_PROGRESS") {
				if (!jobId || message.payload.jobId !== jobId) return;
				setResults((prev) => {
					if (
						message.payload.index < 0 ||
						message.payload.index >= prev.length
					) {
						return prev;
					}
					const next = [...prev];
					next[message.payload.index] = {
						url: message.payload.url,
						searchTerm: message.payload.searchTerm,
						scores: Array.isArray(message.payload.scores)
							? message.payload.scores
							: null,
						inputs: message.payload.inputs,
						metrics: message.payload.metrics,
						error: message.payload.error,
						status: message.payload.error ? "error" : "done",
					};
					return next;
				});
				return;
			}

			if (message.type === "DEEP_DIVE_COMPLETE") {
				if (!jobId || message.payload.jobId !== jobId) return;
				setRunning(false);
				setPaused(false);
				setJobId(null);
			}
		};

		chrome.runtime.onMessage.addListener(listener);
		return () => {
			chrome.runtime.onMessage.removeListener(listener);
		};
	}, [jobId]);

	const canPrimaryAction = useMemo(
		() =>
			(running ||
				(limitedPreparedLinks.length > 0 && !loadingLinks && !!tabId)) &&
			!loadingLinks,
		[running, limitedPreparedLinks.length, loadingLinks, tabId],
	);

	const handlePrimaryAction = useCallback(async () => {
		if (running) {
			try {
				if (paused) {
					const resumeResponse = await chrome.runtime.sendMessage<
						RESUME_DEEP_DIVE_MESSAGE,
						DEEP_DIVE_CONTROL_RESPONSE
					>({
						type: "RESUME_DEEP_DIVE",
					});
					if (!resumeResponse?.success) {
						throw new Error(resumeResponse?.error || "Resume failed.");
					}
					setPaused(false);
					return;
				}

				const pauseResponse = await chrome.runtime.sendMessage<
					PAUSE_DEEP_DIVE_MESSAGE,
					DEEP_DIVE_CONTROL_RESPONSE
				>({
					type: "PAUSE_DEEP_DIVE",
				});
				if (!pauseResponse?.success) {
					throw new Error(pauseResponse?.error || "Pause failed.");
				}
				setPaused(true);
				return;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to toggle pause.",
				);
				return;
			}
		}

		if (!tabId || limitedPreparedLinks.length === 0) return;

		setRunning(true);
		setPaused(false);
		setError(null);
		setResults(toPendingRows(limitedPreparedLinks));

		try {
			const response = await chrome.runtime.sendMessage<
				RUN_DEEP_DIVE_MESSAGE,
				RUN_DEEP_DIVE_RESPONSE
			>({
				type: "RUN_DEEP_DIVE",
				payload: {
					tabId,
					links: limitedPreparedLinks.map((link) => ({
						href: link.normalizedHref,
						text: link.text,
					})),
				},
			});

			if (!response?.success || !response.jobId) {
				throw new Error(response?.error || "Failed to start deep-dive.");
			}
			setJobId(response.jobId);
		} catch (err) {
			setRunning(false);
			setPaused(false);
			setError(err instanceof Error ? err.message : "Deep-dive failed.");
		}
	}, [limitedPreparedLinks, paused, running, tabId]);

	const openRowInCheck = useCallback(async (row: DeepDiveResult) => {
		if (row.status !== "done") return;
		try {
			setError(null);
			const activeTab = await fetchActiveTab();
			if (!activeTab) {
				throw new Error("No active tab found.");
			}

			await chrome.tabs.update(activeTab.tabId, { url: row.url });
			await waitForTabComplete(activeTab.tabId);

			await hydrateAndOpenCheckView({
				tabId: activeTab.tabId,
				url: row.url,
				searchTerm: row.searchTerm,
			});
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to open row in Check view.",
			);
		}
	}, []);

	const completedCount = useMemo(
		() =>
			results.filter((row) => row.status === "done" || row.status === "error")
				.length,
		[results],
	);

	const progressValue = useMemo(() => {
		if (results.length === 0) return 0;
		return Math.round((completedCount / results.length) * 100);
	}, [completedCount, results.length]);

	const handleDownloadResults = useCallback(async () => {
		try {
			setExportingResults(true);
			const report = {
				description:
					"Deep Dive MATCH report. Each result item includes inputs and metrics for one internal link.",
				metricDescriptions,
				results: results.map((row) => ({
					inputs: row.inputs ?? {
						url: row.url,
						searchTerm: row.searchTerm,
						timestamp: 0,
					},
					metrics: row.metrics ?? {},
					scores: row.scores ?? [],
					status: row.status,
					error: row.error,
				})),
			};
			const json = JSON.stringify(report, null, 2);
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			await chrome.downloads.download({
				url,
				filename: `match-deep-dive-results-${Date.now()}.json`,
				saveAs: true,
			});
			URL.revokeObjectURL(url);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to export deep-dive results.",
			);
		} finally {
			setExportingResults(false);
		}
	}, [results]);

	const handleDownloadExtractions = useCallback(async () => {
		try {
			setExportingExtractions(true);
			const payload = await Promise.all(
				results.map(async (row) => ({
					url: row.url,
					searchTerm: row.searchTerm,
					status: row.status,
					scores: row.scores,
					error: row.error,
					extractions: await getCachedExtractions(row.url),
				})),
			);

			const json = JSON.stringify(payload, null, 2);
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			await chrome.downloads.download({
				url,
				filename: `match-deep-dive-extractions-${Date.now()}.json`,
				saveAs: true,
			});
			URL.revokeObjectURL(url);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to export deep-dive extractions.",
			);
		} finally {
			setExportingExtractions(false);
		}
	}, [results]);

	useEffect(() => {
		deepDiveCache = {
			initialized: true,
			tabUrl,
			tabId,
			rawInternalLinks,
			results,
			loadingLinks,
			running,
			paused,
			error,
			jobId,
			removeDuplicateLinks,
		};
	}, [
		tabUrl,
		tabId,
		rawInternalLinks,
		results,
		loadingLinks,
		running,
		paused,
		error,
		jobId,
		removeDuplicateLinks,
	]);

	return {
		tabUrl,
		results,
		error,
		loadingLinks,
		running,
		paused,
		removeDuplicateLinks,
		setRemoveDuplicateLinks,
		rawLinksCount: rawInternalLinks.length,
		readyLinksCount: limitedPreparedLinks.length,
		maxLinks: DEFAULT_DEEP_DIVE_MAX_LINKS,
		completedCount,
		totalCount: results.length,
		progressValue,
		canPrimaryAction,
		handlePrimaryAction,
		openRowInCheck,
		exportingResults,
		exportingExtractions,
		handleDownloadResults,
		handleDownloadExtractions,
		refresh: loadInternalLinks,
	};
};
