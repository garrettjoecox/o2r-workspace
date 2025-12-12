/**
 * Custom hooks for resource operations
 */

"use client";

import { useCallback, useState } from "react";
import { useO2RFiles, useSelection, useWorkspace } from "@/lib/context";
import type { ResourceEntry } from "@/lib/types";

/**
 * Hook for managing overwrite dialogs
 */
export function useOverwriteDialog() {
	const [overwriteDialog, setOverwriteDialog] = useState<{
		open: boolean;
		resource: ResourceEntry | null;
		additionalResources?: ResourceEntry[];
	}>({ open: false, resource: null });

	const openDialog = useCallback(
		(resource: ResourceEntry, additionalResources?: ResourceEntry[]) => {
			setOverwriteDialog({ open: true, resource, additionalResources });
		},
		[],
	);

	const closeDialog = useCallback(() => {
		setOverwriteDialog({ open: false, resource: null });
	}, []);

	return {
		overwriteDialog,
		openDialog,
		closeDialog,
	};
}

/**
 * Hook for adding resources to workspace with overwrite handling
 */
export function useAddToWorkspace() {
	const { resources, addResource } = useWorkspace();
	const { setSelectedResource } = useSelection();

	const addToWorkspace = useCallback(
		(
			resource: ResourceEntry,
			additionalResources?: ResourceEntry[],
			onConflict?: (
				resource: ResourceEntry,
				additionalResources?: ResourceEntry[],
			) => void,
		) => {
			// Check if resource with same path already exists
			const exists = resources.some((r) => r.path === resource.path);

			if (exists && onConflict) {
				// Call conflict handler to show dialog
				onConflict(resource, additionalResources);
			} else {
				// Add new resource
				addResource(resource);
				// Add additional resources if provided
				if (additionalResources) {
					for (const additionalResource of additionalResources) {
						addResource(additionalResource);
					}
				}
				setSelectedResource(resource);
			}
		},
		[resources, addResource, setSelectedResource],
	);

	return { addToWorkspace };
}

/**
 * Hook for updating resources with additional resources support
 */
export function useUpdateResource() {
	const { updateResource } = useWorkspace();
	const { files, addFile } = useO2RFiles();
	const { selectedResource, setSelectedResource } = useSelection();

	const update = useCallback(
		(
			updatedResource: ResourceEntry,
			additionalResources?: ResourceEntry[],
			sourceFileIndex?: number,
		) => {
			// Update in workspace
			updateResource(updatedResource.path, updatedResource.data);

			// Add additional resources if provided
			if (additionalResources) {
				for (const additionalResource of additionalResources) {
					updateResource(additionalResource.path, additionalResource.data);
				}
			}

			// Update in source file if provided
			if (sourceFileIndex !== undefined && sourceFileIndex >= 0) {
				const file = files[sourceFileIndex];
				if (file) {
					const updatedFileResources = file.resources.map((r) =>
						r.path === updatedResource.path ? updatedResource : r,
					);
					addFile({ ...file, resources: updatedFileResources });
				}
			}

			// Update selection if it's the current resource
			if (selectedResource?.path === updatedResource.path) {
				setSelectedResource(updatedResource);
			}
		},
		[updateResource, files, addFile, selectedResource, setSelectedResource],
	);

	return { updateResource: update };
}
