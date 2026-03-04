import fs from "node:fs";
import path from "node:path";

interface MetricConfig {
    id: string;
    type: "absolute" | "proxy";
    inputs?: string[];
    dependencies?: string[];
    description: string;
}

const metricsDir = path.join(process.cwd(), "src", "metrics");
const libEngineDir = path.join(process.cwd(), "src", "lib", "engine");

const metricFolders = fs
    .readdirSync(metricsDir)
    .filter((f) => fs.statSync(path.join(metricsDir, f)).isDirectory());

const configs: Record<string, MetricConfig> = {};

for (const folder of metricFolders) {
    const configPath = path.join(metricsDir, folder, "config.json");
    if (fs.existsSync(configPath)) {
        configs[folder] = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
}

// Topo-sort
const sorted: string[] = [];
const visited = new Set<string>();
const temp = new Set<string>();

function visit(id: string) {
    if (temp.has(id))
        throw new Error(`Circular dependency detected involving ${id}`);
    if (!visited.has(id)) {
        temp.add(id);
        const deps = configs[id].dependencies || [];
        for (const dep of deps) {
            if (!configs[dep]) throw new Error(`Missing dependency ${dep} for ${id}`);
            visit(dep);
        }
        temp.delete(id);
        visited.add(id);
        sorted.push(id);
    }
}

for (const id of Object.keys(configs)) {
    if (!visited.has(id)) visit(id);
}

// Generate execution plan
let planContent = `// Auto-generated. Do not edit manually.\n\n`;

for (const id of sorted) {
    planContent += `import { resolver as ${id}Resolver } from "../../metrics/${id}";\n`;
}

planContent += `\nimport type { Extractions, Inputs, Metrics } from "../types/engine";\n\n`;

planContent += `export const metricDescriptions: Record<string, string> = {\n`;
for (const id of sorted) {
    planContent += `	${id}: ${JSON.stringify(configs[id].description)},\n`;
}
planContent += `};\n\n`;

planContent += `export const runMetrics = async (\n`;
planContent += `	extractions: Extractions,\n`;
planContent += `	inputs: Inputs,\n`;
planContent += `): Promise<{ metrics: Metrics; logs: string[] }> => {\n`;
planContent += `	const metrics: Metrics = {};\n`;
planContent += `	const logs: string[] = [];\n\n`;

planContent += `	const exec = async (\n`;
planContent += `		name: string,\n`;
planContent += `		resolver: (\n`;
planContent += `			ext: Extractions,\n`;
planContent += `			met: Metrics,\n`;
planContent += `			inp: Inputs,\n`;
planContent += `		) => Promise<{ raw: number; normalized: number }> | { raw: number; normalized: number },\n`;
planContent += `	) => {\n`;
planContent += `		try {\n`;
planContent += `			metrics[name] = await resolver(extractions, metrics, inputs);\n`;
planContent += `			logs.push(\`\${name}: OK\`);\n`;
planContent += `		} catch (error) {\n`;
planContent += `			metrics[name] = { raw: 0, normalized: 0 };\n`;
planContent += `			logs.push(\n`;
planContent += `				\`\${name}: \${error instanceof Error ? error.message : "Unknown error"}\`,\n`;
planContent += `			);\n`;
planContent += `		}\n`;
planContent += `	};\n\n`;

for (const id of sorted) {
    planContent += `	await exec("${id}", ${id}Resolver);\n`;
}

planContent += `\n	return { metrics, logs };\n`;
planContent += `};\n`;

if (!fs.existsSync(libEngineDir)) {
    fs.mkdirSync(libEngineDir, { recursive: true });
}

fs.writeFileSync(path.join(libEngineDir, "plan.ts"), planContent, "utf-8");
console.log("Metrics plan generated successfully.");
