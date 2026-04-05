# MATCH Specification

## 1. Purpose and Scope

MATCH is a deterministic, local-first Web Quality Linter delivered as a Chrome Extension (Manifest V3).
It evaluates a page against strict engineering and semantic standards.

MATCH does NOT aim to discover what a website "has".
MATCH answers: "Is what MUST exist present, and is it correct?"

This repository will deliver:
1) A Chrome Extension (Manifest V3) with:
   - Popup (quick check on current tab)
   - Sidepanel (check, extraction, deep-dive, crawling workflows)
   - Dashboard (advanced multi-run + history)
2) A deterministic scoring engine:
   - Metric registry (plugins)
   - Static execution plan (build-time)
   - Runtime extraction + resolution
3) Outputs:
   - Heatmap grid (MATCH columns)
   - JSON report (agent/AI-friendly)

Motto:
"Engineering Honesty for the Web"


---

## 2. Technical Stack

### 2.1 Runtime & Build
- Bun
- TypeScript
- Vite
- React

### 2.2 UI & Utilities
- Tailwind CSS v4
- Radix UI primitives
- class-variance-authority
- clsx
- tailwind-merge
- lucide-react
- tw-animate-css

### 2.3 Code Quality
- Biome (`@biomejs/biome`)

### 2.4 Extension Tooling
- `@crxjs/vite-plugin`
- `@types/chrome`

### 2.5 Core Libraries (Critical Logic)

To maintain the 0-Cost / Local-First policy, the following libraries are integrated for deep analysis without remote API calls:

- **axe-core (Accessibility Engine)**:
  - **Purpose**: Primary provider for the "A - Access Quality" pillar.
  - **Implementation**: Injected via content scripts to run automated accessibility audits directly against the DOM.
  - **Why**: Industry standard for deterministic a11y checks.

- **@xenova/transformers (Transformers.js)**:
  - **Purpose**: Local NLP and Vector Embeddings.
  - **Use Case**: Generates semantic vectors for search_term vs. h1/content comparison to calculate cosine similarity.
  - **Implementation**: Runs ONNX models via WebAssembly (Wasm) inside the extension's background service worker or dashboard.
  - **Policy**: Models are cached locally after first use. No external inference calls.

- **Chrome Built-in AI (window.ai / Gemini Nano)**:
  - **Purpose**: High-level semantic reasoning and quality interpretation.
  - **Use Case**: Scoring the "intent" and "nuance" of metadata and content headers.
  - **Implementation**: Utilizes the user's local hardware via the experimental Prompt API.
  - **No-Fallback Policy**: If `window.ai` is disabled or Transformers.js fails due to hardware/browser limitations, MATCH will NOT fallback to remote APIs (OpenAI, Gemini API, etc.). Instead, it MUST trigger a "Browser Update / AI Support Required" alert to the user.

---

## 3. MATCH Model

MATCH is a 5-column heatmap system.

### 3.1 MATCH Columns (Pillars)

- M — Metadata Precision
  Title + essential meta correctness.

- A — Access Quality
  Strict A11y baseline checks (deterministic).

- T — Technical Hygiene
  Console/runtime/network hygiene and technical cleanliness (NOT performance scoring).

- C — Contextual Relevancy
  Page content alignment with the user-provided Search Term.

- H — Hierarchy Integrity
  Structural and semantic correctness: main/article/heading integrity/landmarks.

Each column is represented by a Proxy Metric (see Metric System).


---

## 4. Functional Requirements

### 4.1 Inputs & Validation

MATCH must support:

**Input Types**
- URL (single or list)
- Search Term (text)

**URL Normalization**
- If protocol missing, default to `https://`
- Trim whitespace
- Remove trailing spaces and normalize casing where safe
- Reject non-http(s) URLs

**Search Term**
- Optional for running the engine globally
- Required for Contextual Relevancy column:
  - If empty, Contextual proxy metric MUST return a neutral/disabled state (defined below)

### 4.2 Outputs

**UI Output**
- MATCH heatmap grid (5 columns)
- Per-row overall state (optional)

