import type React from "react";

import { MATCH_COLUMNS } from "@/components/common/heatmap.row";

export const MatchHeader: React.FC = () => {
	return (
		<div className="grid grid-cols-[1fr_2fr] gap-6 border-b pb-4">
			<div className="flex items-end font-bold text-muted-foreground tracking-wider">
				IDEAL <span className="ml-2 font-mono text-xs">(Reference)</span>
			</div>
			<div className="grid grid-cols-5 gap-2 pr-2 text-center font-bold text-muted-foreground text-xs uppercase tracking-wider">
				{MATCH_COLUMNS.map((col) => (
					<div
						key={col.letter}
						className="flex flex-col items-center justify-end gap-.5"
					>
						<span>{col.title}</span>
						<div
							className="flex h-10 w-full items-center justify-center rounded-sm font-extrabold text-lg text-white"
							style={{ backgroundColor: col.ideal }}
						>
							{col.title.charAt(0)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
