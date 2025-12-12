import { ChevronDown, ChevronRight, Download, FileArchive } from "lucide-react";
import type { ResourceEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildTree } from "@/lib/utils/tree-builder";
import { TreeNodeComponent } from "./TreeNodeComponent";

interface WorkspaceEntryProps {
	workspaceResources: ResourceEntry[];
	filteredWorkspaceResources: ResourceEntry[];
	selectedPath: string | null;
	selectedFileIndex: number | null;
	isExpanded: boolean;
	expandedNodes: Set<string>;
	onToggleExpand: (fileIndex: number) => void;
	onResourceSelect: (path: string) => void;
	onRemoveFromWorkspace: (path: string) => void;
	onToggleNodeExpand: (path: string) => void;
	onExportWorkspace: () => void;
}

export function WorkspaceEntry({
	workspaceResources,
	filteredWorkspaceResources,
	selectedPath,
	selectedFileIndex,
	isExpanded,
	expandedNodes,
	onToggleExpand,
	onResourceSelect,
	onRemoveFromWorkspace,
	onToggleNodeExpand,
	onExportWorkspace,
}: WorkspaceEntryProps) {
	return (
		<div className="mb-2">
			<div
				className={cn(
					"flex items-center gap-2 px-2 py-2 hover:bg-accent rounded-sm transition-colors mb-1 group",
					selectedFileIndex === -1 && "bg-accent/50",
				)}
			>
				<span
					className="flex-shrink-0 cursor-pointer"
					onClick={() => onToggleExpand(-1)}
				>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</span>
				<FileArchive className="h-4 w-4 flex-shrink-0 text-green-500" />
				<span
					className="text-sm font-medium truncate flex-1 cursor-pointer"
					onClick={() => onToggleExpand(-1)}
				>
					Workspace
				</span>
				<span className="text-xs text-muted-foreground flex-shrink-0">
					{filteredWorkspaceResources.length !== workspaceResources.length
						? `${filteredWorkspaceResources.length}/${workspaceResources.length}`
						: workspaceResources.length}
				</span>
				{workspaceResources.length > 0 && (
					<button
						type="button"
						className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary p-1"
						onClick={(e) => {
							e.stopPropagation();
							onExportWorkspace();
						}}
						title="Export workspace.o2r"
					>
						<Download className="h-4 w-4" />
					</button>
				)}
			</div>
			{isExpanded && filteredWorkspaceResources.length > 0 && (
				<div className="ml-2">
					{(() => {
						const tree = buildTree(filteredWorkspaceResources);
						return tree.children.map((child) => (
							<TreeNodeComponent
								key={child.path}
								node={child}
								level={0}
								selectedPath={selectedPath}
								onResourceSelect={onResourceSelect}
								expandedNodes={expandedNodes}
								onToggleExpand={onToggleNodeExpand}
								isWorkspace={true}
								onRemoveFromWorkspace={onRemoveFromWorkspace}
							/>
						));
					})()}
				</div>
			)}
			{isExpanded && filteredWorkspaceResources.length === 0 && (
				<div className="ml-8 text-xs text-muted-foreground py-2">
					{workspaceResources.length === 0
						? "No resources yet. Add resources from other O2R files."
						: "No resources match the current filter."}
				</div>
			)}
		</div>
	);
}