**Export**
- JSON Report (single URL run OR batch run)
- Export must be deterministic and stable (no random fields)

### 4.3 Live Preview
- UI must reflect results immediately after a run completes
- Partial batch results must progressively render row-by-row


---

## 5. Chrome Extension UX

### 5.1 Popup (Quick Actions)
The extension popup is the primary entry point for quick checks.

**Popup Behavior**
- On open:
  - Capture current tab URL automatically
  - Pre-fill Search Term (last used) if available
- Single-click Generate:
  - Run MATCH on the current tab URL
  - Render heatmap row (single URL)
- Download:
  - Provide a clear “Download Report (JSON)” action

**Popup Footer**
- Link: "MATCH Dashboard"
- Action: Opens the full dashboard in a new tab

### 5.2 Dashboard (Advanced)
Dashboard supports advanced usage.

**Core Features**
- Multi-URL input (paste list)
- Search Term input
- Batch generation with progress feedback
- History list + re-run

**History & Persistence**
- Local-only:
  - `chrome.storage.local` preferred
- Capacity:
  - Last 100 records (FIFO)
- User must be able to:
  - Clean History
  - Delete a single record

### 5.3 Sidepanel (Operational Console)
The sidepanel is the power-user analysis surface inside the browser.

**Views**
- **Check**: Runs MATCH on active tab and provides per-column detail panels.
- **Extraction**: Displays cached extraction signals for active tab.
- **Deep Dive**: Runs MATCH sequentially over internal links of active page.
- **Crawling**: Runs MATCH in batches from CSV input.

**Deep Dive Requirements**
- Internal links are prepared from cached extraction data.
- Links must be normalized and de-duplicated when "remove duplicate links" is enabled (default: true).
- A default max-link cap MUST be applied (default: 100).
- Search term for each internal link should use extracted link text; if missing, fallback from URL path; if still missing, use empty string.
- Start button toggles into pause/resume state while running.
- Progress must update incrementally per finished link.
- Completed rows must be openable and hydrate Check view for the clicked row.
- Deep-dive state must persist across sidepanel view navigation until a new start action.

**Crawling Requirements**
- Input CSV format: `id, search term, url`.
- Batch size and sleep duration between batches are configurable.
- Start button toggles into pause/resume state while running.
- Progress must update incrementally per processed row.
- Each row result must preserve and expose its source `id`.
- Completed batch artifacts (scores and extractions) must be persisted and downloadable per batch.
- Completed row items must be openable and hydrate Check view for the clicked row.
- Crawling state must persist across sidepanel view navigation until a new session/file load.

---

## 6. Engine Architecture

### 6.1 Deterministic Pipeline

Runtime pipeline:
1) Load page (analysis target)
2) Extract (DOM + optional deep signals)
3) Execute metrics in static plan order
4) Compute proxy metrics (MATCH columns)
5) Persist + render + export

### 6.2 Static Execution Plan (Build-Time)
Metric dependencies and execution ordering MUST be resolved at build time.

Build-time step:
- Scan `src/metrics/**/config.json`
- Build dependency graph
- Validate:
  - Missing dependency ids
  - Cycles (circular dependencies)
- Generate:
  - `executionPlan: string[]` (metric id list in execution order)
  - `metricIndex: Record<id, config + resolverRef>`

At runtime:
- No dynamic topo-sort
- No runtime directory scanning
- Engine runs metrics strictly in `executionPlan`

### 6.3 Metric System (Plugins)

Each metric lives in:
`src/metrics/<unique_id>/`
- `config.json`
- `index.ts`

**Metric Types**
- `absolute`:
  - uses `extractions` (+ optional `inputs`, `metrics`)
- `proxy`:
  - uses only `metrics` (+ optional `inputs`)
  - depends on other metric ids

**Metric Config Contract**
```json
{
  "id": "h1_count_integrity",
  "type": "absolute",
  "inputs": ["h1List"],
  "dependencies": [],
  "constraints": { "min": 0, "max": 10, "ideal": 1 },
  "description": "Checks the existence and uniqueness of the H1 tag."
}
```

