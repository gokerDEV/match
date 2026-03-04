export const extractTechSignals = () => {
	// Let's get generic perf and tech info.
	// We can't catch all network/console errors unless injected early,
	// but we can look at performance metrics.

	let ttfb = 0;
	let domInteractive = 0;

	try {
		const navEntry = performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;
		if (navEntry) {
			ttfb = navEntry.responseStart - navEntry.requestStart;
			domInteractive = navEntry.domInteractive - navEntry.startTime;
		}
	} catch (_e) {
		// ignore
	}

	const resources = performance.getEntriesByType("resource");
	// Check for obvious 404s (we can't always get status, but we can count resources)
	const resourceCount = resources.length;

	let fcp = 0;
	try {
		const paintEntries = performance.getEntriesByType("paint");
		const fcpEntry = paintEntries.find(
			(entry) => entry.name === "first-contentful-paint",
		);
		if (fcpEntry) {
			fcp = fcpEntry.startTime;
		}
	} catch (_e) {
		// ignore
	}

	return {
		performance: {
			ttfb,
			domInteractive,
			fcp,
			resourceCount,
		},
		consoleErrors: 0, // In manifest MVP we might not have these unless via debugging API
	};
};
