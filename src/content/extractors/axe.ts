import axe from "axe-core";

export const extractAxeSignals = async () => {
	try {
		// Run a quick scan on the document
		const results = await axe.run(document, {
			runOnly: {
				type: "tag",
				values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
			},
		});
		return {
			axePasses: results.passes.length,
			axeViolations: results.violations.length,
		};
	} catch (err) {
		console.error("Axe core failed to run:", err);
		return {
			axePasses: 0,
			axeViolations: 0,
		};
	}
};
