/**
 * Workspace Context
 * Manages workspace resources and operations
 */

"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { ResourceEntry } from "@/lib/types";

export interface WorkspaceContextValue {
	resources: ResourceEntry[];
	addResource: (resource: ResourceEntry) => void;
	removeResource: (path: string) => void;
	updateResource: (path: string, newData: Uint8Array) => void;
	clearWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
	undefined,
);

const WORKSPACE_STORAGE_KEY = "o2r-workspace";

/**
 * Serialize workspace resources for localStorage
 */
function serializeResources(resources: ResourceEntry[]): string {
	return JSON.stringify(resources, (_key, value) => {
		if (typeof value === "bigint") {
			return { __type: "bigint", value: value.toString() };
		}
		if (value instanceof Uint8Array) {
			return { __type: "Uint8Array", value: Array.from(value) };
		}
		return value;
	});
}

/**
 * Deserialize workspace resources from localStorage
 */
function deserializeResources(json: string): ResourceEntry[] {
	return JSON.parse(json, (_key, value) => {
		if (value && typeof value === "object") {
			if (value.__type === "bigint") {
				return BigInt(value.value);
			}
			if (value.__type === "Uint8Array") {
				return new Uint8Array(value.value);
			}
		}
		return value;
	});
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const [resources, setResources] = useState<ResourceEntry[]>([]);

	// Load workspace from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
			if (saved) {
				const deserialized = deserializeResources(saved);
				setResources(deserialized);
			}
		} catch (error) {
			console.error("Failed to load workspace from localStorage:", error);
		}
	}, []);

	// Save workspace to localStorage whenever it changes
	useEffect(() => {
		try {
			const serialized = serializeResources(resources);
			localStorage.setItem(WORKSPACE_STORAGE_KEY, serialized);
		} catch (error) {
			console.error("Failed to save workspace to localStorage:", error);
		}
	}, [resources]);

	const addResource = useCallback((resource: ResourceEntry) => {
		setResources((prev) => {
			// Check if resource with same path already exists
			const exists = prev.some((r) => r.path === resource.path);
			if (exists) {
				// Replace existing resource
				return prev.map((r) => (r.path === resource.path ? resource : r));
			}
			// Add new resource
			return [...prev, resource];
		});
	}, []);

	const removeResource = useCallback((path: string) => {
		setResources((prev) => prev.filter((r) => r.path !== path));
	}, []);

	const updateResource = useCallback((path: string, newData: Uint8Array) => {
		setResources((prev) =>
			prev.map((r) => {
				if (r.path === path) {
					return {
						...r,
						data: newData,
						dataWithoutHeader: newData.slice(64), // OTR_HEADER_SIZE
					};
				}
				return r;
			}),
		);
	}, []);

	const clearWorkspace = useCallback(() => {
		setResources([]);
	}, []);

	const value: WorkspaceContextValue = {
		resources,
		addResource,
		removeResource,
		updateResource,
		clearWorkspace,
	};

	return (
		<WorkspaceContext.Provider value={value}>
			{children}
		</WorkspaceContext.Provider>
	);
}

export function useWorkspace(): WorkspaceContextValue {
	const context = useContext(WorkspaceContext);
	if (!context) {
		throw new Error("useWorkspace must be used within WorkspaceProvider");
	}
	return context;
}
