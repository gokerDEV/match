import type React from "react";
import { HeatmapRow } from "@/components/common/heatmap.row";
import type { DeepDiveResult } from "./types";

interface DeepDiveRowProps {
	index: number;
	row: DeepDiveResult;
}

export const DeepDiveRow: React.FC<DeepDiveRowProps> = ({ index, row }) => (
	<div className="rounded border bg-card p-2">
		<div className="flex items-center justify-between gap-2">
			<p className="text-[10px] text-muted-foreground">#{index + 1}</p>
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
);
