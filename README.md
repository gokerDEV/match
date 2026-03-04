# MATCH

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) 
<!-- ![Chrome Web Store](https://img.shields.io/chrome-web-store/v/fgggldjlbpajaffefpkkhkfdiihinebf) -->

<table width="100%">
  <tr>
    <td width="32px" valign="center"><img src="public/icon.svg" width="32" height="32" alt="MATCH Icon" style="padding-bottom: 10px;" /></td>
    <td>
<table width="100%" style="text-align:center; color:white; font-size:24px; font-weight:bold;">
  <tr>
    <td width="20%" bgcolor="#DD4433">M</td>
    <td width="20%" bgcolor="#4488FF">A</td>
    <td width="20%" bgcolor="#FFBB00">T</td>
    <td width="20%" bgcolor="#8844BB">C</td>
    <td width="20%" bgcolor="#11AA55">H</td>
  </tr>
</table>
</td>
</tr>
</table>

**MATCH** is a deterministic, local-first Web Quality Linter delivered as a Chrome Extension. It evaluates a page against strict engineering and semantic standards.

MATCH does NOT aim to discover what a website "has".
MATCH answers: "Is what MUST exist present, and is it correct?"

### Evaluation Pillars

<table>
  <tr>
    <td align="center" bgcolor="#DD4433" style="color:white; font-size:18px; font-weight:bold; width: 48px;">M</td>
    <td width="200px"><strong>Metadata Precision</strong></td>
    <td>Title + essential meta correctness.</td>
  </tr>
  <tr>
    <td align="center" bgcolor="#4488FF" style="color:white; font-size:18px; font-weight:bold; width: 48px;">A</td>
    <td><strong>Access Quality</strong></td>
    <td>Strict A11y baseline checks (deterministic).</td>
  </tr>
  <tr>
    <td align="center" bgcolor="#FFBB00" style="color:white; font-size:18px; font-weight:bold; width: 48px;">T</td>
    <td><strong>Technical Hygiene</strong></td>
    <td>Console/runtime/network hygiene and technical cleanliness.</td>
  </tr>
  <tr>
    <td align="center" bgcolor="#8844BB" style="color:white; font-size:18px; font-weight:bold; width: 48px;">C</td>
    <td><strong>Contextual Relevancy</strong></td>
    <td>Page content alignment with the user-provided Search Term.</td>
  </tr>
  <tr>
    <td align="center" bgcolor="#11AA55" style="color:white; font-size:18px; font-weight:bold; width: 48px;">H</td>
    <td><strong>Hierarchy Integrity</strong></td>
    <td>Structural and semantic correctness: main/article/heading integrity/landmarks.</td>
  </tr>
</table>

## Key Features

*   **Deterministic Heatmap**: 5-column strict analysis (Metadata, Access, Technical, Contextual, Hierarchy).
*   **0-Cost & Local First**: AI and logic run wholly on your machine via WebAssembly and Chrome's Built-in AI. No remote API calls.
*   **Contextual Relevancy Check**: Compare the actual layout text against a real Search Term.
*   **A11y Baseline**: Deterministic Accessibility checks powered by axe-core.
*   **Multiple Modes**:
    *   **Popup**: Instant analysis for the active tab.
    *   **Dashboard**: Batch URL analysis and historical cache tracking.
*   **JSON Report Export**: Agent/AI-friendly export artifact.

## Tech Stack

*   **Runtime / Tooling**
    *   **Bun** (Package Manager & Runtime)
    *   **TypeScript** (Strict Mode)
    *   **Vite** (Build Tool)
    *   **React 19**
*   **Core Logic**
    *   `axe-core` (Accessibility)
    *   `@xenova/transformers` (Local Embeddings & NLP)
    *   `window.ai` / Prompt API (Semantic Quality)
*   **UI & UX**
    *   **Tailwind CSS v4** (Styling)
    *   **Shadcn UI** (Component Library)
    *   **Framer Motion** (Animations)
    *   **Lucide React** (Icons)
*   **Quality & Standards**
    *   **Biome** (Linter & Formatter)
*   **Extension**
    *   `@crxjs/vite-plugin`
    *   MV3 Manifest

## Project Structure

```
src/
├── app/                # Feature modules (Dashboard, Popup logic)
├── components/         # Shared UI components (Shadcn, Common)
├── lib/                # Shared utilities
├── metrics/            # Deterministic metric plugins (M.A.T.C.H.)
├── services/           # External integrations (Chrome API, Storage, AI)
├── assets/             # Static assets
└── popup/              # Extension popup entry
```

## Installation & Development

### Prerequisites

*   [Bun](https://bun.sh/) (v1.0+)
*   Node.js (v20+)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/goker/match
    cd match
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Start Development Server:**
    ```bash
    bun dev
    ```
    This compiles the extension and app in watch mode.

4.  **Load into Chrome:**
    *   Open `chrome://extensions`
    *   Enable **Developer mode** (top right)
    *   Click **Load unpacked**
    *   Select the `dist/` folder generated in your project root

## Contributing

Contributions are welcome! Please read the [SPEC.md](./SPEC.md) for architectural details before submitting pull requests.

1.  Fork the repository
2.  Create your branch (`git checkout -b feature/amazing-feature`)
3.  Commit changes (`git commit -m 'feat: add amazing feature'`)
4.  Push branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

### Contribution Rules
*   Follow **Conventional Commits**
*   Keep metric logic deterministic
*   Avoid `any` types (Strict TypeScript)
*   Keep comments in English
*   Run lint/format/build before PR (`bun lint`, `bun format`)

## License

Distributed under the MIT License. See `LICENSE` for more information.