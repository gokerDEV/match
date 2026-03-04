import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Credits } from "./credits";
import { useSystem } from "./system.context";

interface Props {
	children: ReactNode;
	timeout?: number;
	skip?: boolean;
}

export function AppLoader({ children, timeout = 3000, skip = false }: Props) {
	const { isLoading, startLoading } = useSystem();
	const hasStarted = useRef(false);

	useEffect(() => {
		if (skip) return;
		if (!hasStarted.current) {
			startLoading(timeout);
			hasStarted.current = true;
		}
	}, [startLoading, timeout, skip]);

	// Skip mode: render children immediately, no loader
	if (skip) return <>{children}</>;

	return (
		<>
			{!isLoading && children}
			{isLoading && <Credits brand="goker" />}
		</>
	);
}
