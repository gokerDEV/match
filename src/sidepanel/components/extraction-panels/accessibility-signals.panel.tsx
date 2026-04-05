import { ShieldCheckIcon } from "lucide-react";
import type React from "react";
import { getNumber } from "@/lib/extraction.helpers";
import type { Extractions } from "@/lib/types/engine";
import { ExtractionField, ExtractionSection } from "./shared";

interface AccessibilitySignalsPanelProps {
	extractions: Extractions;
}

export const AccessibilitySignalsPanel: React.FC<
	AccessibilitySignalsPanelProps
> = ({ extractions }) => (
	<ExtractionSection
		title="Accessibility Signals"
		icon={<ShieldCheckIcon className="size-3 text-muted-foreground" />}
	>
		<div className="grid grid-cols-2 gap-2">
			<ExtractionField
				label="Axe Passes"
				value={getNumber(extractions.axePasses)}
			/>
			<ExtractionField
				label="Axe Violations"
				value={getNumber(extractions.axeViolations)}
			/>
		</div>
	</ExtractionSection>
);
