import { CpuIcon } from "lucide-react";
import type React from "react";
import type { Extractions } from "@/lib/types/engine";
import { ExtractionField, ExtractionSection } from "./shared";

interface PerformanceData {
	ttfb: number;
	domInteractive: number;
	fcp: number;
	resourceCount: number;
}

interface TechnicalSignalsPanelProps {
	extractions: Extractions;
}

const getPerformanceData = (value: unknown): PerformanceData | null => {
	if (!value || typeof value !== "object") return null;
	const ttfb = Reflect.get(value, "ttfb");
	const domInteractive = Reflect.get(value, "domInteractive");
	const fcp = Reflect.get(value, "fcp");
	const resourceCount = Reflect.get(value, "resourceCount");

	if (
		typeof ttfb !== "number" ||
		typeof domInteractive !== "number" ||
		typeof fcp !== "number" ||
		typeof resourceCount !== "number"
	) {
		return null;
	}

	return { ttfb, domInteractive, fcp, resourceCount };
};

export const TechnicalSignalsPanel: React.FC<TechnicalSignalsPanelProps> = ({
	extractions,
}) => {
	const perfData = getPerformanceData(extractions.performance);

	return (
		<ExtractionSection
			title="Technical Signals"
			icon={<CpuIcon className="size-3 text-muted-foreground" />}
		>
			{perfData ? (
				<>
					<div className="grid grid-cols-2 gap-2">
						<ExtractionField
							label="TTFB (ms)"
							value={Math.round(perfData.ttfb)}
						/>
						<ExtractionField
							label="DOM Interactive (ms)"
							value={Math.round(perfData.domInteractive)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<ExtractionField
							label="First Contentful Paint (ms)"
							value={Math.round(perfData.fcp)}
						/>
						<ExtractionField
							label="Resource Count"
							value={perfData.resourceCount}
						/>
					</div>
				</>
			) : (
				<p className="text-muted-foreground text-xs">
					No performance data available
				</p>
			)}
		</ExtractionSection>
	);
};
