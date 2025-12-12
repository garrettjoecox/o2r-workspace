import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceToolbarProps {
	onUploadClick: () => void;
	onExportClick: () => void;
	workspaceResourceCount: number;
}

export function WorkspaceToolbar({
	onUploadClick,
	onExportClick,
	workspaceResourceCount,
}: WorkspaceToolbarProps) {
	return (
		<div className="border-b border-border p-4 flex items-center justify-center gap-2">
			<div className="flex items-center gap-4">
				<Button size="sm" variant="outline" onClick={onUploadClick}>
					<Upload className="h-4 w-4 mr-1" />
					Upload O2R
				</Button>
				<Button
					size="sm"
					variant="default"
					onClick={onExportClick}
					disabled={workspaceResourceCount === 0}
				>
					<Download className="h-4 w-4" />
					Download O2R
				</Button>
			</div>
		</div>
	);
}
