export const geometricMean = (values: number[]): number => {
	if (values.length === 0) return 0;
	// Prevent negative values from breaking the math
	const product = values.reduce((acc, val) => acc * Math.max(0, val), 1);
	return product ** (1 / values.length);
};

export const clamp = (value: number, min = 0, max = 1): number => {
	return Math.min(Math.max(value, min), max);
};
