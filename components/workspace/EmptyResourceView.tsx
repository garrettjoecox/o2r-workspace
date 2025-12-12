import { FileCode2 } from "lucide-react";

export function EmptyResourceView() {
	return (
		<div className="h-full flex items-center justify-center text-muted-foreground">
			<div className="text-center">
				<FileCode2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
				<p>Select a resource from the tree to view its contents</p>
			</div>
		</div>
	);
}
