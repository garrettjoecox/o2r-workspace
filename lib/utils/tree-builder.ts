import type { ResourceEntry } from "@/lib/types";

export interface TreeNode {
	name: string;
	path: string;
	isDirectory: boolean;
	children: TreeNode[];
	resource?: ResourceEntry;
}

/**
 * Build a tree structure from flat resource paths
 */
export function buildTree(resources: ResourceEntry[]): TreeNode {
	const root: TreeNode = {
		name: "",
		path: "",
		isDirectory: true,
		children: [],
	};

	for (const resource of resources) {
		const parts = resource.path.split("/").filter((p) => p.length > 0);
		let current = root;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const isLastPart = i === parts.length - 1;
			const pathSoFar = parts.slice(0, i + 1).join("/");

			let child = current.children.find((c) => c.name === part);

			if (!child) {
				child = {
					name: part,
					path: pathSoFar,
					isDirectory: !isLastPart,
					children: [],
					resource: isLastPart ? resource : undefined,
				};
				current.children.push(child);
			}

			current = child;
		}
	}

	// Sort: directories first, then files, both alphabetically
	function sortNode(node: TreeNode) {
		node.children.sort((a, b) => {
			if (a.isDirectory && !b.isDirectory) return -1;
			if (!a.isDirectory && b.isDirectory) return 1;
			return a.name.localeCompare(b.name);
		});

		for (const child of node.children) {
			sortNode(child);
		}
	}

	sortNode(root);

	return root;
}
