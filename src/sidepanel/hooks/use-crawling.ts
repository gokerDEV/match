import { useCallback, useEffect, useMemo, useState } from "react";
import { metricDescriptions } from "@/lib/engine/plan";
import type { Extractions, Inputs, Metrics } from "@/lib/types/engine";
import type {
	GET_CACHED_EXTRACTIONS_MESSAGE,
	GET_CACHED_EXTRACTIONS_RESPONSE,
	RUN_ANALYSIS_MESSAGE,
	RUN_ANALYSIS_RESPONSE,
} from "@/services/messaging";
import type {
	CrawlingBatch,
	CrawlingResultItem,
	CsvRow,
} from "@/sidepanel/components/crawling/types";

const SESSION_TAB_KEY = "match_last_tab_id";
const CRAWL_STORAGE_PREFIX = "match_crawl_batch";

interface CrawlingCacheState {
	fileName: string;
	rows: CsvRow[];
	batchSize: number;
	sleepMs: number;
	batches: CrawlingBatch[];
	selectedBatchIndex: number | null;
	running: boolean;
	initialized: boolean;
	error: string | null;
	sessionId: string;
}

let crawlCache: CrawlingCacheState = {
	fileName: "",
	rows: [],
	batchSize: 100,
	sleepMs: 1000,
	batches: [],
	selectedBatchIndex: null,
	running: false,
	initialized: false,
	error: null,
	sessionId: "",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchActiveTab = async (): Promise<{
	tabId: number;
	url: string;
} | null> => {
	try {
		const result = await chrome.storage.session.get(SESSION_TAB_KEY);
		const tabId = result[SESSION_TAB_KEY];
		if (typeof tabId !== "number") return null;
		const tab = await chrome.tabs.get(tabId);
		if (tab?.id && tab.url) return { tabId: tab.id, url: tab.url };
		return null;
	} catch {
		return null;
	}
};

const waitForTabComplete = async (
	tabId: number,
	timeoutMs = 30000,
): Promise<void> => {
	const tab = await chrome.tabs.get(tabId);
	if (tab.status === "complete") return;

	await new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			chrome.tabs.onUpdated.removeListener(onUpdated);
			reject(new Error("Tab load timeout"));
		}, timeoutMs);

		const onUpdated = (
			updatedTabId: number,
			changeInfo: { status?: string },
		) => {
			if (updatedTabId !== tabId) return;
			if (changeInfo.status !== "complete") return;
			clearTimeout(timeout);
			chrome.tabs.onUpdated.removeListener(onUpdated);
			resolve();
		};

		chrome.tabs.onUpdated.addListener(onUpdated);
	});
};

const normalizeHeader = (value: string) =>
	value.trim().toLowerCase().replace(/\s+/g, " ");

const splitCsvLine = (line: string): string[] =>
	line
		.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
		.map((part) => part.trim().replace(/^"(.*)"$/, "$1"));

const parseCsv = (raw: string): CsvRow[] => {
	const lines = raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length < 2) {
		throw new Error("CSV must include header and at least one row.");
	}

	const headers = splitCsvLine(lines[0]).map(normalizeHeader);
	const idIndex = headers.indexOf("id");
	const searchIndex = headers.indexOf("search term");
	const urlIndex = headers.indexOf("url");
	if (idIndex < 0 || searchIndex < 0 || urlIndex < 0) {
		throw new Error('CSV header must be: "id, search term, url".');
	}

	const rows: CsvRow[] = [];
	for (let i = 1; i < lines.length; i++) {
		const parts = splitCsvLine(lines[i]);
		const id = (parts[idIndex] || "").trim();
		const searchTerm = (parts[searchIndex] || "").trim();
		const url = (parts[urlIndex] || "").trim();
		if (!id || !url) continue;
		rows.push({ id, searchTerm, url });
	}

	return rows;
};

const createBatches = (rows: CsvRow[], batchSize: number): CrawlingBatch[] => {
	const safeBatchSize = Math.max(1, Math.floor(batchSize));
	const total = rows.length;
	const batches: CrawlingBatch[] = [];
	for (
		let start = 0, index = 0;
		start < total;
		start += safeBatchSize, index++
	) {
		const end = Math.min(start + safeBatchSize, total);
		const slice = rows.slice(start, end);
		batches.push({
			index,
			start,
			end,
			status: "pending",
			completedCount: 0,
			items: slice.map(
				(row): CrawlingResultItem => ({
					id: row.id,
					searchTerm: row.searchTerm,
					url: row.url,
					visitedUrl: row.url,
					scores: null,
					status: "pending",
				}),
			),
		});
	}
	return batches;
};