Notes:
- inputs are extraction keys (string references)
- description is sufficient for UI and export


### 6.4 Resolver Contract

Resolver receives 3 objects:

```typescript
interface Extractions {
  // Explicit keys OR index signature (v1 can use index signature)
  [key: string]: string | string[] | number | boolean | null;
}

interface Metrics {
  [metricId: string]: number; // normalized [0..1]
}

interface Inputs {
  url: string;
  searchTerm: string;
  timestamp: number;
}

export const resolver = (
  extractions: Extractions,
  metrics: Metrics,
  inputs: Inputs
): number => {
  return 1.0; // must be [0..1]
};
```

### 6.5 Proxy Metrics for MATCH Columns

MATCH columns MUST be represented as proxy metrics:
- `m_metadata_precision`
- `a_access_quality`
- `t_technical_hygiene`
- `c_contextual_relevancy`
- `h_hierarchy_integrity`

Proxy reducer rule MUST be deterministic and centralized:
- default: geometric mean (harsh, no tolerance)
- clamp output to [0..1]

**Contextual (C) without Search Term**
If `inputs.searchTerm` is empty:
- `c_contextual_relevancy` MUST return: `1.0` (neutral pass) OR a fixed neutral constant
- UI must visually mark it as "not evaluated" (optional)

This keeps the 5-column grid stable without introducing extra states into resolver output.

---

## 7. Page Loading & Extraction (Runtime)

MATCH must support two analysis modes:

### 7.1 Mode 1 — Current Tab (Popup Default)
- Use the active tab the user is currently viewing.
- Inject content script to extract DOM-based signals.
- Minimal friction and minimal permissions.



### 7.3 Readiness / Stabilization
Extraction MUST run after the page becomes stable.
Stability conditions (deterministic):
- `document.readyState === "complete"`
- wait 2 animation frames
- wait a quiet window (no significant DOM mutations for N ms)

### 7.4 Extraction Payload (Minimum v1)
Engine must extract only what it needs for strict checks.
Minimum recommended extraction keys (v1):
- `title: string | null`
- `metaDescription: string | null`
- `canonicalUrl: string | null`
- `robotsMeta: string | null`
- `htmlLang: string | null`
- `viewportMeta: string | null`
- `h1List: string[]`
- `headingOutline: Array<{ level: number; text: string }>`
- `hasMain: boolean`
- `hasArticle: boolean`
- `landmarks: string[]`
- `hasSkipLink: boolean`
- `mainText: string` (normalized)
- `links: Array<{ href: string; text: string }>`
- `images: Array<{ src: string; alt: string | null }>`

For extraction link text quality, collectors should use fallback fields when visible anchor text is empty:
- `aria-label`
- `title`
- child image `alt`
- icon/svg title text

Technical hygiene signals are optional by mode (see below).

### 7.5 Technical Hygiene Signals (Strict but Optional Permission)
Technical hygiene can be implemented in two tiers:

- **Tier A (default)**:
  DOM-level and basic signals only (safe, minimal permissions)
- **Tier B (deep hygiene)**:
  Console errors / runtime exceptions / network failures
  Requires Chrome debugging instrumentation.
  MUST be optional and clearly user-triggered in UI.
  If disabled, related metrics must return neutral values (deterministic).

This keeps MATCH usable with minimal permissions while allowing a strict mode for power users.

---

## 8. Color Palette (MATCH)

| Pillar | Column | Brand HEX | Heat Max HEX |
|---|---|---|---|
| M | Metadata | `#DD4433` | `#55CCCC` |
| A | Access | `#4488FF` | `#EECC33` |
| T | Technical | `#FFBB00` | `#2288CC` |
| C | Contextual | `#8844BB` | `#88AA55` |
| H | Hierarchy | `#11AA55` | `#993366` |

### 8.1 Heatmap Rule
- Score = 1.0: transparent OR Brand color
- Score < 0.7: interpolate toward Heat Max
- Score = 0.0: Heat Max color

---

## 9. Storage and History

