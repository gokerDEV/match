import { DatabaseIcon } from "lucide-react";
import type React from "react";
import type { Extractions } from "@/lib/types/engine";
import { getNumber, getString, getStringList } from "./helpers";
import { ExtractionField, ExtractionSection } from "./shared";

interface DomSignalsPanelProps {
	extractions: Extractions;
}

export const DomSignalsPanel: React.FC<DomSignalsPanelProps> = ({
	extractions,
}) => {
	const h1List = getStringList(extractions.h1List);

	return (
		<ExtractionSection
			title="DOM Signals"
			icon={<DatabaseIcon className="size-3 text-muted-foreground" />}
		>
			<ExtractionField label="Title" value={getString(extractions.title)} />
			<ExtractionField
				label="Meta Description"
				value={getString(extractions.metaDescription)}
			/>
			<ExtractionField
				label="Canonical URL"
				value={getString(extractions.canonicalUrl)}
			/>
			<ExtractionField
				label="HTML Lang"
				value={getString(extractions.htmlLang)}
			/>
			<ExtractionField
				label="Viewport"
				value={getString(extractions.viewportMeta)}
			/>
			{h1List.length > 0 && (
				<div className="flex flex-col gap-0.5">
					<span className="text-[10px] text-muted-foreground uppercase tracking-wide">
						H1 Headings ({h1List.length})
					</span>
					<ul className="space-y-1 text-xs">
						{h1List.map((h1, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static extracted snapshot
							<li key={index} className="break-all font-medium">
								{h1 || "—"}
							</li>
						))}
					</ul>
				</div>
			)}
			<div className="grid grid-cols-2 gap-2">
				<ExtractionField
					label="DOM Elements"
					value={getNumber(extractions.domElementCount)}
				/>
				<ExtractionField
					label="DOM Depth"
					value={getNumber(extractions.domDepth)}
				/>
			</div>
			<div className="grid grid-cols-3 gap-2">
				<ExtractionField
					label="Main"
					value={getNumber(extractions.countMain)}
				/>
				<ExtractionField
					label="Articles"
					value={getNumber(extractions.countArticle)}
				/>
				<ExtractionField
					label="Sections"
					value={getNumber(extractions.countSection)}
				/>
			</div>
			<div className="grid grid-cols-4 gap-2">
				<ExtractionField label="H2" value={getNumber(extractions.countH2)} />
				<ExtractionField label="H3" value={getNumber(extractions.countH3)} />
				<ExtractionField label="H4" value={getNumber(extractions.countH4)} />
				<ExtractionField label="P" value={getNumber(extractions.countP)} />
			</div>
			<div className="grid grid-cols-2 gap-2">
				<ExtractionField
					label="Header"
					value={getNumber(extractions.countHeader)}
				/>
				<ExtractionField
					label="Footer"
					value={getNumber(extractions.countFooter)}
				/>
			</div>
		</ExtractionSection>
	);
};
