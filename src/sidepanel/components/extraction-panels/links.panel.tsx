import { LinkIcon } from "lucide-react";
import type React from "react";
import type { LinkItem } from "./helpers";
import { ExtractionSection } from "./shared";

interface LinksPanelProps {
	internalLinks: LinkItem[];
	externalLinks: LinkItem[];
}

const LinksList: React.FC<{ links: LinkItem[] }> = ({ links }) => (
	// <ScrollArea className="h-44 rounded border bg-muted/20">
	<div className="flex flex-col gap-2">
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
	// </ScrollArea>
);

export const LinksPanel: React.FC<LinksPanelProps> = ({
	internalLinks,
	externalLinks,
}) => {
	if (internalLinks.length === 0 && externalLinks.length === 0) return null;

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
					{internalLinks.length > 0 ? (
						<LinksList links={internalLinks} />
					) : (
						<p className="text-muted-foreground text-xs">No internal links.</p>
					)}
				</div>

				<div className="flex flex-col gap-1">
					<span className="text-[10px] text-muted-foreground uppercase tracking-wide">
						External Links ({externalLinks.length})
					</span>
					{externalLinks.length > 0 ? (
						<LinksList links={externalLinks} />
					) : (
						<p className="text-muted-foreground text-xs">No external links.</p>
					)}
				</div>
			</div>
		</ExtractionSection>
	);
};
