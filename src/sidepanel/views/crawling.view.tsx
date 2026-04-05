import {
	ArrowLeftIcon,
	DownloadIcon,
	FileSpreadsheetIcon,
	PauseIcon,
	PlayIcon,
} from "lucide-react";
import type React from "react";
import { MatchResultRow } from "@/components/common/match-result.row";
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
		paused,
		error,
		totalCount,
		completedCount,
		progressValue,
		setSleepMs,
		reBatch,
		handleFile,
		start,
		openRowInCheck,
		setSelectedBatchIndex,
		downloadBatchScores,
		downloadBatchExtractions,
	} = useCrawling();

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="mx-2.5 flex items-start justify-between gap-2 p-4">
				<div className="flex min-w-0 flex-col gap-1">
					<h2 className="font-semibold text-sm">Crawling</h2>
					<p className="truncate text-[10px] text-muted-foreground">
						CSV: {fileName || "No file selected"}
					</p>
				</div>
				<Button
					size="sm"
					onClick={start}
					disabled={batches.length === 0}
					className="h-8 gap-1"
				>
					{running ? (
						paused ? (
							<PlayIcon className="size-3" />
						) : (
							<PauseIcon className="size-3" />
						)
					) : (
						<PlayIcon className="size-3" />
					)}
					<span className="text-xs">
						{running ? (paused ? "Resume" : "Pause") : "Start"}
					</span>
				</Button>
			</div>

			<div className="mx-2.5 grid grid-cols-1 gap-2 rounded-md border bg-card p-2">
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
					className="text-muted-foreground text-xs"
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
							className="text-sm"
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
							className="text-sm"
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

			<div className="mx-2.5 mt-2 rounded-md border bg-card px-3 py-2">
				<div className="mb-2 flex items-center justify-between">
					<p className="text-xs">
						Completed: {completedCount}/{totalCount}
					</p>
					<p className="text-[10px] text-muted-foreground">%{progressValue}</p>
				</div>
				<Progress value={progressValue} />
			</div>

			{error && (
				<div className="mx-2.5 mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
					<p className="text-destructive text-xs">{error}</p>
				</div>
			)}

			<ScrollArea className="overflow-y-auto">
				<div className="flex min-w-0 flex-col gap-2 p-2.5">
					{selectedBatchIndex === null && (
						<>
							{batches.length === 0 && (
								<p className="text-muted-foreground text-xs">
									Select a CSV file to create batch list.
								</p>
							)}

							{batches.map((batch) => (
								<button
									key={batch.index}
									type="button"
									className="rounded-md border bg-card p-2.5"
									onClick={() => setSelectedBatchIndex(batch.index)}
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

									<div className="mt-2 grid grid-cols-2 gap-2">
										<Button
											size="xs"
											variant="outline"
											disabled={batch.status !== "completed"}
											onClick={(e) => {
												e.stopPropagation();
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
											onClick={(e) => {
												e.stopPropagation();
												downloadBatchExtractions(batch.index).then();
											}}
											className="gap-1"
										>
											<DownloadIcon className="size-3" />
											Extractions JSON
										</Button>
									</div>
								</button>
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
								<MatchResultRow
									key={`${activeBatch.index}-${item.id}-${index}`}
									index={index}
									status={item.status}
									url={item.url}
									searchTerm={item.searchTerm}
									scores={item.scores}
									error={item.error}
									metaLabel={`ID: ${item.id}`}
									clickable={item.status === "done"}
									onOpen={
										item.status === "done"
											? () => openRowInCheck(item)
											: undefined
									}
								/>
							))}
						</>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};
