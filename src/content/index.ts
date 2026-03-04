import type { Extractions } from "@/lib/types/engine";
import type { EXTRACT_SIGNALS_RESPONSE } from "@/services/messaging";
import { extractAxeSignals } from "./extractors/axe";
import { extractDomSignals } from "./extractors/dom";
import { extractTechSignals } from "./extractors/tech";

// ─── SPA / CSR DOM Ready Guard ───────────────────────────────────────────────
function waitForDom(timeoutMs = 8000): Promise<void> {
	return new Promise((resolve) => {
		let observer: MutationObserver | null = null;
		let settleTimeout: ReturnType<typeof setTimeout> | null = null;

		const complete = () => {
			if (observer) observer.disconnect();
			if (settleTimeout) clearTimeout(settleTimeout);
			resolve();
		};

		const check = () => {
			const mainEl =
				document.querySelector("main") || document.querySelector("article");
			const mainLen =
				mainEl?.textContent?.replace(/\s+/g, " ").trim().length ?? 0;

			// We must wait until the <main> text is populated!
			// If it's a SPA, the main tag might exist but be empty initially.
			// If there's truly NO main/article element, we fallback to body length,
			// but if they exist, we STRICTLY wait for them to have content.
			const isReady =
				document.readyState === "complete" &&
				(mainEl ? mainLen > 50 : document.body.innerText.length > 200);

			if (isReady) {
				complete();
				return true;
			}
			return false;
		};

		if (!check()) {
			// If not ready, we watch the DOM for changes
			observer = new MutationObserver(() => {
				if (check()) {
					complete();
				}
			});

			observer.observe(document.body || document.documentElement, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: true,
			});

			// If things never populate, force resolve when deadline hits
			settleTimeout = setTimeout(() => {
				complete();
			}, timeoutMs);
		}
	});
}

// ─── Message Listener ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
	(message: unknown, _sender, sendResponse) => {
		const msg = message as { type?: string };
		if (msg.type !== "EXTRACT_SIGNALS") return;

		(async () => {
			const debug: string[] = [];
			const log = (...args: unknown[]) => {
				const line = args
					.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
					.join(" ");
				debug.push(line);
			};

			try {
				await waitForDom();

				// Re-verify the DOM before extracting
				const domSignals = extractDomSignals();

				// Academic Debugging: If mainText is empty or low, log precisely what <main> looks like
				if ((domSignals.mainText?.length ?? 0) < 50) {
					const m = document.querySelector("main");
					log(
						"CRITICAL DEBUG - main HTML:",
						m ? m.outerHTML.substring(0, 1000) : "NULL",
					);
					log(
						"CRITICAL DEBUG - body text length:",
						document.body.innerText.length,
					);
				}

				const axeSignals = await extractAxeSignals();
				const techSignals = extractTechSignals();

				log("readyState      :", document.readyState);
				log("title           :", domSignals.title);
				log("metaDescription :", domSignals.metaDescription);
				log("h1List          :", JSON.stringify(domSignals.h1List));
				log("mainText length :", domSignals.mainText?.length ?? 0);
				log(
					"mainText preview:",
					domSignals.mainText?.slice(0, 300) ?? "(empty)",
				);
				log("countMain       :", domSignals.countMain);
				log("countArticle    :", domSignals.countArticle);
				log("countSection    :", domSignals.countSection);
				log("countP          :", domSignals.countP);
				log("canonicalUrl    :", domSignals.canonicalUrl);
				log("domElementCount :", domSignals.domElementCount);
				log("techSignals     :", JSON.stringify(techSignals));
				log("axeSignals keys :", Object.keys(axeSignals).join(", "));

				const payload: Extractions = {
					...domSignals,
					...axeSignals,
					...techSignals,
				};

				sendResponse({
					success: true,
					data: payload,
					debug,
				} as EXTRACT_SIGNALS_RESPONSE);
			} catch (err) {
				debug.push(
					`ERROR: ${err instanceof Error ? err.message : String(err)}`,
				);
				sendResponse({
					success: false,
					error:
						err instanceof Error
							? err.message
							: "Unknown error in content extraction",
					debug,
				} as EXTRACT_SIGNALS_RESPONSE);
			}
		})();

		return true;
	},
);