const extractionFromCache = async (
	url: string,
): Promise<Extractions | null> => {
	try {
		const response = await chrome.runtime.sendMessage<
			GET_CACHED_EXTRACTIONS_MESSAGE,
			GET_CACHED_EXTRACTIONS_RESPONSE
		>({
			type: "GET_CACHED_EXTRACTIONS",
			payload: { url },
		});
		if (response?.success && response.data) return response.data;
		return null;
	} catch {
		return null;
	}
};

const buildScoresPayload = (batch: CrawlingBatch) => ({
	description:
		"Crawling batch MATCH report. Each item includes inputs and metrics.",
	metricDescriptions,
	results: batch.items.map((item) => ({
		id: item.id,
		inputs:
			item.inputs ??
			({
				url: item.url,
				searchTerm: item.searchTerm,
				timestamp: 0,
			} as Inputs),
		metrics: item.metrics ?? ({} as Metrics),
		scores: item.scores ?? [],
		status: item.status,
		error: item.error,
	})),
});

const buildExtractionsPayload = (batch: CrawlingBatch) =>
	batch.items.map((item) => ({
		id: item.id,
		url: item.url,
		visitedUrl: item.visitedUrl,
		searchTerm: item.searchTerm,
		status: item.status,
		error: item.error,
		extractions: item.extractions ?? null,
	}));

