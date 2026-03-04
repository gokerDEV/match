import type React from "react";

export interface LogViewerProps {
	logs: string[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
	return (
		<div className="mb-8 flex max-h-48 w-full flex-col gap-2 overflow-y-auto rounded-lg border bg-muted/20 p-4 font-mono text-muted-foreground text-xs shadow">
			<div className="mb-1 font-bold text-[10px] uppercase tracking-wider underline">
				Analysis Event Log
			</div>
			{logs.length === 0 && (
				<div className="italic opacity-50">No events logged yet.</div>
			)}
			{logs.map((log, idx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Append-only arrays use index safely
				<div key={`log-${idx}`}>{log}</div>
			))}
		</div>
	);
};
