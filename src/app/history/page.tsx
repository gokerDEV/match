import { Download, Loader2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HeatmapRow } from "@/components/common/heatmap.row";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type {
	RUN_ANALYSIS_MESSAGE,
	RUN_ANALYSIS_RESPONSE,
} from "@/services/messaging";
import { historyService, type MatchHistoryItem } from "@/services/storage";
import { MatchHeader } from "../dashboard/components/match.header";

export function HistoryPage() {
	const [history, setHistory] = useState<MatchHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [rerunning, setRerunning] = useState<string | null>(null); // item id being re-run
	const [deleting, setDeleting] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const data = await historyService.getHistory();
			setHistory(data);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleDelete = async (id: string) => {
		setDeleting(id);
		try {
			await historyService.deleteHistoryItem(id);
			setHistory((prev) => prev.filter((h) => h.id !== id));
		} finally {
			setDeleting(null);
		}
	};

	const handleForceRerun = async (item: MatchHistoryItem) => {
		setRerunning(item.id);
		try {
			if (typeof chrome === "undefined" || !chrome.tabs || !chrome.runtime) {
				throw new Error("Chrome APIs are not available.");
			}

			// Open the URL in a hidden background tab
			const tab = await chrome.tabs.create({ url: item.url, active: false });
			if (!tab.id) throw new Error("Could not create tab");

			// Wait for tab to finish loading (max 30s)
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					chrome.tabs.onUpdated.removeListener(listener);
					reject(new Error("Tab load timed out after 30s"));
				}, 30_000);

				const listener = (tabId: number, info: { status?: string }) => {
					if (tabId === tab.id && info.status === "complete") {
						clearTimeout(timeout);
						chrome.tabs.onUpdated.removeListener(listener);
						resolve();
					}
				};
				chrome.tabs.onUpdated.addListener(listener);
			});

			// Grace period for content script listener to register
			await new Promise((r) => setTimeout(r, 500));

			const message: RUN_ANALYSIS_MESSAGE = {
				type: "RUN_ANALYSIS",
				payload: {
					searchTerm: item.searchTerm,
					tabId: tab.id,
					url: item.url,
					force: true,
				},
			};

			const response = await chrome.runtime.sendMessage<
				RUN_ANALYSIS_MESSAGE,
				RUN_ANALYSIS_RESPONSE
			>(message);

			await chrome.tabs.remove(tab.id);

			if (response?.success && response.scores) {
				// Update the row in-place optimistically
				setHistory((prev) =>
					prev.map((h) =>
						h.id === item.id
							? {
								...h,
								scores: response.scores as number[],
								timestamp: Date.now(),
							}
							: h,
					),
				);
				// Reload from storage to reflect deduplicated upsert
				await loadData();
			} else {
				throw new Error(response?.error ?? "Re-analysis failed.");
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Unknown error";
			toast.error(`Re-run failed: ${msg}`);
		} finally {
			setRerunning(null);
		}
	};

	const handleClear = async () => {
		await historyService.clearHistory();
		toast.success("History cleared successfully.");
		loadData();
	};

	const handleExport = async () => {
		const json = JSON.stringify(history, null, 2);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		chrome.downloads.download({
			url,
			filename: `match-history-export-${Date.now()}.json`,
			saveAs: true,
		});
	};

	if (loading) {
		return (
			<div className="flex w-full items-center justify-center p-10 text-muted-foreground">
				Loading history...
			</div>
		);
	}

	return (
		<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 p-8">
			{/* Top Bar */}
			<div className="flex w-full items-center justify-between rounded-lg border bg-background p-4 shadow">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<h1 className="bg-gradient-to-tr from-foreground to-muted-foreground bg-clip-text font-bold text-2xl text-transparent tracking-tight">
							HISTORY
						</h1>
						{history.length > 0 && (
							<span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
								{history.length}
							</span>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={loadData}
						title="Refresh"
					>
						<RefreshCw className="h-4 w-4" />
					</Button>
					<Button variant="outline" onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" /> Export JSON
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive">
								<Trash2 className="mr-2 h-4 w-4" /> Clear History
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete all your analysis history. This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleClear}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Clear History
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			{/* List Wrapper */}
			<div className="flex flex-col rounded-lg border bg-background p-6 shadow">
				<MatchHeader />

				{history.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
						<p>No history yet. Start analyzing some URLs!</p>
					</div>
				) : (
					<div className="mt-4 flex flex-col gap-3">
						{history.map((item) => (
							<div
								key={item.id}
								className="relative grid grid-cols-[1fr_2fr_auto] items-center rounded-md border bg-muted/30 pl-4 py-1.5 pr-2"
							>
								{/* Meta */}
								<div className="flex max-w-[360px] flex-col gap-1 truncate px-2">
									<div className="flex text-[10px] text-muted-foreground">
										{new Date(item.timestamp).toLocaleString()}
									</div>
									<div className="truncate font-semibold text-foreground text-sm">
										{item.url}
									</div>
									<div className="max-w-full truncate font-medium text-primary text-sm">
										{item.searchTerm || (
											<span className="font-normal text-muted-foreground italic">
												No search term
											</span>
										)}
									</div>
								</div>

								{/* Scores */}
								<div>
									<HeatmapRow scores={item.scores} />
								</div>

								{/* Actions */}
								<div className="absolute -right-6 top-4 flex items-center flex-col gap-1 pr-1">
									<Button
										variant="ghost"
										size="icon"
										title="Force re-run analysis (bypasses cache)"
										disabled={rerunning === item.id || deleting === item.id}
										onClick={() => handleForceRerun(item)}
										className="h-5 w-5 text-muted-foreground hover:text-foreground border border-l-0 rounded-l-none bg-background"
									>
										{rerunning === item.id ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : (
											<RotateCcw className="h-3.5 w-3.5" />
										)}
									</Button>
									<Button
										variant="ghost"
										size="icon"
										title="Delete this entry"
										disabled={deleting === item.id || rerunning === item.id}
										onClick={() => handleDelete(item.id)}
										className="h-5 w-5 text-muted-foreground hover:text-destructive  border border-l-0 rounded-l-none bg-background"
									>
										{deleting === item.id ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : (
											<Trash2 className="h-3.5 w-3.5" />
										)}
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
