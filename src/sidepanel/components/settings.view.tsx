import type React from "react";

export const SettingsView: React.FC = () => {
	return (
		<div className="flex h-full flex-col gap-4 bg-background p-4">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold text-sm">Settings</h2>
				<p className="text-muted-foreground text-xs">
					Configure extension behaviour and preferences here.
				</p>
			</div>
			<div className="flex flex-1 items-center justify-center rounded-md border border-dashed">
				<p className="text-muted-foreground text-xs">Coming soon</p>
			</div>
		</div>
	);
};
