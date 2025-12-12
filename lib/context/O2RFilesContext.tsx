/**
 * O2R Files Context
 * Manages loaded O2R archive files
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

export interface O2RFile {
	filename: string;
	resources: ResourceEntry[];
}

export interface O2RFilesContextValue {
	files: O2RFile[];
	addFile: (file: O2RFile) => void;
	removeFile: (filename: string) => void;
	clearFiles: () => void;
}

const O2RFilesContext = createContext<O2RFilesContextValue | undefined>(
	undefined,
);

export function O2RFilesProvider({ children }: { children: ReactNode }) {
	const [files, setFiles] = useState<O2RFile[]>([]);

	const addFile = useCallback((file: O2RFile) => {
		setFiles((prev) => {
			// Check if file with same name already exists
			const exists = prev.some((f) => f.filename === file.filename);
			if (exists) {
				// Replace existing file
				return prev.map((f) => (f.filename === file.filename ? file : f));
			}
			// Add new file
			return [...prev, file];
		});
	}, []);

	const removeFile = useCallback((filename: string) => {
		setFiles((prev) => prev.filter((f) => f.filename !== filename));
	}, []);

	const clearFiles = useCallback(() => {
		setFiles([]);
	}, []);

	const value: O2RFilesContextValue = {
		files,
		addFile,
		removeFile,
		clearFiles,
	};

	return (
		<O2RFilesContext.Provider value={value}>
			{children}
		</O2RFilesContext.Provider>
	);
}

export function useO2RFiles(): O2RFilesContextValue {
	const context = useContext(O2RFilesContext);
	if (!context) {
		throw new Error("useO2RFiles must be used within O2RFilesProvider");
	}
	return context;
}
