import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MoveResourceDialogProps {
	open: boolean;
	currentPath: string;
	onConfirm: (newPath: string) => void;
	onCancel: () => void;
}

export function MoveResourceDialog({
	open,
	currentPath,
	onConfirm,
	onCancel,
}: MoveResourceDialogProps) {
	const [newPath, setNewPath] = useState("");

	// Reset newPath when dialog opens
	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setNewPath("");
			onCancel();
		}
	};

	const handleConfirm = () => {
		if (newPath.trim()) {
			onConfirm(newPath.trim());
			setNewPath("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Move Resource</DialogTitle>
					<DialogDescription>
						Enter the new path for this resource. The path should include the
						full resource path (e.g., "textures/link/adult/link_adult_body").
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="move-path">Current Path</Label>
						<Input
							id="current-path"
							value={currentPath}
							disabled
							className="font-mono text-sm"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="new-path">New Path</Label>
						<Input
							id="new-path"
							value={newPath}
							onChange={(e) => setNewPath(e.target.value)}
							placeholder="Enter new resource path"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleConfirm();
								}
							}}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button onClick={handleConfirm} disabled={!newPath.trim()}>
						Move
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
