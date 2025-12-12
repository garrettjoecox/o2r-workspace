/**
 * Custom hook for exporting workspace as O2R archive
 */

"use client";

import { useCallback, useState } from "react";
import { useWorkspace } from "@/lib/context";
import { exportO2RArchive } from "@/lib/parsers/o2r";

export function useWorkspaceExport() {
	const { resources } = useWorkspace();
	const [error, setError] = useState<string | null>(null);

	const exportWorkspace = useCallback(async () => {
		if (resources.length === 0) {
			setError("Workspace is empty. Add resources before exporting.");
			return;
		}

		try {
			await exportO2RArchive(resources, "workspace.o2r");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to export workspace",
			);
			console.error("Error exporting workspace:", err);
		}
	}, [resources]);

	return {
		exportWorkspace,
		error,
		setError,
	};
}
