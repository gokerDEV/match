import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/sidepanel/components/deep-dive/types";
import { getLinkItems } from "@/sidepanel/components/extraction-panels/helpers";

const SESSION_TAB_KEY = "match_last_tab_id";

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

export const useDeepDive = () => {
	const [tabUrl, setTabUrl] = useState<string>("");
	const [tabId, setTabId] = useState<number | null>(null);
	const [rawInternalLinks, setRawInternalLinks] = useState<LinkInput[]>([]);
	const [results, setResults] = useState<DeepDiveResult[]>([]);
	const [loadingLinks, setLoadingLinks] = useState(false);
	const [running, setRunning] = useState(false);
	const [paused, setPaused] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [removeDuplicateLinks, setRemoveDuplicateLinks] = useState(true);

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
		loadInternalLinks().then();
	}, [loadInternalLinks]);

	useEffect(() => {
		setResults(toPendingRows(preparedLinks));
	}, [preparedLinks]);

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
			(running || (preparedLinks.length > 0 && !loadingLinks && !!tabId)) &&
			!loadingLinks,
		[running, preparedLinks.length, loadingLinks, tabId],
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

		if (!tabId || preparedLinks.length === 0) return;

		setRunning(true);
		setPaused(false);
		setError(null);
		setResults(toPendingRows(preparedLinks));

		try {
			const response = await chrome.runtime.sendMessage<
				RUN_DEEP_DIVE_MESSAGE,
				RUN_DEEP_DIVE_RESPONSE
			>({
				type: "RUN_DEEP_DIVE",
				payload: {
					tabId,
					links: preparedLinks.map((link) => ({
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
	}, [paused, preparedLinks, running, tabId]);

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

	return {
		tabUrl,
		results,
		error,
		running,
		paused,
		removeDuplicateLinks,
		setRemoveDuplicateLinks,
		rawLinksCount: rawInternalLinks.length,
		readyLinksCount: preparedLinks.length,
		completedCount,
		totalCount: results.length,
		progressValue,
		canPrimaryAction,
		handlePrimaryAction,
	};
};
