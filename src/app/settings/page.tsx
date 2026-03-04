import {
	Clock,
	Database,
	FileText,
	Loader2,
	MonitorPlay,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { historyService } from "@/services/storage";
import { useSettings } from "@/hooks/use-settings";

export function SettingsPage() {
	const { settings, loading, saving, updateSettings } = useSettings();
	const [clearing, setClearing] = useState(false);

	const handleClearCache = async () => {
		setClearing(true);
		try {
			await historyService.clearCache();
			toast.success("Cache cleared successfully.");
		} catch (_error) {
			toast.error("Failed to clear cache.");
		} finally {
			setClearing(false);
		}
	};

	const handleLogsToggle = async (checked: boolean) => {
		await updateSettings({ logsEnabled: checked });
	};

	const handleShowCreditsToggle = async (checked: boolean) => {
		await updateSettings({ showCredits: checked });
	};

	const handleNumberBlur = async (
		field: "historyLimit" | "cacheLimit" | "loaderTimeout",
		raw: string,
		min: number,
		max: number,
	) => {
		const parsed = Number.parseInt(raw, 10);
		if (Number.isNaN(parsed) || parsed < min || parsed > max) return;
		await updateSettings({ [field]: parsed });
	};

	const isBusy = loading || saving;

	return (
		<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 p-8">
			{/* Top Bar */}
			<div className="flex w-full items-center justify-between rounded-lg border bg-background p-4 shadow">
				<div className="flex items-center gap-2">
					<h1 className="bg-gradient-to-tr from-foreground to-muted-foreground bg-clip-text font-bold text-2xl text-transparent tracking-tight">
						SETTINGS
					</h1>
				</div>
				{saving && (
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
						Saving…
					</div>
				)}
			</div>

			{/* Logging Settings */}
			<div className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<FileText className="h-5 w-5 text-primary" />
						<h2 className="font-bold text-xl">Logging</h2>
					</div>
					<p className="text-muted-foreground text-sm">
						When enabled, MATCH records detailed analysis event logs during each
						run. Disable to reduce noise and improve performance.
					</p>
				</div>

				<ToggleRow
					id="logs-toggle"
					label="Analysis Logs"
					description={
						settings.logsEnabled
							? "Logs are currently active"
							: "Logging is disabled"
					}
					checked={settings.logsEnabled}
					disabled={isBusy}
					onCheckedChange={handleLogsToggle}
				/>
			</div>

			{/* Loader / Intro Settings */}
			<div className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<MonitorPlay className="h-5 w-5 text-primary" />
						<h2 className="font-bold text-xl">Intro &amp; Loader</h2>
					</div>
					<p className="text-muted-foreground text-sm">
						Control the startup intro screen that appears when the app opens.
						You can disable the credits screen or adjust how long it shows.
					</p>
				</div>

				<ToggleRow
					id="credits-toggle"
					label="Show Credits Screen"
					description={
						settings.showCredits
							? "Credits are shown on startup"
							: "Startup goes straight to the app"
					}
					checked={settings.showCredits}
					disabled={isBusy}
					onCheckedChange={handleShowCreditsToggle}
				/>

				<div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<Label htmlFor="loader-timeout" className="font-medium text-sm">
								Intro Duration
							</Label>
						</div>
						<span className="text-muted-foreground text-xs">
							How long (ms) the intro screen is shown. Min 500 — Max 10 000.
						</span>
					</div>
					<Input
						id="loader-timeout"
						type="number"
						min={500}
						max={10_000}
						step={500}
						defaultValue={settings.loaderTimeout}
						disabled={isBusy || !settings.showCredits}
						className="w-28 text-right"
						onBlur={(e) =>
							handleNumberBlur("loaderTimeout", e.target.value, 500, 10_000)
						}
						key={`timeout-${settings.loaderTimeout}`}
					/>
				</div>
			</div>

			{/* Storage & Cache */}
			<div className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<Database className="h-5 w-5 text-primary" />
						<h2 className="font-bold text-xl">Storage &amp; Cache</h2>
					</div>
					<p className="text-muted-foreground text-sm">
						Configure how many items MATCH keeps in history and cache. Changes
						take effect on the next analysis run.
					</p>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<LimitField
						id="history-limit"
						label="History Limit"
						description="Max analysis runs stored. Oldest entries removed automatically."
						value={settings.historyLimit}
						disabled={isBusy}
						field="historyLimit"
						onBlur={handleNumberBlur}
					/>
					<LimitField
						id="cache-limit"
						label="Cache Limit"
						description="Max extracted DOM snapshots kept locally. Older entries evicted first."
						value={settings.cacheLimit}
						disabled={isBusy}
						field="cacheLimit"
						onBlur={handleNumberBlur}
					/>
				</div>

				<div className="flex items-center gap-4 border-t pt-4">
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="destructive"
								disabled={clearing}
								className="w-48"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{clearing ? "Clearing..." : "Clear Cache"}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to clear the locally cached extractions? This will free up storage but slightly slow down re-analysis of previously visited URLs.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleClearCache}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Clear Cache
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface ToggleRowProps {
	id: string;
	label: string;
	description: string;
	checked: boolean;
	disabled: boolean;
	onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({
	id,
	label,
	description,
	checked,
	disabled,
	onCheckedChange,
}: ToggleRowProps) {
	return (
		<div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
			<div className="flex flex-col gap-0.5">
				<Label htmlFor={id} className="font-medium text-sm">
					{label}
				</Label>
				<span className="text-muted-foreground text-xs">{description}</span>
			</div>
			<Switch
				id={id}
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
			/>
		</div>
	);
}

interface LimitFieldProps {
	id: string;
	label: string;
	description: string;
	value: number;
	disabled: boolean;
	field: "historyLimit" | "cacheLimit" | "loaderTimeout";
	onBlur: (
		field: "historyLimit" | "cacheLimit" | "loaderTimeout",
		raw: string,
		min: number,
		max: number,
	) => Promise<void>;
}

function LimitField({
	id,
	label,
	description,
	value,
	disabled,
	field,
	onBlur,
}: LimitFieldProps) {
	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-muted/30 px-4 py-3">
			<Label htmlFor={id} className="font-medium text-sm">
				{label}
			</Label>
			<p className="text-muted-foreground text-xs">{description}</p>
			<Input
				id={id}
				type="number"
				min={1}
				max={1000}
				defaultValue={value}
				disabled={disabled}
				className="w-28"
				onBlur={(e) => onBlur(field, e.target.value, 1, 1000)}
				key={`${field}-${value}`}
			/>
		</div>
	);
}
