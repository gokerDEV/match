
#Privacy

> To facilitate the compliance of your extension with the Chrome Web Store Developer Program Policies, you are required to provide the information listed below. The information provided in this form will be shared with the Chrome Web Store team. Please ensure that the information provided is accurate, as it will improve the review time of your extension and decrease the risk of this version being rejected.

---

## Single purpose
> An extension must have a single purpose that is narrow and easy-to-understand.

MATCH has one narrow purpose: to analyze the currently viewed webpage (or a user-provided list of URLs) and produce a simple, deterministic website quality report.

It checks five fixed categories — metadata, accessibility, technical hygiene, content relevancy to a user-provided search term, and structural hierarchy — and displays the outcome as a heatmap with an optional JSON export.

---

## Permission justification

> A permission is either one of a list of known strings, such as "activeTab", or a match pattern giving access to one or more hosts.
Remove any permission that is not needed to fulfill the single purpose of your extension. Requesting an unnecessary permission will result in this version being rejected.

### activeTab Justification

MATCH uses activeTab only when the user explicitly clicks Analyze. It grants temporary access to the currently active page so the extension can read the page’s DOM and metadata, run on-device accessibility checks, and generate a local heatmap/JSON report. Access is limited to the active tab, lasts only for the user-initiated action, and no page data is transmitted off-device.

###  scripting Justification

MATCH uses the scripting permission to inject and execute its analysis script in the currently active tab only after the user clicks Analyze. This is required to extract page signals (DOM, headings/landmarks, metadata), run on-device accessibility checks, and collect technical hygiene indicators (e.g., console/runtime signals) to generate the heatmap and optional JSON report. Injection is limited to the active tab, runs only for the user-initiated action, and no data is sent to external servers.

###  storage Justification

MATCH uses the storage permission to save analysis results and user preferences locally (e.g., recent scans, history, and UI/settings) so users can review and compare reports across sessions. Data is stored in chrome.storage.local on the user’s device, can be cleared at any time via Chrome’s extension data controls, and is never transmitted to external servers or shared with third parties.

###  downloads Justification

MATCH uses the downloads permission only when the user chooses Export to save the generated analysis report (JSON) to the user’s device. This enables a one-click, user-initiated file download. MATCH does not download files automatically, does not upload or transmit report data anywhere, and the exported file is created locally from the on-device analysis results.

###  Host permission Justification

> A host permission is any match pattern specified in the "permissions" and "content_scripts" fields of the extension manifest

MATCH requests host access only to analyze webpages that the user explicitly chooses (the current active tab, or URLs the user manually enters in the dashboard). Host permissions allow the extension to read page content and metadata so it can run its on-device checks (structure/headings, metadata, accessibility, technical hygiene, and optional search-term relevancy) and generate the local heatmap/JSON report.

We use <all_urls> only because users can input any URL to analyze. Access is used only during user-initiated scans and never for background collection.


## Are we using remote code?

> Remote code is any JS or Wasm that is not included in the extension's package. This includes references to external files in <script> tags, modules pointing to external files, and strings evaluated through eval()

No, we are not using remote code.


## User Data

> Does your extension collect or transmit any user data?

No, we do not collect or transmit any user data.

### We certify that the following disclosures are true:

* We do not sell or transfer user data to third parties, outside of the approved use cases
* We do not use or transfer user data for purposes that are unrelated to my item's single purpose
* We do not use or transfer user data to determine creditworthiness or for lending purposes

