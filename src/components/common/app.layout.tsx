import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useSettings } from "@/hooks/use-settings";
import { AppLoader } from "./app.loader";
import { AppSidebar } from "./app.sidebar";
import { Credits } from "./credits";
import { Header } from "./header";
import { SystemProvider } from "./system.context";
import { Toaster } from "@/components/ui/sonner";

export default function Layout() {
	const { settings, loading } = useSettings();

	// Wait for settings before committing to loader behaviour
	if (loading) return null;

	const skip = !settings.showCredits;

	return (
		<SystemProvider initialLoading={settings.showCredits}>
			<AppLoader timeout={settings.loaderTimeout} skip={skip}>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset>
						<Header />
						<div className="flex flex-1 flex-col gap-4">
							<div className="min-h-[100vh] flex-1 p-6 md:min-h-min">
								<Outlet />
							</div>
						</div>
					</SidebarInset>
				</SidebarProvider>
				<Credits brand="goker" origin={{ x: "0%", y: "0%" }} />
				<Toaster />
			</AppLoader>
		</SystemProvider>
	);
}
