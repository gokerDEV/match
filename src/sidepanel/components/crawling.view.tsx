import {
	ArrowLeftIcon,
	DownloadIcon,
	FileSpreadsheetIcon,
	PlayIcon,
} from "lucide-react";
import type React from "react";
import { HeatmapRow } from "@/components/common/heatmap.row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrawling } from "@/sidepanel/hooks/use-crawling";

export const CrawlingView: React.FC = () => {
	const {
		fileName,
		batchSize,
		sleepMs,
		batches,
		activeBatch,
		selectedBatchIndex,
		running,
		error,
		totalCount,
		completedCount,
		progressValue,
		setSleepMs,
		reBatch,
		handleFile,
		start,
		setSelectedBatchIndex,
		downloadBatchScores,
		downloadBatchExtractions,
	} = useCrawling();

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="m-2 flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
				<div className="flex min-w-0 flex-col gap-1">
					<h2 className="font-semibold text-sm">Crawling</h2>
					<p className="truncate text-[10px] text-muted-foreground">
						CSV: {fileName || "No file selected"}
					</p>
				</div>
				<Button
					size="sm"
					onClick={start}
					disabled={running || batches.length === 0}
					className="h-8 gap-1"
				>
					<PlayIcon className="size-3" />
					<span className="text-xs">{running ? "Running..." : "Start"}</span>
				</Button>
			</div>

			<div className="mx-2 grid grid-cols-1 gap-2 rounded-md border bg-card p-2">
				<label
					htmlFor="crawl-csv-input"
					className="flex items-center gap-2 text-xs"
				>
					<FileSpreadsheetIcon className="size-3 text-muted-foreground" />
					<span>CSV File</span>
				</label>
				<Input
					id="crawl-csv-input"
					type="file"
					accept=".csv,text/csv"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (!file) return;
						handleFile(file).then();
					}}
				/>

				<div className="grid grid-cols-2 gap-2">
					<div className="flex flex-col gap-1">
						<span className="text-[10px] text-muted-foreground">
							Batch Size
						</span>
						<Input
							type="number"
							min={1}
							value={batchSize}
							disabled={running}
							onChange={(event) => {
								const value = Number.parseInt(event.target.value, 10);
								if (!Number.isFinite(value) || value < 1) return;
								reBatch(value);
							}}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-[10px] text-muted-foreground">
							Sleep (ms) after batch
						</span>
						<Input
							type="number"
							min={0}
							value={sleepMs}
							disabled={running}
							onChange={(event) => {
								const value = Number.parseInt(event.target.value, 10);
								if (!Number.isFinite(value) || value < 0) return;
								setSleepMs(value);
							}}
						/>
					</div>
				</div>
			</div>

			<div className="mx-2 mt-2 rounded-md border bg-card px-3 py-2">
				<div className="mb-2 flex items-center justify-between">
					<p className="text-xs">
						Completed: {completedCount}/{totalCount}
					</p>
					<p className="text-[10px] text-muted-foreground">%{progressValue}</p>
				</div>
				<Progress value={progressValue} />
			</div>

			{error && (
				<div className="mx-2 mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
					<p className="text-destructive text-xs">{error}</p>
				</div>
			)}

			<ScrollArea className="mt-2 overflow-y-auto">
				<div className="flex min-w-0 flex-col gap-2 p-2">
					{selectedBatchIndex === null && (
						<>
							{batches.length === 0 && (
								<p className="text-muted-foreground text-xs">
									Select a CSV file to create batch list.
								</p>
							)}

							{batches.map((batch) => (
								<div
									key={batch.index}
									className="rounded-md border bg-card p-2"
								>
									<div className="flex items-start justify-between gap-2">
										<div>
											<p className="font-medium text-xs">
												Batch #{batch.index + 1}
											</p>
											<p className="text-[10px] text-muted-foreground">
												Rows: {batch.start + 1}-{batch.end} (
												{batch.items.length})
											</p>
										</div>
										<p className="text-[10px] text-muted-foreground uppercase">
											{batch.status}
										</p>
									</div>

									<p className="mt-1 text-[10px] text-muted-foreground">
										Completed: {batch.completedCount}/{batch.items.length}
									</p>

									<div className="mt-2 flex flex-wrap gap-2">
										<Button
											size="xs"
											variant="outline"
											onClick={() => setSelectedBatchIndex(batch.index)}
										>
											View
										</Button>
										<Button
											size="xs"
											variant="outline"
											disabled={batch.status !== "completed"}
											onClick={() => {
												downloadBatchScores(batch.index).then();
											}}
											className="gap-1"
										>
											<DownloadIcon className="size-3" />
											Scores JSON
										</Button>
										<Button
											size="xs"
											variant="outline"
											disabled={batch.status !== "completed"}
											onClick={() => {
												downloadBatchExtractions(batch.index).then();
											}}
											className="gap-1"
										>
											<DownloadIcon className="size-3" />
											Extractions JSON
										</Button>
									</div>
								</div>
							))}
						</>
					)}

					{selectedBatchIndex !== null && activeBatch && (
						<>
							<div className="flex items-center justify-between rounded-md border bg-card p-2">
								<div className="flex items-center gap-2">
									<Button
										size="xs"
										variant="outline"
										onClick={() => setSelectedBatchIndex(null)}
										className="gap-1"
									>
										<ArrowLeftIcon className="size-3" />
										Back
									</Button>
									<p className="font-medium text-xs">
										Batch #{activeBatch.index + 1}
									</p>
								</div>
								<p className="text-[10px] text-muted-foreground uppercase">
									{activeBatch.status}
								</p>
							</div>

							{activeBatch.items.map((item, index) => (
								<div
									key={`${activeBatch.index}-${item.id}-${index}`}
									className="rounded-md border bg-card p-2"
								>
									<div className="flex items-center justify-between gap-2">
										<p className="text-[10px] text-muted-foreground">
											ID: {item.id}
										</p>
										<p className="text-[10px] text-muted-foreground uppercase">
											{item.status}
										</p>
									</div>
									<p className="truncate font-medium text-xs">{item.url}</p>
									<p className="mt-0.5 truncate text-[10px] text-muted-foreground">
										Search: {item.searchTerm || "(empty)"}
									</p>
									<div className="mt-2">
										<HeatmapRow scores={item.scores ?? []} />
									</div>
									{item.error && (
										<p className="mt-2 text-[10px] text-destructive">
											{item.error}
										</p>
									)}
								</div>
							))}
						</>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};
