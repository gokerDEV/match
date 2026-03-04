import type React from "react";
import { useEffect, useState } from "react";
import { HeatmapRow, MATCH_COLUMNS } from "@/components/common/heatmap.row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateReport } from "@/lib/report.utils";
import type { Inputs, Metrics } from "@/lib/types/engine";
import type {
	RUN_ANALYSIS_MESSAGE,
	RUN_ANALYSIS_RESPONSE,
} from "@/services/messaging";

export const Popup: React.FC = () => {
	const [url, setUrl] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [scores, setScores] = useState<number[] | null>(null);
	const [fullMetrics, setFullMetrics] = useState<Metrics | null>(null);
	const [fullInputs, setFullInputs] = useState<Inputs | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (typeof chrome !== "undefined" && chrome.tabs) {
			chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
				if (tabs[0]?.url) setUrl(tabs[0].url);
			});
		}
	}, []);

	const handleAnalyze = async (e?: React.FormEvent | React.MouseEvent) => {
		if (e) e.preventDefault();

		let isForce = false;
		if (e && "nativeEvent" in e && e.nativeEvent instanceof MouseEvent) {
			isForce = e.nativeEvent.ctrlKey || e.nativeEvent.metaKey;
		} else if (e && "ctrlKey" in e) {
			isForce =
				(e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey;
		}

		setIsAnalyzing(true);
		setError(null);
		setScores(null);
		try {
			if (typeof chrome === "undefined" || !chrome.tabs || !chrome.runtime) {
				throw new Error(
					"Chrome APIs are not available. Please run inside the extension popup.",
				);
			}

			const activeTabs = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			const activeTab = activeTabs[0];
			if (!activeTab?.id || !activeTab.url) {
				throw new Error("No active tab found");
			}

			const message: RUN_ANALYSIS_MESSAGE = {
				type: "RUN_ANALYSIS",
				payload: {
					searchTerm,
					tabId: activeTab.id,
					url: activeTab.url,
					force: isForce,
				},
			};

			const response = await chrome.runtime.sendMessage<
				RUN_ANALYSIS_MESSAGE,
				RUN_ANALYSIS_RESPONSE
			>(message);

			if (
				response?.success &&
				response.scores &&
				response.metrics &&
				response.inputs
			) {
				setScores(response.scores);
				setFullMetrics(response.metrics);
				setFullInputs(response.inputs);
			} else {
				throw new Error(
					response?.error ||
						"Analysis failed. Make sure the page has fully loaded and is a valid HTTP(s) URL.",
				);
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Unknown error occurred.");
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleDownload = () => {
		if (!scores || !fullMetrics || !fullInputs) return;
		const report = generateReport(fullInputs, fullMetrics);
		const blob = new Blob([JSON.stringify(report, null, 2)], {
			type: "application/json",
		});
		const blobUrl = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = blobUrl;
		a.download = `match-report-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(blobUrl);
	};

	return (
		<div className="flex h-full flex-col gap-4">
			<div className="mt-2 flex flex-col gap-2">
				<div className="grid grid-cols-5 gap-1 text-center font-bold text-[8px] text-muted-foreground uppercase tracking-wider">
					{MATCH_COLUMNS.map((col) => (
						<div
							key={col.letter}
							className="flex flex-col items-center justify-end gap-.5"
						>
							<span>{col.title}</span>
							<div
								className="flex h-5 w-full items-center justify-center rounded-sm font-extrabold text-sm text-white"
								style={{ backgroundColor: col.ideal }}
							>
								{col.title.charAt(0)}
							</div>
						</div>
					))}
				</div>
				<HeatmapRow scores={scores || []} loading={isAnalyzing} />
			</div>

			<form onSubmit={handleAnalyze} className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<Label htmlFor="url-input" className="text-muted-foreground text-xs">
						Active URL
					</Label>
					<Input
						id="url-input"
						type="text"
						readOnly
						value={url}
						className="bg-muted/50 text-xs"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Label
						htmlFor="search-input"
						className="text-muted-foreground text-xs"
					>
						Search Term Context{" "}
						<span className="font-normal opacity-70">(Optional)</span>
					</Label>
					<Input
						id="search-input"
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Enter keyword for relevancy check..."
						className="text-sm"
					/>
				</div>

				<Button
					type="submit"
					onClick={handleAnalyze}
					disabled={isAnalyzing || !url}
					className="w-full"
				>
					{isAnalyzing ? "Analyzing..." : "Start Analysis"}
				</Button>
			</form>

			{error && (
				<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-destructive text-xs leading-relaxed">
					<strong>Error:</strong> {error}
				</div>
			)}

			<div className="flex items-center justify-between border-t pt-2 text-xs">
				<Button
					size="xs"
					onClick={() => {
						chrome.storage.local.set(
							{
								dashboard_sync: {
									url,
									searchTerm,
									scores,
								},
							},
							() => {
								window.open(chrome.runtime.getURL("app.html"), "_blank");
							},
						);
					}}
				>
					Open Dashboard
				</Button>
				<Button
					variant="outline"
					size="xs"
					disabled={!scores}
					onClick={handleDownload}
				>
					Download JSON
				</Button>
			</div>
		</div>
	);
};
