import { DownloadIcon, PauseIcon, PlayIcon, RadarIcon } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { DeepDiveRow } from "@/sidepanel/components/deep-dive/deep-dive-row";
import { useDeepDive } from "@/sidepanel/hooks/use-deep-dive";

export const DeepDiveView: React.FC = () => {
	const {
		tabUrl,
		results,
		error,
		running,
		paused,
		removeDuplicateLinks,
		setRemoveDuplicateLinks,
		rawLinksCount,
		readyLinksCount,
		completedCount,
		totalCount,
		progressValue,
		canPrimaryAction,
		handlePrimaryAction,
		openRowInCheck,
		exportingResults,
		exportingExtractions,
		handleDownloadResults,
		handleDownloadExtractions,
	} = useDeepDive();

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="m-4 flex items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<h2 className="font-semibold text-sm">Deep Dive</h2>
					<p className="text-muted-foreground text-xs">Internal link MATCH</p>
					{tabUrl && (
						<p className="truncate text-[10px] text-muted-foreground">
							{tabUrl}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						onClick={handlePrimaryAction}
						disabled={!canPrimaryAction}
						className="h-8 gap-1"
					>
						{running ? (
							paused ? (
								<PlayIcon className="size-3" />
							) : (
								<PauseIcon className="size-3" />
							)
						) : (
							<RadarIcon className="size-3" />
						)}
						<span className="text-xs">
							{running ? (paused ? "Resume" : "Pause") : "Start"}
						</span>
					</Button>
				</div>
			</div>

			<div className="mx-2.5 rounded-md border bg-muted/40 px-3 py-2">
				<div className="flex items-center justify-between gap-2">
					<div className="text-xs">
						<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
							Links
						</p>
						<p className="font-medium">
							{rawLinksCount}/{readyLinksCount}
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

			<div className="mx-2.5 mt-1 rounded-md border bg-card px-3 py-2">
				<div className="mb-2 flex items-center justify-between">
					<p className="text-xs">
						Completed: {completedCount}/{totalCount}
					</p>
					<p className="text-[10px] text-muted-foreground">%{progressValue}</p>
				</div>
				<Progress value={progressValue} />
			</div>

			{error && (
				<div className="mx-4 mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
					<p className="text-destructive text-xs">{error}</p>
				</div>
			)}

			<ScrollArea className="overflow-y-auto">
				<div className="flex min-w-0 flex-col gap-2 p-2.5">
					{results.length === 0 && (
						<p className="text-muted-foreground text-xs">
							No internal links ready.
						</p>
					)}
					{results.map((row, index) => (
						<DeepDiveRow
							key={`${row.url}-${index}`}
							index={index}
							row={row}
							onOpen={openRowInCheck}
						/>
					))}
				</div>
			</ScrollArea>
			<div className='p-2.5  grid grid-cols-2 gap-2'>
				<Button
					size="sm"
					variant="outline"
					onClick={handleDownloadResults}
					disabled={results.length === 0 || exportingResults}
					className="h-8 gap-1"
				>
					<DownloadIcon className="size-3" />
					<span className="text-xs">Results JSON</span>
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={handleDownloadExtractions}
					disabled={results.length === 0 || exportingExtractions}
					className="h-8 gap-1"
				>
					<DownloadIcon className="size-3" />
					<span className="text-xs">Extractions JSON</span>
				</Button>
			</div>
		</div>
	);
};
