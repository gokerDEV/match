import type React from "react";
import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { HeatmapRow, MATCH_COLUMNS } from "@/components/common/heatmap.row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateBatchReport } from "@/lib/report.utils";
import { cn } from "@/lib/utils";
import type {
	RUN_ANALYSIS_MESSAGE,
	RUN_ANALYSIS_RESPONSE,
} from "@/services/messaging";
import { LogViewer } from "./components/log.viewer";
import { MatchHeader } from "./components/match.header";

export const MatchDashboard: React.FC = () => {
	const { settings } = useSettings();
	const [searchTerm, setSearchTerm] = useState("");
	const [urls, setUrls] = useState(["", "", ""]);
	const [results, setResults] = useState<(RUN_ANALYSIS_RESPONSE | null)[]>([
		null,
		null,
		null,
	]);
	const [loadings, setLoadings] = useState<boolean[]>([false, false, false]);
	const [errors, setErrors] = useState<(string | null)[]>([null, null, null]);
	const [logs, setLogs] = useState<string[]>([]);

	const appendLog = (msg: string) => {
		if (!settings.logsEnabled) return;
		setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
	};

	useEffect(() => {
		if (typeof chrome !== "undefined" && chrome.storage) {
			chrome.storage.local.get("dashboard_sync", (res) => {
				const sync = res.dashboard_sync as
					| { searchTerm?: string; url?: string; scores?: number[] }
					| undefined;
				if (sync) {
					if (sync.searchTerm) setSearchTerm(sync.searchTerm);
					if (sync.url)
						setUrls((prev) => [sync.url as string, prev[1], prev[2]]);
					if (sync.scores)
						setResults((prev) => [
							{ success: true, scores: sync.scores as number[] }, // Partial mock for sync
							prev[1],
							prev[2],
						]);
					chrome.storage.local.remove("dashboard_sync");
				}
			});
		}
	}, []);

	const updateUrl = (index: number, val: string) => {
		const newUrls = [...urls];
		newUrls[index] = val;
		setUrls(newUrls);
	};

	const runAnalysis = async (index: number) => {
		const url = urls[index].trim();
		if (!url) return;

		setLoadings((prev) => {
			const n = [...prev];
			n[index] = true;
			return n;
		});
		setErrors((prev) => {
			const n = [...prev];
			n[index] = null;
			return n;
		});

		appendLog(`Starting analysis for URL ${index + 1}: ${url}`);

		try {
			if (typeof chrome === "undefined" || !chrome.tabs || !chrome.runtime) {
				throw new Error("Chrome APIs are not available.");
			}

			appendLog(`Creating isolated background tab for: ${url}`);
			const tab = await chrome.tabs.create({ url, active: false });
			if (!tab.id) throw new Error("Could not create tab");

			appendLog("Waiting for tab to finish loading...");
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

			// Small grace period for content script listener to register
			await new Promise((r) => setTimeout(r, 500));
			appendLog("Tab loaded, starting analysis...");

			const message: RUN_ANALYSIS_MESSAGE = {
				type: "RUN_ANALYSIS",
				payload: { searchTerm, tabId: tab.id, url },
			};

			appendLog("Sending analyze command to Background Service...");
			const response = await chrome.runtime.sendMessage<
				RUN_ANALYSIS_MESSAGE,
				RUN_ANALYSIS_RESPONSE
			>(message);

			if (response?.success && response.scores) {
				appendLog(`Success: Metrics calculated for ${url}`);
				if (response.logs) {
					response.logs.forEach((l) => {
						appendLog(`- ${l}`);
					});
				}
				setResults((prev) => {
					const n = [...prev];
					n[index] = response;
					return n;
				});
			} else {
				throw new Error(response?.error || `Analysis failed for ${url}`);
			}

			appendLog("Closing isolated tab...");
			await chrome.tabs.remove(tab.id);
			appendLog(`Completed analysis for URL ${index + 1}.`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Unknown error";
			console.error("Dashboard analysis error", error);
			appendLog(`ERROR on URL ${index + 1}: ${msg}`);
			setErrors((prev) => {
				const n = [...prev];
				n[index] = msg;
				return n;
			});
		} finally {
			setLoadings((prev) => {
				const n = [...prev];
				n[index] = false;
				return n;
			});
		}
	};

	const runAll = async () => {
		appendLog("Starting batch analysis...");
		for (let i = 0; i < urls.length; i++) {
			if (urls[i].trim() && !loadings[i]) {
				await runAnalysis(i);
			}
		}
		appendLog("Batch analysis finished.");
	};

	const isAnyLoading = loadings.some((l) => l);

	const handleDownload = () => {
		const validRuns = urls
			.map((_, i) => results[i])
			.filter((r) => r?.success && r.metrics && r.inputs)
			.map((r) => {
				if (!r || !r.inputs || !r.metrics) return null;
				return { inputs: r.inputs, metrics: r.metrics };
			})
			.filter((r) => r !== null);

		if (validRuns.length === 0) return;

		const batchReport = generateBatchReport(validRuns);

		const blob = new Blob([JSON.stringify(batchReport, null, 2)], {
			type: "application/json",
		});
		const urlObj = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = urlObj;
		a.download = `batch-report-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(urlObj);
	};

	const contextualColor = MATCH_COLUMNS.find((c) => c.letter === "C")?.ideal;

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-8">
			<div className="justify-between rounded-lg border bg-background p-4 shadow">
				<div className="grid grid-cols-[1fr_2fr] items-center gap-6 pr-4 pl-2">
					<div className="flex items-center justify-end">
						<Label
							htmlFor="search-input"
							className="font-semibold text-muted-foreground"
						>
							Search Term:
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<Input
							id="search-input"
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									runAll();
								}
							}}
							placeholder='e.g. "Modern Architecture"'
							className="w-full"
							style={{ borderColor: contextualColor }}
						/>

						<Button
							onClick={runAll}
							disabled={isAnyLoading}
							className="w-12 px-0"
						>
							{isAnyLoading ? "..." : "▶"}
						</Button>
					</div>
				</div>
			</div>

			<div className="flex flex-col rounded-lg border bg-background p-6 shadow">
				<MatchHeader />

				<div className="mt-4 flex flex-col gap-4">
					{urls.map((url, i) => {
						const result = results[i];
						return (
							<div
								key={["first", "second", "third"][i]}
								className="flex flex-col gap-2 rounded-md border bg-muted/30 p-2"
							>
								<div className="grid grid-cols-[1fr_2fr] items-center gap-6">
									<div className="flex gap-3">
										<Input
											type="url"
											value={url}
											onChange={(e) => updateUrl(i, e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													runAnalysis(i);
												}
											}}
											placeholder={`URL ${i + 1} (e.g. https://example.com)`}
											className={cn(
												"min-w-0 flex-1 ",
												contextualColor && `border-color-[${contextualColor}]`,
											)}
										/>
										<Button
											onClick={() => runAnalysis(i)}
											disabled={loadings[i] || !url.trim()}
											className="w-12 px-0"
										>
											{loadings[i] ? "..." : "▶"}
										</Button>
									</div>
									<div>
										<HeatmapRow
											scores={result?.scores || []}
											loading={loadings[i]}
										/>
									</div>
								</div>
								{errors[i] && (
									<div className="pl-2 text-destructive text-xs italic opacity-80">
										Error: {errors[i]}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			<div className="flex w-full items-center justify-between rounded-lg border bg-background p-4 shadow">
				<div className="flex items-center gap-4"></div>
				<Button
					variant="secondary"
					onClick={handleDownload}
					disabled={!results.some((r) => r?.success)}
				>
					Download Report
				</Button>
			</div>

			{/* Logs section — only shown when logging is enabled */}
			{settings.logsEnabled && <LogViewer logs={logs} />}
		</div>
	);
};
