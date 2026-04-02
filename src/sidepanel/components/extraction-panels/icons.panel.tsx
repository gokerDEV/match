import { ImageIcon } from "lucide-react";
import type React from "react";
import type { IconItem } from "./helpers";
import { ExtractionSection } from "./shared";

interface IconsPanelProps {
	icons: IconItem[];
}

export const IconsPanel: React.FC<IconsPanelProps> = ({ icons }) => {
	if (icons.length === 0) return null;

	return (
		<ExtractionSection
			title={`Favicons & Icons (${icons.length})`}
			icon={<ImageIcon className="size-3 text-muted-foreground" />}
		>
			<div className="grid grid-cols-3 gap-2">
				{icons.map((icon) => (
					<div
						key={`${icon.rel}-${icon.href}`}
						className="flex flex-col gap-1 rounded border bg-muted/20 p-2"
					>
						<img
							src={icon.href}
							alt={icon.rel || "icon"}
							className="h-10 w-full rounded object-contain"
							loading="lazy"
						/>
						<p className="truncate text-[10px] text-muted-foreground">
							{icon.sizes || icon.type || icon.rel || "icon"}
						</p>
					</div>
				))}
			</div>
		</ExtractionSection>
	);
};
