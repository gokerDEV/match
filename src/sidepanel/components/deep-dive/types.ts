export interface LinkInput {
	href: string;
	text: string;
}

export interface PreparedLink {
	text: string;
	normalizedHref: string;
}

export interface DeepDiveResult {
	url: string;
	searchTerm: string;
	scores: number[] | null;
	error?: string;
	status: "pending" | "done" | "error";
}
