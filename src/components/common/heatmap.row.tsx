import type React from "react";

interface HeatmapRowProps {
	scores: number[]; // [M, A, T, C, H]
	loading?: boolean;
}

export const MATCH_COLUMNS = [
	{ ideal: "#DD4433", heatMax: "#55CCCC", letter: "M", title: "Metadata" },
	{ ideal: "#4488FF", heatMax: "#EECC33", letter: "A", title: "Access" },
	{ ideal: "#FFBB00", heatMax: "#2288CC", letter: "T", title: "Technical" },
	{ ideal: "#8844BB", heatMax: "#88AA55", letter: "C", title: "Contextual" },
	{ ideal: "#11AA55", heatMax: "#993366", letter: "H", title: "Hierarchy" },
];

const hexToRgb = (hex: string) => {
	const bigint = parseInt(hex.replace("#", ""), 16);
	return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const rgbToHex = (r: number, g: number, b: number) => {
	return (
		"#" +
		((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()
	);
};

const interpolateColor = (score: number, ideal: string, heatMax: string) => {
	if (score >= 0.99) return ideal;

	const factor = score;

	const [r1, g1, b1] = hexToRgb(heatMax);
	const [r2, g2, b2] = hexToRgb(ideal);

	const r = Math.round(r1 + factor * (r2 - r1));
	const g = Math.round(g1 + factor * (g2 - g1));
	const b = Math.round(b1 + factor * (b2 - b1));

	return rgbToHex(r, g, b);
};

export const HeatmapRow: React.FC<HeatmapRowProps> = ({ scores, loading }) => {
	return (
		<div className="monochrome flex w-full gap-2">
			{MATCH_COLUMNS.map((col, idx) => {
				const score = scores[idx] !== undefined ? scores[idx] : null;

				let bg = "#dbdbdb"; // monochrome default

				if (loading) {
					// when loading, handled via css animation but we need fallback/vars
					bg = col.ideal; // base fallback
				} else if (score !== null) {
					bg = interpolateColor(score, col.ideal, col.heatMax);
				}

				return (
					<div
						key={col.letter}
						className={`flex flex-1 flex-col items-center justify-center rounded-sm py-4 transition-colors duration-500 ease-in-out ${loading ? "animate-heatmap-loading" : ""}`}
						style={{
							backgroundColor: bg,
							...({
								"--color-ideal": col.ideal,
								"--color-heatmax": col.heatMax,
							} as React.CSSProperties),
						}}
						title={
							score !== null
								? `${col.title}: ${(score * 100).toFixed(0)}%`
								: col.title
						}
					>
						<span
							className={`font-bold text-xl ${loading || score === null ? "text-white/30" : "hidden"}`}
						>
							{col.letter}
						</span>
						{score !== null && !loading && (
							<span className="mt-1 font-mono text-white/80 text-xs">
								{(score * 100).toFixed(0)}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
};
