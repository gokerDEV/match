import { LinkIcon } from "lucide-react";
import type React from "react";
import type { LinkItem } from "@/lib/extraction.helpers";
import { ExtractionSection } from "./shared";

interface LinksPanelProps {
	internalLinks: LinkItem[];
	externalLinks: LinkItem[];
}

const MAX_RENDERED_LINKS = 100;

const LinksList: React.FC<{ links: LinkItem[] }> = ({ links }) => (
	<div className="flex flex-col gap-1">
		{links.map((link) => (
			<div key={link.href} className="rounded border bg-background p-2">
				<p className="truncate font-medium text-xs">
					{link.text || "(no anchor text)"}
				</p>
				<a
					href={link.href}
					target="_blank"
					rel="noreferrer"
					className="block break-all text-[10px] text-muted-foreground hover:underline"
				>
					{link.href}
				</a>
			</div>
		))}
	</div>
);

export const LinksPanel: React.FC<LinksPanelProps> = ({
	internalLinks,
	externalLinks,
}) => {
	if (internalLinks.length === 0 && externalLinks.length === 0) return null;
	const visibleInternalLinks = internalLinks.slice(0, MAX_RENDERED_LINKS);
	const visibleExternalLinks = externalLinks.slice(0, MAX_RENDERED_LINKS);

	return (
		<ExtractionSection
			title={`Links (Internal ${internalLinks.length} / External ${externalLinks.length})`}
			icon={<LinkIcon className="size-3 text-muted-foreground" />}
		>
			<div className="grid gap-1">
				<div className="flex flex-col gap-1">
					<span className="text-[10px] text-muted-foreground uppercase tracking-wide">
						Internal Links ({internalLinks.length})
					</span>
					{internalLinks.length > MAX_RENDERED_LINKS && (
						<p className="text-[10px] text-muted-foreground">
							Showing first {MAX_RENDERED_LINKS} links.
						</p>
					)}
					{visibleInternalLinks.length > 0 ? (
						<LinksList links={visibleInternalLinks} />
					) : (
						<p className="text-muted-foreground text-xs">No internal links.</p>
					)}
				</div>

				<div className="flex w-full flex-col gap-1 overflow-auto">
					<span className="text-[10px] text-muted-foreground uppercase tracking-wide">
						External Links ({externalLinks.length})
					</span>
					{externalLinks.length > MAX_RENDERED_LINKS && (
						<p className="text-[10px] text-muted-foreground">
							Showing first {MAX_RENDERED_LINKS} links.
						</p>
					)}
					{visibleExternalLinks.length > 0 ? (
						<LinksList links={visibleExternalLinks} />
					) : (
						<p className="text-muted-foreground text-xs">No external links.</p>
					)}
				</div>
			</div>
		</ExtractionSection>
	);
};
