import { DatabaseIcon, RefreshCwIcon } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Extractions } from "@/lib/types/engine";
import type {
	GET_CACHED_EXTRACTIONS_MESSAGE,
	GET_CACHED_EXTRACTIONS_RESPONSE,
} from "@/services/messaging";
import { AccessibilitySignalsPanel } from "./extraction-panels/accessibility-signals.panel";
import { DomSignalsPanel } from "./extraction-panels/dom-signals.panel";
import {
	getIconItems,
	getLinkItems,
	getString,
	getTagItems,
} from "./extraction-panels/helpers";
import { IconsPanel } from "./extraction-panels/icons.panel";
import { LinksPanel } from "./extraction-panels/links.panel";
import { OgTagsPanel } from "./extraction-panels/og-tags.panel";
import { TechnicalSignalsPanel } from "./extraction-panels/technical-signals.panel";
import { TwitterTagsPanel } from "./extraction-panels/twitter-tags.panel";

const SESSION_TAB_KEY = "match_last_tab_id";

const fetchActiveTab = async (): Promise<{
	tabId: number;
	url: string;
} | null> => {
	try {
		const result = await chrome.storage.session.get(SESSION_TAB_KEY);
		const tabId = result[SESSION_TAB_KEY];
		if (typeof tabId !== "number") return null;
		const tab = await chrome.tabs.get(tabId);
		if (tab?.id && tab.url) return { tabId: tab.id, url: tab.url };
		return null;
	} catch {
		return null;
	}
};

const getCachedExtractions = async (
	url: string,
): Promise<Extractions | null> => {
	try {
		const response = await chrome.runtime.sendMessage<
			GET_CACHED_EXTRACTIONS_MESSAGE,
			GET_CACHED_EXTRACTIONS_RESPONSE
		>({
			type: "GET_CACHED_EXTRACTIONS",
			payload: { url },
		});
		if (response?.success && response.data) {
			return response.data;
		}
		return null;
	} catch {
		return null;
	}
};

export const ExtractionsView: React.FC = () => {
	const [extractions, setExtractions] = useState<Extractions | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [tabUrl, setTabUrl] = useState<string>("");

	const loadExtractions = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const tab = await fetchActiveTab();
			if (!tab) {
				throw new Error("No active tab found");
			}
			setTabUrl(tab.url);
			const data = await getCachedExtractions(tab.url);
			if (data) {
				setExtractions(data);
			} else {
				throw new Error(
					"No cached extractions found. Please run analysis first.",
				);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load extractions",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadExtractions().then();
	}, [loadExtractions]);

	const ogTags = getTagItems(extractions?.ogTags, "property");
	const twitterTags = getTagItems(extractions?.twitterTags, "name");
	const iconLinks = getIconItems(extractions?.iconLinks);
	const internalLinks = getLinkItems(extractions?.internalLinks);
	const externalLinks = getLinkItems(extractions?.externalLinks);
	const ogImage = getString(extractions?.ogImage);
	const twitterImage = getString(extractions?.twitterImage);

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="m-4 flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold text-sm">Extractions</h2>
					<p className="text-muted-foreground text-xs">
						Raw signals extracted from the active page
					</p>
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={loadExtractions}
					disabled={loading}
					className="h-8 gap-1"
				>
					<RefreshCwIcon
						className={`size-3 ${loading ? "animate-spin" : ""}`}
					/>
					<span className="text-xs">Refresh</span>
				</Button>
			</div>

			<div className="mx-4">
				{tabUrl && (
					<div className="rounded-md border bg-muted/40 px-3 py-2">
						<span className="text-[10px] text-muted-foreground uppercase">
							Current URL
						</span>
						<p className="truncate font-medium text-xs">{tabUrl}</p>
					</div>
				)}

				{loading && !extractions && (
					<div className="flex flex-1 items-center justify-center">
						<div className="flex flex-col items-center gap-2 text-muted-foreground">
							<RefreshCwIcon className="size-4 animate-spin" />
							<span className="text-xs">Extracting signals...</span>
						</div>
					</div>
				)}

				{error && (
					<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
						<p className="text-destructive text-xs">{error}</p>
						<p className="mt-1 text-destructive text-xs">
							Please run analysis from the Check tab first.
						</p>
					</div>
				)}

				{!loading && !extractions && !error && (
					<div className="flex flex-1 items-center justify-center rounded-md border border-dashed">
						<div className="flex flex-col items-center gap-2 text-muted-foreground">
							<DatabaseIcon className="size-4" />
							<p className="text-xs">No data yet</p>
						</div>
					</div>
				)}
			</div>

			{extractions && (
				<ScrollArea className="overflow-y-auto">
					<div className="flex grow flex-col gap-4 p-4">
						<IconsPanel icons={iconLinks} />
						<DomSignalsPanel extractions={extractions} />
						<OgTagsPanel ogTags={ogTags} ogImage={ogImage} />
						<TwitterTagsPanel
							twitterTags={twitterTags}
							twitterImage={twitterImage}
						/>
						<AccessibilitySignalsPanel extractions={extractions} />
						<TechnicalSignalsPanel extractions={extractions} />
						<LinksPanel
							internalLinks={internalLinks}
							externalLinks={externalLinks}
						/>
					</div>
				</ScrollArea>
			)}
		</div>
	);
};
