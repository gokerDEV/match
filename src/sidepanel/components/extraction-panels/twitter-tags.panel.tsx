import { ImageIcon } from "lucide-react";
import type React from "react";
import type { TagItem } from "@/lib/extraction.helpers";
import { ExtractionSection } from "./shared";

interface TwitterTagsPanelProps {
	twitterTags: TagItem[];
	twitterImage?: string;
}

export const TwitterTagsPanel: React.FC<TwitterTagsPanelProps> = ({
	twitterTags,
	twitterImage,
}) => {
	if (twitterTags.length === 0 && !twitterImage) return null;

	return (
		<ExtractionSection
			title={`Twitter Tags (${twitterTags.length})`}
			icon={<ImageIcon className="size-3 text-muted-foreground" />}
		>
			{twitterImage && (
				<div className="flex flex-col gap-1">
					<span className="text-[10px] text-muted-foreground uppercase tracking-wide">
						twitter:image thumbnail
					</span>
					<img
						src={twitterImage}
						alt="Twitter card thumbnail"
						className="h-28 w-full rounded border object-cover"
						loading="lazy"
					/>
				</div>
			)}
			{twitterTags.map((tag) => (
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
