import { ImageIcon } from "lucide-react";
import type React from "react";
import type { TagItem } from "./helpers";
import { ExtractionSection } from "./shared";

interface OgTagsPanelProps {
	ogTags: TagItem[];
	ogImage?: string;
}

export const OgTagsPanel: React.FC<OgTagsPanelProps> = ({
	ogTags,
	ogImage,
}) => {
	if (ogTags.length === 0 && !ogImage) return null;

	return (
		<ExtractionSection
			title={`Open Graph Tags (${ogTags.length})`}
			icon={<ImageIcon className="size-3 text-muted-foreground" />}
		>
			{ogImage && (
				<div className="flex flex-col gap-1">
					<span className="text-[10px] text-muted-foreground uppercase tracking-wide">
						og:image thumbnail
					</span>
					<img
						src={ogImage}
						alt="Open Graph thumbnail"
						className="h-28 rounded border object-contain"
						loading="lazy"
					/>
				</div>
			)}
			{ogTags.map((tag) => (
				<div key={tag.key} className="flex flex-col gap-0.5">
					<span className="text-[10px] text-muted-foreground">{tag.key}</span>
					<span className="break-all font-medium text-xs">
						{tag.value || "—"}
					</span>
				</div>
			))}
		</ExtractionSection>
	);
};
