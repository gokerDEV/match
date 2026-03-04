import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
	return (
		<SonnerToaster
			position="bottom-right"
			toastOptions={{
				classNames: {
					toast:
						"group/toast bg-background text-foreground border border-border shadow-lg rounded-lg text-sm",
					description: "text-muted-foreground text-xs",
					actionButton: "bg-primary text-primary-foreground",
					cancelButton: "bg-muted text-muted-foreground",
					error: "!border-destructive/50 !bg-destructive/10 !text-destructive",
					success:
						"!border-green-500/30 !bg-green-500/10 !text-green-700 dark:!text-green-400",
				},
			}}
		/>
	);
}
