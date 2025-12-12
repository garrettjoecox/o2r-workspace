"use client";

import { useState } from "react";
import type { O2RFile } from "@/app/page";
import { FileEntry } from "@/components/resource-tree/FileEntry";
import { TreeFilters } from "@/components/resource-tree/TreeFilters";
import { WorkspaceEntry } from "@/components/resource-tree/WorkspaceEntry";
import type { ResourceEntry } from "@/lib/types";

interface ResourceTreeProps {
	o2rFiles: O2RFile[];
	workspaceResources: ResourceEntry[];
	selectedPath: string | null;
	selectedFileIndex: number | null;
	onResourceSelect: (path: string, fileIndex: number) => void;
	onRemoveFile: (fileIndex: number) => void;
	onRemoveFromWorkspace: (path: string) => void;
	onExportWorkspace: () => void;
}

/**
 * Filter resources based on search query and type filter
 */
function filterResources(
	resources: ResourceEntry[],
	searchQuery: string,
	filterType: string,
): ResourceEntry[] {
	return resources.filter((resource) => {
		// Filter by type
		if (filterType !== "all" && resource.header.resourceType !== filterType) {
			return false;
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const matchesPath = resource.path.toLowerCase().includes(query);
			const matchesType = resource.header.resourceType
				.toLowerCase()
				.includes(query);
			return matchesPath || matchesType;
		}

		return true;
	});
}

export function ResourceTree({
	o2rFiles,
	workspaceResources,
	selectedPath,
	selectedFileIndex,
	onResourceSelect,
	onRemoveFile,
	onRemoveFromWorkspace,
	onExportWorkspace,
}: ResourceTreeProps) {
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
	const [expandedFiles, setExpandedFiles] = useState<Set<number>>(
		new Set([-1]), // -1 represents the workspace.o2r file
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<string>("all");

	// Get all unique resource types from all resources
	const allResourceTypes = Array.from(
		new Set([
			...workspaceResources.map((r) => r.header.resourceType),
			...o2rFiles.flatMap((file) =>
				file.resources.map((r) => r.header.resourceType),
			),
		]),
	).sort();

	// Filter resources based on search and filter
	const filteredWorkspaceResources = filterResources(
		workspaceResources,
		searchQuery,
		filterType,
	);
	const filteredO2rFiles = o2rFiles.map((file) => ({
		...file,
		resources: filterResources(file.resources, searchQuery, filterType),
	}));

	const handleToggleExpand = (path: string) => {
		const newExpanded = new Set(expandedNodes);
		if (newExpanded.has(path)) {
			newExpanded.delete(path);
		} else {
			newExpanded.add(path);
		}
		setExpandedNodes(newExpanded);
	};

	const handleToggleFile = (fileIndex: number) => {
		const newExpanded = new Set(expandedFiles);
		if (newExpanded.has(fileIndex)) {
			newExpanded.delete(fileIndex);
		} else {
			newExpanded.add(fileIndex);
		}
		setExpandedFiles(newExpanded);
	};

	return (
		<div className="h-full flex flex-col">
			<TreeFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				filterType={filterType}
				onFilterChange={setFilterType}
				availableTypes={allResourceTypes}
			/>

			<div className="flex-1 overflow-scroll p-2">
				<WorkspaceEntry
					workspaceResources={workspaceResources}
					filteredWorkspaceResources={filteredWorkspaceResources}
					selectedPath={selectedPath}
					selectedFileIndex={selectedFileIndex}
					isExpanded={expandedFiles.has(-1)}
					expandedNodes={expandedNodes}
					onToggleExpand={handleToggleFile}
					onResourceSelect={(path) => onResourceSelect(path, -1)}
					onRemoveFromWorkspace={onRemoveFromWorkspace}
					onToggleNodeExpand={handleToggleExpand}
					onExportWorkspace={onExportWorkspace}
				/>

				{filteredO2rFiles.map((o2rFile, fileIndex) => {
					const isExpanded = expandedFiles.has(fileIndex);
					const totalResources = o2rFiles[fileIndex].resources.length;
					const filteredCount = o2rFile.resources.length;

					return (
						<FileEntry
							key={o2rFiles[fileIndex].filename}
							o2rFile={o2rFile}
							fileIndex={fileIndex}
							selectedPath={selectedPath}
							selectedFileIndex={selectedFileIndex}
							isExpanded={isExpanded}
							expandedNodes={expandedNodes}
							filteredCount={filteredCount}
							totalCount={totalResources}
							onToggleExpand={handleToggleFile}
							onResourceSelect={onResourceSelect}
							onToggleNodeExpand={handleToggleExpand}
							onRemoveFile={onRemoveFile}
						/>
					);
				})}
			</div>
		</div>
	);
}
