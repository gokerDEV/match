import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "@/components/common/app.layout";
import { MatchDashboard } from "./dashboard/page";
import { HistoryPage } from "./history/page";
import { SettingsPage } from "./settings/page";
import "@/style.css";

const rootElement = document.getElementById("root");

if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<React.StrictMode>
			<HashRouter>
				<Routes>
					<Route element={<Layout />}>
						<Route path="/" element={<MatchDashboard />} />
						<Route path="/history" element={<HistoryPage />} />
						<Route path="/settings" element={<SettingsPage />} />
					</Route>
				</Routes>
			</HashRouter>
		</React.StrictMode>,
	);
}
