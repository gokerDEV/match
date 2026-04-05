import type React from "react";
import { HeatmapRow } from "@/components/common/heatmap.row";
import { Button } from "@/components/ui/button";

interface MatchResultRowProps {
	index: number;
	status: string;
	url: string;
	searchTerm: string;
	scores?: number[] | null;
	error?: string;
	metaLabel?: string;
	openLabel?: string;
	clickable?: boolean;
	onOpen?: () => void;
}

export const MatchResultRow: React.FC<MatchResultRowProps> = ({
	index,
	status,
	url,
	searchTerm,
	scores,
	error,
	metaLabel,
	openLabel = "Open",
	clickable = false,
	onOpen,
}) => {
	const isClickable = clickable && !!onOpen;

	return (
		<div className="rounded border bg-card p-2">
			<div className="flex items-center justify-between gap-2">
				<p className="flex gap-2 text-[10px] text-muted-foreground">
					{metaLabel || `#${index + 1}`} -
					<span className="uppercase">{status}</span>
				</p>
				{isClickable && (
					<Button
						className="px-6"
						size="xs"
						variant="outline"
						onClick={(event) => {
							event.stopPropagation();
							onOpen?.();
						}}
					>
						{openLabel}
					</Button>
				)}
			</div>
			<p className="break-all font-medium text-xs">{url}</p>
			<p className="mt-1 truncate text-[10px] text-muted-foreground">
				Search term: {searchTerm || "(empty)"}
			</p>
			<div className="mt-2">
				<HeatmapRow scores={scores ?? []} />
			</div>
			{error && <p className="mt-2 text-[10px] text-destructive">{error}</p>}
		</div>
	);
};
