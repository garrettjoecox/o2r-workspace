/**
 * Selection Context
 * Manages the currently selected resource
 */

"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import type { ResourceEntry } from "@/lib/types";

export interface SelectionContextValue {
	selectedResource: ResourceEntry | null;
	setSelectedResource: (resource: ResourceEntry | null) => void;
	clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextValue | undefined>(
	undefined,
);

export function SelectionProvider({ children }: { children: ReactNode }) {
	const [selectedResource, setSelectedResource] =
		useState<ResourceEntry | null>(null);

	const clearSelection = useCallback(() => {
		setSelectedResource(null);
	}, []);

	const value: SelectionContextValue = {
		selectedResource,
		setSelectedResource,
		clearSelection,
	};

	return (
		<SelectionContext.Provider value={value}>
			{children}
		</SelectionContext.Provider>
	);
}

export function useSelection(): SelectionContextValue {
	const context = useContext(SelectionContext);
	if (!context) {
		throw new Error("useSelection must be used within SelectionProvider");
	}
	return context;
}
