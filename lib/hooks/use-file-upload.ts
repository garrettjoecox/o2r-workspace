/**
 * Custom hook for handling O2R file uploads
 */

"use client";

import { useCallback, useState } from "react";
import { useO2RFiles, useSelection } from "@/lib/context";
import { parseO2RArchive } from "@/lib/parsers/o2r";

export function useFileUpload() {
	const { addFile } = useO2RFiles();
	const { clearSelection } = useSelection();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFileSelect = useCallback(
		async (file: File) => {
			setIsLoading(true);
			setError(null);

			try {
				const parsedResources = await parseO2RArchive(file);
				addFile({
					filename: file.name,
					resources: parsedResources,
				});
				// Clear selection when uploading a file
				clearSelection();
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to parse O2R file",
				);
				console.error("Error parsing O2R:", err);
			} finally {
				setIsLoading(false);
			}
		},
		[addFile, clearSelection],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const file = e.dataTransfer.files[0];
			if (file) {
				handleFileSelect(file);
			}
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				handleFileSelect(file);
			}
		},
		[handleFileSelect],
	);

	return {
		isLoading,
		error,
		setError,
		handleFileSelect,
		handleDrop,
		handleDragOver,
		handleFileInputChange,
	};
}
