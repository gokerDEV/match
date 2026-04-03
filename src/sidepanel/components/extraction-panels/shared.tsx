import type React from "react";

interface ExtractionSectionProps {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}

export const ExtractionSection: React.FC<ExtractionSectionProps> = ({
	title,
	icon,
	children,
}) => (
	<div className="rounded-md border bg-card">
		<div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
			{icon}
			<h3 className="font-semibold text-xs">{title}</h3>
		</div>
		<div className="flex flex-col gap-2 p-2">{children}</div>
	</div>
);

interface ExtractionFieldProps {
	label: string;
	value: string | number | null | undefined;
}

export const ExtractionField: React.FC<ExtractionFieldProps> = ({
	label,
	value,
}) => {
	const displayValue =
		value !== null && value !== undefined && typeof value !== "boolean"
			? String(value)
			: "—";
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-[10px] text-muted-foreground uppercase tracking-wide">
				{label}
			</span>
			<span className="break-all font-medium text-xs">{displayValue}</span>
		</div>
	);
};