### 9.1 Storage Strategy

Data is stored in `chrome.storage.local` across three distinct stores. Each store follows a FIFO (First-In, First-Out) policy with a 100-record limit.

- **Extractions Store (URL Bound)**:
  - **Key**: `ext_[hash(url)]`
  - **Data**: Raw DOM signals and extracted data (`p_` values).
  - **Logic**: Reusable for any search term on the same URL.
  - **TTL**: 24 hours.

- **Core Pillars Store (URL Bound - MATH)**:
  - **Key**: `math_[hash(url)]`
  - **Data**: Scores for Metadata, Access, Technical, and Hierarchy.
  - **Logic**: These pillars are independent of the search term and are only re-calculated if extractions expire.
  - **TTL**: 24 hours.

- **Contextual Store (URL + SearchTerm Bound - C)**:
  - **Key**: `sim_[hash(url + searchTerm)]`
  - **Data**: Score for Contextual Relevancy.
  - **Logic**: Re-calculated whenever the search term changes, even if MATH pillars are cached.
  - **TTL**: 24 hours.

### 9.2 Cache Control

- **Force Run**: `Ctrl + Click` on the Analyze button bypasses all three stores for a fresh extraction and full re-calculation.

---

## 10. Reports

### 10.1 JSON Report Contract
Export must include:
- inputs
- MATCH proxy scores
- all metric scores (id -> score)

*Descriptions* should  be  static  and  generated  at build  time.  Each report  should include  the  descriptions of  all  metrics. Descriptions  should  NOT be cached or stored  at browser  storage.

Recommended structure:
```json
{
  "version": "1.0",
  "inputs": { "url": "...", "searchTerm": "...", "timestamp": 0 },
  "descriptions": {
    "m_metadata_precision": "Metadata Precision",
    "a_access_quality": "Access Quality",
    "t_technical_hygiene": "Technical Hygiene",
    "c_contextual_relevancy": "Contextual Relevancy",
    "h_hierarchy_integrity": "Hierarchy Integrity",
    "...": "..."
  },
  "metrics": {
    "m_metadata_precision": { "raw": 1, "normalized": 1 },
    "a_access_quality": { "raw": 1, "normalized": 1 },
    "t_technical_hygiene": { "raw": 1, "normalized": 1 },
    "c_contextual_relevancy": { "raw": 1, "normalized": 1 },
    "h_hierarchy_integrity": { "raw": 1, "normalized": 1 },
    "h1_count_integrity": { "raw": 5, "normalized": 0.5 },
    "...": { "raw": 1, "normalized": 1 }
  }
}
```

### 10.2 Batch Report
Batch export must wrap multiple runs:
```json
{ "runs": [ ...singleRunReport ] }
```

### 10.3 Sidepanel Export Artifacts
- **Extraction View Export**: Raw extraction JSON for active URL.
- **Deep Dive Results Export**:
  - `description`
  - `metricDescriptions`
  - `results[]` where each item includes `inputs`, `metrics`, `scores`, `status`, `error`.
- **Deep Dive Extractions Export**:
  - Array of `{ url, searchTerm, status, scores, error, extractions }`.
- **Crawling Batch Exports**:
  - Scores JSON and Extractions JSON downloadable per completed batch.

---

## 12. Security and Privacy
- No remote code execution paths
- Sanitize user-generated payloads before render/export
- Local-first: analysis results remain on device
- Permissions must be minimal and justified

---

## 13. Extension Permissions (MV3)

Required baseline:
- `activeTab` (read current tab URL, run quick analysis)
- `downloads` (save JSON report)
- `storage` (settings + history)

Optional (only if Tier B deep hygiene is implemented):
- Debug instrumentation permission(s)
- Must be opt-in and clearly explained in UI

---
## 14. v2 Plan

### 14.1 Mode 2 — Batch URLs (Dashboard)
- New background tab logic


### 14.2 Accessibility Specification
- WCAG 2.1 AA baseline
- Keyboard operability for all controls
- Visible focus states
- Sufficient contrast in default themes
- Form controls with labels and error messaging
