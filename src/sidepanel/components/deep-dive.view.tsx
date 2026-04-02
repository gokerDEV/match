import { RadarIcon, RefreshCwIcon } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HeatmapRow } from "@/components/common/heatmap.row";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Extractions } from "@/lib/types/engine";
import type {
	GET_CACHED_EXTRACTIONS_MESSAGE,
	GET_CACHED_EXTRACTIONS_RESPONSE,
	RUN_DEEP_DIVE_MESSAGE,
	RUN_DEEP_DIVE_RESPONSE,
} from "@/services/messaging";
import { getLinkItems } from "./extraction-panels/helpers";

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

interface DeepDiveResult {
	url: string;
	scores: number[];
	error?: string;
}

export const DeepDiveView: React.FC = () => {
	const [tabUrl, setTabUrl] = useState<string>("");
	const [internalLinks, setInternalLinks] = useState<string[]>([]);
	const [results, setResults] = useState<DeepDiveResult[]>([]);
	const [loadingLinks, setLoadingLinks] = useState(false);
	const [running, setRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadInternalLinks = useCallback(async () => {
		setLoadingLinks(true);
		setError(null);
		try {
			const tab = await fetchActiveTab();
			if (!tab) {
				throw new Error("No active tab found.");
			}
			setTabUrl(tab.url);

			const extracted = await getCachedExtractions(tab.url);
			if (!extracted) {
				throw new Error(
					"No cached extraction found. Please run a MATCH check first.",
				);
			}

			const links = getLinkItems(extracted.internalLinks).map(
				(link) => link.href,
			);
			setInternalLinks(links);
			setResults([]);
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

	const canStart = useMemo(
		() => internalLinks.length > 0 && !running && !loadingLinks,
		[internalLinks.length, running, loadingLinks],
	);

	const handleStart = async () => {
		if (!canStart) return;
		setRunning(true);
		setError(null);
		setResults([]);

		try {
			const response = await chrome.runtime.sendMessage<
				RUN_DEEP_DIVE_MESSAGE,
				RUN_DEEP_DIVE_RESPONSE
			>({
				type: "RUN_DEEP_DIVE",
				payload: {
					links: internalLinks,
				},
			});

			if (!response?.success || !response.rows) {
				throw new Error(response?.error || "Failed to complete deep-dive.");
			}

			setResults(
				response.rows.map((row) => ({
					url: row.url,
					scores:
						Array.isArray(row.scores) && row.scores.length === 5
							? row.scores
							: [0, 0, 0, 0, 0],
					error: row.error,
				})),
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Deep-dive failed.");
		} finally {
			setRunning(false);
		}
	};

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="m-4 flex items-start justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold text-sm">Deep Dive</h2>
					<p className="text-muted-foreground text-xs">
						Internal link MATCH scores
					</p>
					{tabUrl && (
						<p className="max-w-[320px] truncate text-[10px] text-muted-foreground">
							{tabUrl}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
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
						<RadarIcon className={`size-3 ${running ? "animate-pulse" : ""}`} />
						<span className="text-xs">{running ? "Running..." : "Start"}</span>
					</Button>
				</div>
			</div>

			<div className="mx-4 rounded-md border bg-muted/40 px-3 py-2">
				<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
					Internal Links
				</p>
				<p className="font-medium text-xs">{internalLinks.length}</p>
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
							Click Start to run MATCH on internal links.
						</p>
					)}

					{results.map((row, index) => (
						<div key={row.url} className="rounded border bg-card p-2">
							<p className="text-[10px] text-muted-foreground">#{index + 1}</p>
							<p className="break-all font-medium text-xs">{row.url}</p>
							<div className="mt-2">
								<HeatmapRow scores={row.scores} />
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
