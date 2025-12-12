import { ChevronDown, ChevronRight, File, Folder, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/utils/tree-builder";

interface TreeNodeComponentProps {
	node: TreeNode;
	level: number;
	selectedPath: string | null;
	onResourceSelect: (path: string) => void;
	expandedNodes: Set<string>;
	onToggleExpand: (path: string) => void;
	isWorkspace?: boolean;
	onRemoveFromWorkspace?: (path: string) => void;
}

export function TreeNodeComponent({
	node,
	level,
	selectedPath,
	onResourceSelect,
	expandedNodes,
	onToggleExpand,
	isWorkspace = false,
	onRemoveFromWorkspace,
}: TreeNodeComponentProps) {
	const isExpanded = expandedNodes.has(node.path);
	const isSelected = selectedPath === node.path;

	const handleClick = () => {
		if (node.isDirectory) {
			onToggleExpand(node.path);
		} else {
			onResourceSelect(node.path);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleClick();
		}
	};

	return (
		<div>
			<div
				role="button"
				tabIndex={0}
				className={cn(
					"flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm transition-colors group",
					isSelected && "bg-accent",
				)}
				style={{ paddingLeft: `${level * 12 + 8}px` }}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				aria-expanded={node.isDirectory ? isExpanded : undefined}
				aria-label={node.isDirectory ? `${node.name} folder` : node.name}
			>
				{node.isDirectory && (
					<span className="flex-shrink-0">
						{isExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
					</span>
				)}
				{!node.isDirectory && <span className="w-4" />}
				{node.isDirectory ? (
					<Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
				) : (
					<File className="h-4 w-4 flex-shrink-0 text-gray-500" />
				)}
				<span className="text-sm truncate flex-1">{node.name}</span>
				{node.resource && (
					<span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
						{node.resource.header.resourceType}
					</span>
				)}
				{isWorkspace && !node.isDirectory && onRemoveFromWorkspace && (
					<button
						type="button"
						className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive p-1"
						onClick={(e) => {
							e.stopPropagation();
							onRemoveFromWorkspace(node.path);
						}}
						title="Remove from workspace"
					>
						<Trash2 className="h-3 w-3" />
					</button>
				)}
			</div>
			{node.isDirectory && isExpanded && (
				<div>
					{node.children.map((child) => (
						<TreeNodeComponent
							key={child.path}
							node={child}
							level={level + 1}
							selectedPath={selectedPath}
							onResourceSelect={onResourceSelect}
							expandedNodes={expandedNodes}
							onToggleExpand={onToggleExpand}
							isWorkspace={isWorkspace}
							onRemoveFromWorkspace={onRemoveFromWorkspace}
						/>
					))}
				</div>
			)}
		</div>
	);
}
