import { ChevronDown, ChevronRight, FileArchive, Trash2 } from "lucide-react";
import type { O2RFile } from "@/app/page";
import { cn } from "@/lib/utils";
import { buildTree } from "@/lib/utils/tree-builder";
import { TreeNodeComponent } from "./TreeNodeComponent";

interface FileEntryProps {
	o2rFile: O2RFile;
	fileIndex: number;
	selectedPath: string | null;
	selectedFileIndex: number | null;
	isExpanded: boolean;
	expandedNodes: Set<string>;
	filteredCount: number;
	totalCount: number;
	onToggleExpand: (fileIndex: number) => void;
	onResourceSelect: (path: string, fileIndex: number) => void;
	onToggleNodeExpand: (path: string) => void;
	onRemoveFile: (fileIndex: number) => void;
}

export function FileEntry({
	o2rFile,
	fileIndex,
	selectedPath,
	selectedFileIndex,
	isExpanded,
	expandedNodes,
	filteredCount,
	totalCount,
	onToggleExpand,
	onResourceSelect,
	onToggleNodeExpand,
	onRemoveFile,
}: FileEntryProps) {
	const tree = buildTree(o2rFile.resources);

	return (
		<div className="mb-2">
			<div
				className={cn(
					"flex items-center gap-2 px-2 py-2 hover:bg-accent rounded-sm transition-colors mb-1 group",
					selectedFileIndex === fileIndex && "bg-accent/50",
				)}
			>
				<span
					className="flex-shrink-0 cursor-pointer"
					onClick={() => onToggleExpand(fileIndex)}
				>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</span>
				<FileArchive className="h-4 w-4 flex-shrink-0 text-purple-500" />
				<span
					className="text-sm font-medium truncate flex-1 cursor-pointer"
					onClick={() => onToggleExpand(fileIndex)}
				>
					{o2rFile.filename}
				</span>
				<span className="text-xs text-muted-foreground flex-shrink-0">
					{filteredCount !== totalCount
						? `${filteredCount}/${totalCount}`
						: totalCount}
				</span>
				<button
					type="button"
					className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive p-1"
					onClick={(e) => {
						e.stopPropagation();
						onRemoveFile(fileIndex);
					}}
					title="Remove file"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
			{isExpanded && filteredCount > 0 && (
				<div className="ml-2">
					{tree.children.map((child) => (
						<TreeNodeComponent
							key={child.path}
							node={child}
							level={0}
							selectedPath={selectedPath}
							onResourceSelect={(path) => onResourceSelect(path, fileIndex)}
							expandedNodes={expandedNodes}
							onToggleExpand={onToggleNodeExpand}
						/>
					))}
				</div>
			)}
			{isExpanded && filteredCount === 0 && totalCount > 0 && (
				<div className="ml-8 text-xs text-muted-foreground py-2">
					No resources match the current filter.
				</div>
			)}
		</div>
	);
}
