export const extractDomSignals = () => {
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

	const twitterTags = Array.from(
		document.querySelectorAll('meta[name^="twitter:"]'),
	).map((meta) => ({
		name: meta.getAttribute("name") || "",
		content: meta.getAttribute("content") || "",
	}));

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
		twitterTags,
		mainText,
	};
};