const downloadJson = async (filename: string, payload: unknown) => {
	const json = JSON.stringify(payload, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	await chrome.downloads.download({
		url,
		filename,
		saveAs: true,
	});
	URL.revokeObjectURL(url);
};

export const useCrawling = () => {
	const [fileName, setFileName] = useState(() => crawlCache.fileName);
	const [rows, setRows] = useState<CsvRow[]>(() => crawlCache.rows);
	const [batchSize, setBatchSize] = useState(() => crawlCache.batchSize);
	const [sleepMs, setSleepMs] = useState(() => crawlCache.sleepMs);
	const [batches, setBatches] = useState<CrawlingBatch[]>(
		() => crawlCache.batches,
	);
	const [selectedBatchIndex, setSelectedBatchIndex] = useState<number | null>(
		() => crawlCache.selectedBatchIndex,
	);
	const [running, setRunning] = useState(() => crawlCache.running);
	const [error, setError] = useState<string | null>(() => crawlCache.error);
	const [sessionId, setSessionId] = useState(() => crawlCache.sessionId);

	const totalCount = rows.length;
	const completedCount = useMemo(
		() =>
			batches.reduce(
				(acc, batch) =>
					acc + batch.items.filter((item) => item.status !== "pending").length,
				0,
			),
		[batches],
	);
	const progressValue =
		totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

	useEffect(() => {
		crawlCache = {
			fileName,
			rows,
			batchSize,
			sleepMs,
			batches,
			selectedBatchIndex,
			running,
			initialized: true,
			error,
			sessionId,
		};
	}, [
		fileName,
		rows,
		batchSize,
		sleepMs,
		batches,
		selectedBatchIndex,
		running,
		error,
		sessionId,
	]);

	const handleFile = useCallback(
		async (file: File) => {
			try {
				const text = await file.text();
				const parsedRows = parseCsv(text);
				if (parsedRows.length === 0) {
					throw new Error("CSV parsed but no valid rows were found.");
				}
				const createdBatches = createBatches(parsedRows, batchSize);
				const nextSessionId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
				setFileName(file.name);
				setRows(parsedRows);
				setBatches(createdBatches);
				setSessionId(nextSessionId);
				setSelectedBatchIndex(null);
				setError(null);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to parse CSV file.",
				);
			}
		},
		[batchSize],
	);

	const reBatch = useCallback(
		(nextBatchSize: number) => {
			setBatchSize(nextBatchSize);
			if (rows.length === 0 || running) return;
			setBatches(createBatches(rows, nextBatchSize));
			setSelectedBatchIndex(null);
		},
		[rows, running],
	);

	const start = useCallback(async () => {
		if (running || batches.length === 0) return;
		setError(null);
		setRunning(true);

		try {
			const activeTab = await fetchActiveTab();
			if (!activeTab) {
				throw new Error("No active tab found.");
			}

			for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
				setSelectedBatchIndex(batchIndex);
				setBatches((prev) =>
					prev.map((batch, index) =>
						index === batchIndex ? { ...batch, status: "running" } : batch,
					),
				);

				const currentBatchItems = batches[batchIndex].items;
				const workingItems = [...currentBatchItems];
				for (
					let itemIndex = 0;
					itemIndex < currentBatchItems.length;
					itemIndex++
				) {
					const csvItem = currentBatchItems[itemIndex];

					try {
						await chrome.tabs.update(activeTab.tabId, { url: csvItem.url });
						await waitForTabComplete(activeTab.tabId);
						const tabAfter = await chrome.tabs.get(activeTab.tabId);
						const visitedUrl = tabAfter.url || csvItem.url;

						const response = await chrome.runtime.sendMessage<
							RUN_ANALYSIS_MESSAGE,
							RUN_ANALYSIS_RESPONSE
						>({
							type: "RUN_ANALYSIS",
							payload: {
								tabId: activeTab.tabId,
								url: visitedUrl,
								searchTerm: csvItem.searchTerm,
								force: true,
							},
						});

						if (
							!response?.success ||
							!response.scores ||
							!response.inputs ||
							!response.metrics
						) {
							throw new Error(response?.error || "RUN_ANALYSIS failed");
						}

						const extractions = await extractionFromCache(response.inputs.url);

						workingItems[itemIndex] = {
							id: csvItem.id,
							searchTerm: csvItem.searchTerm,
							url: csvItem.url,
							visitedUrl,
							status: "done",
							scores: response.scores || null,
							inputs: response.inputs,
							metrics: response.metrics,
							extractions,
						};
					} catch (itemErr) {
						workingItems[itemIndex] = {
							id: csvItem.id,
							searchTerm: csvItem.searchTerm,
							url: csvItem.url,
							visitedUrl: csvItem.url,
							status: "error",
							scores: null,
							error:
								itemErr instanceof Error
									? itemErr.message
									: "Unknown batch item error",
						};
					}

					setBatches((prev) =>
						prev.map((batch, index) => {
							if (index !== batchIndex) return batch;
							return {
								...batch,
								items: [...workingItems],
								completedCount: workingItems.filter(
									(item) => item.status !== "pending",
								).length,
							};
						}),
					);
				}

				const hasError = workingItems.some((item) => item.status === "error");
				const finalizedBatch: CrawlingBatch = {
					...batches[batchIndex],
					items: [...workingItems],
					completedCount: workingItems.length,
					status: hasError ? "error" : "completed",
				};

				setBatches((prev) =>
					prev.map((batch, index) =>
						index === batchIndex ? finalizedBatch : batch,
					),
				);

				const scoresPayload = buildScoresPayload(finalizedBatch);
				const extractionsPayload = buildExtractionsPayload(finalizedBatch);

				await chrome.storage.local.set({
					[`${CRAWL_STORAGE_PREFIX}_${sessionId}_${batchIndex}_scores`]:
						scoresPayload,
					[`${CRAWL_STORAGE_PREFIX}_${sessionId}_${batchIndex}_extractions`]:
						extractionsPayload,
				});

				setSelectedBatchIndex(null);
				if (batchIndex < batches.length - 1) {
					await sleep(Math.max(0, sleepMs));
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Crawling failed.");
		} finally {
			setRunning(false);
		}
	}, [batches, running, sessionId, sleepMs]);

	const downloadBatchScores = useCallback(
		async (batchIndex: number) => {
			const key = `${CRAWL_STORAGE_PREFIX}_${sessionId}_${batchIndex}_scores`;
			const saved = await chrome.storage.local.get(key);
			const payload = saved[key];
			if (!payload) return;
			await downloadJson(
				`match-crawling-batch-${batchIndex + 1}-scores-${Date.now()}.json`,
				payload,
			);
		},
		[sessionId],
	);

	const downloadBatchExtractions = useCallback(
		async (batchIndex: number) => {
			const key = `${CRAWL_STORAGE_PREFIX}_${sessionId}_${batchIndex}_extractions`;
			const saved = await chrome.storage.local.get(key);
			const payload = saved[key];
			if (!payload) return;
			await downloadJson(
				`match-crawling-batch-${batchIndex + 1}-extractions-${Date.now()}.json`,
				payload,
			);
		},
		[sessionId],
	);

	const activeBatch =
		selectedBatchIndex !== null ? batches[selectedBatchIndex] || null : null;

	return {
		fileName,
		rows,
		batchSize,
		sleepMs,
		batches,
		activeBatch,
		selectedBatchIndex,
		running,
		error,
		totalCount,
		completedCount,
		progressValue,
		setSleepMs,
		reBatch,
		handleFile,
		start,
		setSelectedBatchIndex,
		downloadBatchScores,
		downloadBatchExtractions,
	};
};
