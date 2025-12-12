"use client";

import { useCallback, useEffect, useState } from "react";
import { OverwriteDialog } from "@/components/dialogs/OverwriteDialog";
import { ErrorBoundary } from "@/components/error-boundary";
import { ResourceTree } from "@/components/resource-tree";
import { ResourceView } from "@/components/resource-view";
import { EmptyResourceView } from "@/components/workspace/EmptyResourceView";
import { FileDropZone } from "@/components/workspace/FileDropZone";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceToolbar } from "@/components/workspace/WorkspaceToolbar";
import { readUInt32LE } from "@/lib/binary-utils";
import {
	parseAnimationHeader,
	updateAnimationHeaderPath,
} from "@/lib/parsers/animation";
import { exportO2RArchive, parseO2RArchive } from "@/lib/parsers/o2r";
import type { ResourceEntry } from "@/lib/types";

export interface O2RFile {
	filename: string;
	resources: ResourceEntry[];
}

const WORKSPACE_STORAGE_KEY = "o2r-workspace";

export default function Home() {
	const [o2rFiles, setO2rFiles] = useState<O2RFile[]>([]);
	const [workspaceResources, setWorkspaceResources] = useState<ResourceEntry[]>(
		[],
	);
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [overwriteDialog, setOverwriteDialog] = useState<{
		open: boolean;
		resource: ResourceEntry | null;
		additionalResources?: ResourceEntry[];
	}>({ open: false, resource: null });

	// Currently disabled, too buggy
	// Load workspace from localStorage on mount
	// useEffect(() => {
	// 	try {
	// 		const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
	// 		if (saved) {
	// 			const parsed = JSON.parse(saved, (key, value) => {
	// 				// Convert uniqueId strings back to BigInt
	// 				if (key === "uniqueId" && typeof value === "string") {
	// 					return BigInt(value);
	// 				}
	// 				// Convert Uint8Array objects back from array format
	// 				if (
	// 					value &&
	// 					typeof value === "object" &&
	// 					value.type === "Buffer" &&
	// 					Array.isArray(value.data)
	// 				) {
	// 					return new Uint8Array(value.data);
	// 				}
	// 				return value;
	// 			});
	// 			setWorkspaceResources(parsed);
	// 		}
	// 	} catch (err) {
	// 		console.error("Failed to load workspace from localStorage:", err);
	// 	}
	// }, []);

	// Save workspace to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem(
				WORKSPACE_STORAGE_KEY,
				JSON.stringify(workspaceResources, (_key, value) => {
					// Convert BigInt to string for JSON serialization
					if (typeof value === "bigint") {
						return value.toString();
					}
					// Convert Uint8Array to array for JSON serialization
					if (value instanceof Uint8Array) {
						return Array.from(value);
					}
					return value;
				}),
			);
		} catch (err) {
			console.error("Failed to save workspace to localStorage:", err);
		}
	}, [workspaceResources]);

	const handleFileSelect = useCallback(async (file: File) => {
		setIsLoading(true);
		setError(null);

		try {
			const parsedResources = await parseO2RArchive(file);

			setO2rFiles((prev) => {
				// Check if file with same name already exists
				const existingIndex = prev.findIndex((f) => f.filename === file.name);

				if (existingIndex !== -1) {
					// Replace existing file
					const newFiles = [...prev];
					newFiles[existingIndex] = {
						filename: file.name,
						resources: parsedResources,
					};
					return newFiles;
				} else {
					// Add new file
					return [...prev, { filename: file.name, resources: parsedResources }];
				}
			});

			// Clear selection when uploading a file
			setSelectedPath(null);
			setSelectedFileIndex(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to parse O2R file");
			console.error("Error parsing O2R:", err);
		} finally {
			setIsLoading(false);
		}
	}, []);

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

	const handleResourceSelect = useCallback(
		(path: string, fileIndex: number) => {
			setSelectedPath(path);
			setSelectedFileIndex(fileIndex);
		},
		[],
	);

	const handleAddToWorkspace = useCallback(
		(resource: ResourceEntry, additionalResources?: ResourceEntry[]) => {
			setWorkspaceResources((prev) => {
				// Check if resource with same path already exists
				const existingIndex = prev.findIndex((r) => r.path === resource.path);

				if (existingIndex !== -1) {
					// Show confirmation dialog
					setOverwriteDialog({ open: true, resource, additionalResources });
					return prev; // Don't modify yet
				} else {
					// Add new resource and any additional resources (e.g., Link animation data files)
					setSelectedPath(resource.path);
					setSelectedFileIndex(-1);
					let updated = [...prev, resource];
					if (additionalResources) {
						for (const additionalResource of additionalResources) {
							const existingAdditionalIndex = updated.findIndex(
								(r) => r.path === additionalResource.path,
							);
							if (existingAdditionalIndex === -1) {
								updated = [...updated, additionalResource];
							}
						}
					}
					return updated;
				}
			});
		},
		[],
	);

	const handleConfirmOverwrite = useCallback(() => {
		if (overwriteDialog.resource) {
			setWorkspaceResources((prev) => {
				const existingIndex = prev.findIndex(
					(r) => r.path === overwriteDialog.resource?.path,
				);
				if (existingIndex !== -1 && overwriteDialog.resource) {
					let newResources = [...prev];
					newResources[existingIndex] = overwriteDialog.resource;
					// Add any additional resources (e.g., Link animation data files)
					if (overwriteDialog.additionalResources) {
						for (const additionalResource of overwriteDialog.additionalResources) {
							const existingAdditionalIndex = newResources.findIndex(
								(r) => r.path === additionalResource.path,
							);
							if (existingAdditionalIndex !== -1) {
								newResources[existingAdditionalIndex] = additionalResource;
							} else {
								newResources = [...newResources, additionalResource];
							}
						}
					}
					setSelectedPath(overwriteDialog.resource.path);
					setSelectedFileIndex(-1);
					return newResources;
				}
				return prev;
			});
		}
		setOverwriteDialog({ open: false, resource: null });
	}, [overwriteDialog.resource, overwriteDialog.additionalResources]);

	const handleRemoveFromWorkspace = useCallback((path: string) => {
		setWorkspaceResources((prev) => prev.filter((r) => r.path !== path));
	}, []);

	const handleExportWorkspace = useCallback(async () => {
		if (workspaceResources.length === 0) {
			setError("Workspace is empty. Add resources before exporting.");
			return;
		}

		try {
			await exportO2RArchive(workspaceResources, "workspace.o2r");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to export workspace",
			);
			console.error("Error exporting workspace:", err);
		}
	}, [workspaceResources]);

	const handleRemoveFile = useCallback(
		(fileIndex: number) => {
			setO2rFiles((prev) => prev.filter((_, index) => index !== fileIndex));

			// Clear selection if the removed file was selected
			if (selectedFileIndex === fileIndex) {
				setSelectedPath(null);
				setSelectedFileIndex(null);
			} else if (selectedFileIndex !== null && selectedFileIndex > fileIndex) {
				// Adjust the selected file index if a file before it was removed
				setSelectedFileIndex(selectedFileIndex - 1);
			}
		},
		[selectedFileIndex],
	);

	const handleUpdateResource = useCallback(
		(updatedResource: ResourceEntry, additionalResources?: ResourceEntry[]) => {
			if (selectedFileIndex === -1) {
				// Update workspace resource
				setWorkspaceResources((prev) => {
					let updated = prev.map((r) =>
						r.path === updatedResource.path ? updatedResource : r,
					);
					// Add any additional resources (e.g., Link animation data files)
					if (additionalResources) {
						for (const additionalResource of additionalResources) {
							const existingIndex = updated.findIndex(
								(r) => r.path === additionalResource.path,
							);
							if (existingIndex !== -1) {
								updated[existingIndex] = additionalResource;
							} else {
								updated = [...updated, additionalResource];
							}
						}
					}
					return updated;
				});
			} else if (selectedFileIndex !== null) {
				// If editing an o2r resource, add/update it in the workspace instead
				setWorkspaceResources((prev) => {
					const existingIndex = prev.findIndex(
						(r) => r.path === updatedResource.path,
					);
					let updated: ResourceEntry[];
					if (existingIndex !== -1) {
						// Update existing workspace resource
						updated = [...prev];
						updated[existingIndex] = updatedResource;
					} else {
						// Add new resource to workspace
						updated = [...prev, updatedResource];
					}
					// Add any additional resources (e.g., Link animation data files)
					if (additionalResources) {
						for (const additionalResource of additionalResources) {
							const additionalIndex = updated.findIndex(
								(r) => r.path === additionalResource.path,
							);
							if (additionalIndex !== -1) {
								updated[additionalIndex] = additionalResource;
							} else {
								updated = [...updated, additionalResource];
							}
						}
					}
					return updated;
				});
				// Switch to workspace view for this resource
				setSelectedFileIndex(-1);
			}
		},
		[selectedFileIndex],
	);

	const handleDeleteResource = useCallback(
		(resource: ResourceEntry) => {
			setWorkspaceResources((prev) =>
				prev.filter((r) => r.path !== resource.path),
			);
			// Clear selection if deleted resource was selected
			if (selectedPath === resource.path) {
				setSelectedPath(null);
				setSelectedFileIndex(null);
			}
		},
		[selectedPath],
	);

	const handleMoveResource = useCallback(
		(resource: ResourceEntry, newPath: string) => {
			setWorkspaceResources((prev) => {
				// Check if a resource already exists at the new path
				const existingIndex = prev.findIndex((r) => r.path === newPath);

				if (existingIndex !== -1 && newPath !== resource.path) {
					setError(`A resource already exists at path: ${newPath}`);
					return prev;
				}

				// Check if this is a Link animation header (Player Animation)
				if (
					resource.header.resourceType === "Animation" &&
					readUInt32LE(resource.dataWithoutHeader, 0) === 1
				) {
					try {
						// Parse the header to get the data path
						const { dataPath: oldDataPath } = parseAnimationHeader(
							resource.data,
						);

						// Normalize paths (remove __OTR__ prefix if present)
						const normalizedOldDataPath = oldDataPath.replace(/^__OTR__/, "");

						// Find the associated data file
						const dataResource = prev.find((r) => {
							const normalizedResourcePath = r.path.replace(/^__OTR__/, "");
							return normalizedResourcePath === normalizedOldDataPath;
						});

						if (dataResource) {
							const newDataPath = newPath + "_Data";

							// Update the header with the new data path reference
							const updatedHeaderData = updateAnimationHeaderPath(
								resource.data,
								newDataPath,
							);

							// Return updated resources with both files moved
							return prev.map((r) => {
								// Update the header resource with new path and updated data
								if (r.path === resource.path) {
									return {
										...r,
										path: newPath,
										data: updatedHeaderData,
										dataWithoutHeader: updatedHeaderData.slice(64),
									};
								}
								// Update the data resource with new path
								if (r.path === dataResource.path) {
									return { ...r, path: newDataPath };
								}
								return r;
							});
						}
					} catch (error) {
						console.error("Failed to handle Link animation move:", error);
						setError(
							`Failed to move Link animation: ${error instanceof Error ? error.message : "Unknown error"}`,
						);
						return prev;
					}
				}

				// For non-Link animations, just update the path
				return prev.map((r) => {
					if (r.path === resource.path) {
						return { ...r, path: newPath };
					}
					return r;
				});
			});

			// Update selection to follow the moved resource
			if (selectedPath === resource.path) {
				setSelectedPath(newPath);
			}
		},
		[selectedPath],
	);

	const selectedResource =
		selectedFileIndex === -1
			? workspaceResources.find((r) => r.path === selectedPath)
			: selectedFileIndex !== null
				? o2rFiles[selectedFileIndex]?.resources.find(
						(r) => r.path === selectedPath,
					)
				: null;

	const allResources =
		selectedFileIndex === -1
			? workspaceResources
			: selectedFileIndex !== null
				? o2rFiles[selectedFileIndex]?.resources || []
				: [];

	return (
		<main className="min-h-screen max-h-screen overflow-hidden bg-background flex flex-row">
			<div className="w-100 border-r border-border bg-card flex flex-col">
				<WorkspaceHeader />
				<WorkspaceToolbar
					onUploadClick={() =>
						document.getElementById("add-file-input")?.click()
					}
					onExportClick={handleExportWorkspace}
					workspaceResourceCount={workspaceResources.length}
				/>
				<input
					id="add-file-input"
					type="file"
					accept=".o2r,.zip"
					className="hidden"
					onChange={handleFileInputChange}
				/>
				<div className="flex-1 overflow-scroll">
					<ResourceTree
						o2rFiles={o2rFiles}
						workspaceResources={workspaceResources}
						selectedPath={selectedPath}
						selectedFileIndex={selectedFileIndex}
						onResourceSelect={handleResourceSelect}
						onRemoveFile={handleRemoveFile}
						onRemoveFromWorkspace={handleRemoveFromWorkspace}
						onExportWorkspace={handleExportWorkspace}
					/>
				</div>
			</div>

			{/* Main content area */}
			<div className="flex-1">
				{selectedResource ? (
					<ErrorBoundary>
						<ResourceView
							resource={selectedResource}
							isFromWorkspace={selectedFileIndex === -1}
							onAddToWorkspace={handleAddToWorkspace}
							onUpdateResource={handleUpdateResource}
							onDelete={handleDeleteResource}
							onMove={handleMoveResource}
							allResources={allResources}
						/>
					</ErrorBoundary>
				) : o2rFiles.length === 0 ? (
					<FileDropZone
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onClick={() => document.getElementById("file-input")?.click()}
						isLoading={isLoading}
						error={error}
					/>
				) : (
					<EmptyResourceView />
				)}
				<input
					id="file-input"
					type="file"
					accept=".o2r,.zip"
					className="hidden"
					onChange={handleFileInputChange}
				/>
			</div>

			<OverwriteDialog
				open={overwriteDialog.open}
				resourcePath={overwriteDialog.resource?.path || null}
				onConfirm={handleConfirmOverwrite}
				onCancel={() => setOverwriteDialog({ open: false, resource: null })}
			/>
		</main>
	);
}
