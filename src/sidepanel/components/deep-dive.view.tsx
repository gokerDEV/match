import { PauseIcon, PlayIcon, RadarIcon, RefreshCwIcon } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HeatmapRow } from "@/components/common/heatmap.row";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
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
import { getLinkItems } from "./extraction-panels/helpers";

const SESSION_TAB_KEY = "match_last_tab_id";

interface LinkInput {
	href: string;
	text: string;
}

interface PreparedLink {
	href: string;
	text: string;
	normalizedHref: string;
}

interface DeepDiveResult {
	url: string;
	searchTerm: string;
	scores: number[] | null;
	error?: string;
	status: "pending" | "done" | "error";
}

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

export const DeepDiveView: React.FC = () => {
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
					href: link.href,
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
		if (!running) {
			setResults(toPendingRows(preparedLinks));
		}
	}, [preparedLinks, running]);

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

	const canStart = useMemo(
		() => preparedLinks.length > 0 && !running && !loadingLinks && !!tabId,
		[preparedLinks.length, running, loadingLinks, tabId],
	);

	const handleStart = async () => {
		if (!canStart || !tabId) return;
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
	};

	const togglePause = async () => {
		if (!running) return;

		try {
			if (paused) {
				const response = await chrome.runtime.sendMessage<
					RESUME_DEEP_DIVE_MESSAGE,
					DEEP_DIVE_CONTROL_RESPONSE
				>({
					type: "RESUME_DEEP_DIVE",
				});
				if (!response?.success) {
					throw new Error(response?.error || "Resume failed.");
				}
				setPaused(false);
				return;
			}

			const response = await chrome.runtime.sendMessage<
				PAUSE_DEEP_DIVE_MESSAGE,
				DEEP_DIVE_CONTROL_RESPONSE
			>({
				type: "PAUSE_DEEP_DIVE",
			});
			if (!response?.success) {
				throw new Error(response?.error || "Pause failed.");
			}
			setPaused(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to toggle pause.");
		}
	};

	const completedCount = useMemo(
		() =>
			results.filter((row) => row.status === "done" || row.status === "error")
				.length,
		[results],
	);

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="m-4 flex items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<h2 className="font-semibold text-sm">Deep Dive</h2>
					<p className="text-muted-foreground text-xs">
						Internal link MATCH scores (live)
					</p>
					{tabUrl && (
						<p className="truncate text-[10px] text-muted-foreground">
							{tabUrl}
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={loadInternalLinks}
						disabled={loadingLinks || running}
						className="h-8 gap-1"
					>
						<RefreshCwIcon
							className={`size-3 ${loadingLinks ? "animate-spin" : ""}`}
						/>
						<span className="text-xs">Refresh</span>
					</Button>
					<Button
						size="sm"
						onClick={handleStart}
						disabled={!canStart}
						className="h-8 gap-1"
					>
						<RadarIcon className="size-3" />
						<span className="text-xs">Start</span>
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={togglePause}
						disabled={!running}
						className="h-8 gap-1"
					>
						{paused ? (
							<PlayIcon className="size-3" />
						) : (
							<PauseIcon className="size-3" />
						)}
						<span className="text-xs">{paused ? "Resume" : "Pause"}</span>
					</Button>
				</div>
			</div>

			<div className="mx-4 rounded-md border bg-muted/40 px-3 py-2">
				<div className="flex items-center justify-between gap-2">
					<div className="text-xs">
						<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
							Links
						</p>
						<p className="font-medium">
							Raw: {rawInternalLinks.length} | Ready: {preparedLinks.length}
						</p>
						<p className="text-[10px] text-muted-foreground">
							Anchors removed, URLs normalized before test.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-[10px] text-muted-foreground">
							Remove duplicate links
						</span>
						<Switch
							checked={removeDuplicateLinks}
							onCheckedChange={setRemoveDuplicateLinks}
							disabled={running}
						/>
					</div>
				</div>
			</div>

			<div className="mx-4 mt-3 rounded-md border bg-card px-3 py-2">
				<p className="text-xs">
					Completed: {completedCount}/{results.length}
					{running ? (paused ? " (Paused)" : " (Running)") : ""}
				</p>
			</div>

			{error && (
				<div className="mx-4 mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
					<p className="text-destructive text-xs">{error}</p>
				</div>
			)}

			<ScrollArea className="mt-3 overflow-y-auto">
				<div className="flex flex-col gap-2 p-4">
					{results.length === 0 && !running && (
						<p className="text-muted-foreground text-xs">
							No internal links ready.
						</p>
					)}

					{results.map((row, index) => (
						<div
							key={`${row.url}-${index}`}
							className="rounded border bg-card p-2"
						>
							<div className="flex items-center justify-between gap-2">
								<p className="text-[10px] text-muted-foreground">
									#{index + 1}
								</p>
								<p className="text-[10px] text-muted-foreground uppercase">
									{row.status}
								</p>
							</div>
							<p className="break-all font-medium text-xs">{row.url}</p>
							<p className="mt-1 truncate text-[10px] text-muted-foreground">
								Search term: {row.searchTerm || "(empty)"}
							</p>
							<div className="mt-2">
								<HeatmapRow scores={row.scores ?? []} />
							</div>
							{row.error && (
								<p className="mt-2 text-[10px] text-destructive">{row.error}</p>
							)}
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
};
