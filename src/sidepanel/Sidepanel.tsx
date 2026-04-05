import {
	DatabaseIcon,
	FilesIcon,
	RadarIcon,
	SearchCheckIcon,
	Settings2Icon,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CheckView } from "./views/check.view";
import { CrawlingView } from "./views/crawling.view";
import { DeepDiveView } from "./views/deep-dive.view";
import { ExtractionsView } from "./views/extractions.view";
import { SettingsView } from "./views/settings.view";

const NAV_ITEMS = [
	{ id: "check", label: "Check", icon: SearchCheckIcon },
	{ id: "extraction", label: "Extraction", icon: DatabaseIcon },
	{ id: "deep-dive", label: "Deep Dive", icon: RadarIcon },
	{ id: "crawling", label: "Crawling", icon: FilesIcon },
	{ id: "settings", label: "Settings", icon: Settings2Icon },
];

const VIEW_MAP: Record<string, React.ComponentType> = {
	check: CheckView,
	extraction: ExtractionsView,
	"deep-dive": DeepDiveView,
	crawling: CrawlingView,
	settings: SettingsView,
};

// Root component for the side panel entry point.
// All navigation logic and view routing lives in SidepanelSidebar.
export const Sidepanel: React.FC = () => {
	const [activeId, setActiveId] = useState("check");

	useEffect(() => {
		const onNavigate = (event: Event) => {
			const customEvent = event as CustomEvent<{ id?: string }>;
			const targetId = customEvent.detail?.id;
			if (!targetId || !(targetId in VIEW_MAP)) return;
			setActiveId(targetId);
		};

		window.addEventListener("match:navigate-view", onNavigate as EventListener);
		return () => {
			window.removeEventListener(
				"match:navigate-view",
				onNavigate as EventListener,
			);
		};
	}, []);

	const ActiveView = VIEW_MAP[activeId] ?? CheckView;

	return (
		// SidebarProvider is required by the Shadcn sidebar primitives.
		// We fix open=true and disable collapsing since the side panel itself is
		// already a fixed-width chrome surface.
		<SidebarProvider
			open={true}
			className="flex h-full flex-row-reverse overflow-hidden"
		>
			<Sidebar
				side="right"
				collapsible="none"
				className="w-10 shrink-0 border-l bg-muted/40"
			>
				<SidebarContent className="flex flex-col items-center gap-1 pt-2">
					<SidebarMenu className="items-center justify-center">
						{NAV_ITEMS.map(({ id, label, icon: Icon }) => (
							<SidebarMenuItem key={id}>
								<SidebarMenuButton
									tooltip={label}
									isActive={activeId === id}
									onClick={() => setActiveId(id)}
									className={cn(
										"flex h-8 w-8 flex-col items-center justify-center rounded-md p-0",
										"data-[active=true]:bg-sidebar-primary/90 data-[active=true]:text-sidebar-primary-foreground!",
									)}
									aria-label={label}
								>
									<Icon className="size-4 shrink-0" />
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarContent>
			</Sidebar>

			{/* ── Main content area — renders the active view ── */}
			<main className="h-full w-full max-w-xs">
				<ActiveView />
			</main>
		</SidebarProvider>
	);
};
