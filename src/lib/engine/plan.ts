// Auto-generated. Do not edit manually.

import { resolver as title_lengthResolver } from "../../metrics/title_length";
import { resolver as meta_lengthResolver } from "../../metrics/meta_length";
import { resolver as metadata_precisionResolver } from "../../metrics/metadata_precision";
import { resolver as viewport_presenceResolver } from "../../metrics/viewport_presence";
import { resolver as h1_uniquenessResolver } from "../../metrics/h1_uniqueness";
import { resolver as axe_scoreResolver } from "../../metrics/axe_score";
import { resolver as access_qualityResolver } from "../../metrics/access_quality";
import { resolver as structure_scoreResolver } from "../../metrics/structure_score";
import { resolver as hierarchy_integrityResolver } from "../../metrics/hierarchy_integrity";
import { resolver as main_similarityResolver } from "../../metrics/main_similarity";
import { resolver as title_similarityResolver } from "../../metrics/title_similarity";
import { resolver as h1_similarityResolver } from "../../metrics/h1_similarity";
import { resolver as lang_presenceResolver } from "../../metrics/lang_presence";
import { resolver as technical_hygieneResolver } from "../../metrics/technical_hygiene";
import { resolver as contextual_relevancyResolver } from "../../metrics/contextual_relevancy";

import type { Extractions, Inputs, Metrics } from "../types/engine";

export const metricDescriptions: Record<string, string> = {
	title_length: "Checks if the page title has an optimal length for search and display. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	meta_length: "Checks if the meta description has an optimal length for search context. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	metadata_precision: "Composite score determining the quality and precision of basic HTML metadata tags. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	viewport_presence: "Checks if the viewport meta tag is properly defined for responsive design. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	h1_uniqueness: "Checks the existence and uniqueness of the H1 tag. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	axe_score: "Calculates the accessibility score based on axe-core violations vs passes ratio. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	access_quality: "Composite score representing automated and deterministic accessibility passes. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	structure_score: "Evaluates the overall HTML block structure based on main and article tags. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	hierarchy_integrity: "Composite score determining the structural and hierarchical integrity of the document outline. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	main_similarity: "Calculates the similarity factor of the main text with relation to the requested search term. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	title_similarity: "Calculates the similarity factor of the title against the requested search term. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	h1_similarity: "Calculates the similarity factor of the heading elements against the requested search term. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	lang_presence: "Checks if the HTML tag has a proper lang attribute set. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	technical_hygiene: "Composite score determining the presence of fundamental technical attributes. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
	contextual_relevancy: "Composite score determining how contextually relevant the page is to the search term. Normalization explanation: Calculates a value between 0 and 1 based on optimal bounds or presence of required fields.",
};

export const runMetrics = async (
	extractions: Extractions,
	inputs: Inputs,
): Promise<{ metrics: Metrics; logs: string[] }> => {
	const metrics: Metrics = {};
	const logs: string[] = [];

	const exec = async (
		name: string,
		resolver: (
			ext: Extractions,
			met: Metrics,
			inp: Inputs,
		) => Promise<{ raw: number; normalized: number }> | { raw: number; normalized: number },
	) => {
		try {
			metrics[name] = await resolver(extractions, metrics, inputs);
			logs.push(`${name}: OK`);
		} catch (error) {
			metrics[name] = { raw: 0, normalized: 0 };
			logs.push(
				`${name}: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	await exec("title_length", title_lengthResolver);
	await exec("meta_length", meta_lengthResolver);
	await exec("metadata_precision", metadata_precisionResolver);
	await exec("viewport_presence", viewport_presenceResolver);
	await exec("h1_uniqueness", h1_uniquenessResolver);
	await exec("axe_score", axe_scoreResolver);
	await exec("access_quality", access_qualityResolver);
	await exec("structure_score", structure_scoreResolver);
	await exec("hierarchy_integrity", hierarchy_integrityResolver);
	await exec("main_similarity", main_similarityResolver);
	await exec("title_similarity", title_similarityResolver);
	await exec("h1_similarity", h1_similarityResolver);
	await exec("lang_presence", lang_presenceResolver);
	await exec("technical_hygiene", technical_hygieneResolver);
	await exec("contextual_relevancy", contextual_relevancyResolver);

	return { metrics, logs };
};
