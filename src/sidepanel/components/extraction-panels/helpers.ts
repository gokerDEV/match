export interface TagItem {
	key: string;
	value: string;
}

export interface IconItem {
	rel: string;
	href: string;
	sizes: string | null;
	type: string | null;
}

export interface LinkItem {
	href: string;
	text: string;
}

export const getString = (value: unknown): string | undefined =>
	typeof value === "string" ? value : undefined;

export const getNumber = (value: unknown): number | undefined =>
	typeof value === "number" ? value : undefined;

export const getTagItems = (
	value: unknown,
	keyField: "property" | "name",
): TagItem[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => {
			if (!item || typeof item !== "object") return null;
			const rawKey = Reflect.get(item, keyField);
			const rawValue = Reflect.get(item, "content");
			if (typeof rawKey !== "string") return null;
			return {
				key: rawKey,
				value: typeof rawValue === "string" ? rawValue : "",
			};
		})
		.filter((item): item is TagItem => item !== null);
};

export const getStringList = (value: unknown): string[] =>
	Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];

export const getIconItems = (value: unknown): IconItem[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => {
			if (!item || typeof item !== "object") return null;
			const href = Reflect.get(item, "href");
			if (typeof href !== "string" || href.length === 0) return null;
			return {
				rel:
					typeof Reflect.get(item, "rel") === "string"
						? (Reflect.get(item, "rel") as string)
						: "",
				href,
				sizes:
					typeof Reflect.get(item, "sizes") === "string"
						? (Reflect.get(item, "sizes") as string)
						: null,
				type:
					typeof Reflect.get(item, "type") === "string"
						? (Reflect.get(item, "type") as string)
						: null,
			};
		})
		.filter((item): item is IconItem => item !== null);
};

export const getLinkItems = (value: unknown): LinkItem[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => {
			if (!item || typeof item !== "object") return null;
			const href = Reflect.get(item, "href");
			if (typeof href !== "string" || href.length === 0) return null;
			const text = Reflect.get(item, "text");
			return { href, text: typeof text === "string" ? text : "" };
		})
		.filter((item): item is LinkItem => item !== null);
};
