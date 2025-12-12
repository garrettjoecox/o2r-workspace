import { Download, Plus, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkspaceToolbarProps {
	onUploadClick: () => void;
	onExportClick: () => void;
	onCreatePlayerAnimation: () => void;
	workspaceResourceCount: number;
}

export function WorkspaceToolbar({
	onUploadClick,
	onExportClick,
	onCreatePlayerAnimation,
	workspaceResourceCount,
}: WorkspaceToolbarProps) {
	return (
		<div className="border-b border-border p-4 flex items-center justify-center gap-2">
			<div className="flex items-center gap-4">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="outline">
							<Plus className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuLabel>Create Resource</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={onCreatePlayerAnimation}>
							<User className="h-4 w-4 mr-2" />
							Player Animation
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

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
