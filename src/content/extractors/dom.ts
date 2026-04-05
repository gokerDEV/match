export const extractDomSignals = () => {
	const currentUrl = new URL(window.location.href);
	const normalizeText = (value: string | null | undefined): string =>
		(value || "").replace(/\s+/g, " ").trim();

	const toAbsoluteUrl = (value: string | null): string | null => {
		if (!value) return null;
		try {
			return new URL(value, currentUrl.href).href;
		} catch {
			return null;
		}
	};

	const extractAnchorText = (anchor: HTMLAnchorElement): string => {
		const fromText = normalizeText(anchor.textContent);
		if (fromText.length > 0) return fromText;

		const fromAriaLabel = normalizeText(anchor.getAttribute("aria-label"));
		if (fromAriaLabel.length > 0) return fromAriaLabel;

		const fromTitle = normalizeText(anchor.getAttribute("title"));
		if (fromTitle.length > 0) return fromTitle;

		const imageAlts = Array.from(anchor.querySelectorAll("img[alt]"))
			.map((image) => normalizeText(image.getAttribute("alt")))
			.filter((alt) => alt.length > 0);
		if (imageAlts.length > 0) return imageAlts.join(" ");

		const fromSvgTitle = normalizeText(
			anchor.querySelector("svg title")?.textContent,
		);
		if (fromSvgTitle.length > 0) return fromSvgTitle;

		return "";
	};

	const title = document.title || null;
	const metaDescription =
		document
			.querySelector('meta[name="description"]')
			?.getAttribute("content") || null;
	const htmlLang = document.documentElement.lang || null;
	const viewportMeta =
		document.querySelector('meta[name="viewport"]')?.getAttribute("content") ||
		null;

	const h1Elements = Array.from(document.querySelectorAll("h1"));
	const h1List = h1Elements.map((h1) => h1.textContent?.trim() ?? "");

	const canonicalUrl =
		document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
		null;

	const countMain = document.querySelectorAll("main").length;
	const countArticle = document.querySelectorAll("article").length;
	const countSection = document.querySelectorAll("section").length;
	const countP = document.querySelectorAll("p").length;
	const countH2 = document.querySelectorAll("h2").length;
	const countH3 = document.querySelectorAll("h3").length;
	const countH4 = document.querySelectorAll("h4").length;
	const countHeader = document.querySelectorAll("header").length;
	const countFooter = document.querySelectorAll("footer").length;

	const domElementCount = document.querySelectorAll("*").length;

	let domDepth = 0;
	if (document.documentElement) {
		const getDepth = (el: Element): number => {
			let maxDepth = 0;
			for (let i = 0; i < el.children.length; i++) {
				maxDepth = Math.max(maxDepth, getDepth(el.children[i]));
			}
			return 1 + maxDepth;
		};
		domDepth = getDepth(document.documentElement);
	}

	const ogTags = Array.from(
		document.querySelectorAll('meta[property^="og:"]'),
	).map((meta) => ({
		property: meta.getAttribute("property") || "",
		content: meta.getAttribute("content") || "",
	}));
	const ogImage =
		toAbsoluteUrl(
			document
				.querySelector('meta[property="og:image"]')
				?.getAttribute("content") || null,
		) || null;

	const twitterTags = Array.from(
		document.querySelectorAll('meta[name^="twitter:"]'),
	).map((meta) => ({
		name: meta.getAttribute("name") || "",
		content: meta.getAttribute("content") || "",
	}));
	const twitterImage =
		toAbsoluteUrl(
			document
				.querySelector('meta[name="twitter:image"]')
				?.getAttribute("content") || null,
		) || null;

	const iconLinks = Array.from(document.querySelectorAll("link[rel][href]"))
		.filter((link) => {
			const relValue = (link.getAttribute("rel") || "").toLowerCase();
			return relValue.includes("icon");
		})
		.map((link) => ({
			rel: link.getAttribute("rel") || "",
			href: toAbsoluteUrl(link.getAttribute("href")) || "",
			sizes: link.getAttribute("sizes"),
			type: link.getAttribute("type"),
		}))
		.filter((link) => link.href.length > 0);

	const allAnchors = Array.from(
		document.querySelectorAll<HTMLAnchorElement>("a[href]"),
	);
	const seenInternal = new Map<string, number>();
	const seenExternal = new Map<string, number>();
	const internalLinks: Array<{ href: string; text: string }> = [];
	const externalLinks: Array<{ href: string; text: string }> = [];

	for (const anchor of allAnchors) {
		const rawHref = anchor.getAttribute("href");
		const absoluteHref = toAbsoluteUrl(rawHref);
		if (!absoluteHref) continue;

		let parsedUrl: URL;
		try {
			parsedUrl = new URL(absoluteHref);
		} catch {
			continue;
		}

		const text = extractAnchorText(anchor);
		const payload = { href: parsedUrl.href, text };
		const isInternal = parsedUrl.origin === currentUrl.origin;

		if (isInternal) {
			const existingIndex = seenInternal.get(parsedUrl.href);
			if (existingIndex !== undefined) {
				if (!internalLinks[existingIndex].text && text) {
					internalLinks[existingIndex].text = text;
				}
				continue;
			}
			seenInternal.set(parsedUrl.href, internalLinks.length);
			internalLinks.push(payload);
			continue;
		}

		const existingIndex = seenExternal.get(parsedUrl.href);
		if (existingIndex !== undefined) {
			if (!externalLinks[existingIndex].text && text) {
				externalLinks[existingIndex].text = text;
			}
			continue;
		}
		seenExternal.set(parsedUrl.href, externalLinks.length);
		externalLinks.push(payload);
	}

	// The actual content logic. In SSR sites (e.g. Next.js App Router),
	// <main> might exist but hold zero text (e.g. just a loading spinner SVG),
	// while the actual content was rendered inside a sibling <article> tag.
	const mainElement = document.querySelector("main");
	const mainText = String(mainElement?.textContent); //?.replace(/\s+/g, " ").trim() || "";

	// if (mainText.length < 50) {
	// 	const articleElement = document.querySelector("article, #main, [role='main']");
	// 	mainText = articleElement?.textContent?.replace(/\s+/g, " ").trim() || "";
	// }

	return {
		title,
		metaDescription,
		canonicalUrl,
		htmlLang,
		viewportMeta,
		h1List,
		countMain,
		countArticle,
		countSection,
		countP,
		countH2,
		countH3,
		countH4,
		countHeader,
		countFooter,
		domElementCount,
		domDepth,
		ogTags,
		ogImage,
		twitterTags,
		twitterImage,
		iconLinks,
		internalLinks,
		externalLinks,
		mainText,
	};
};
