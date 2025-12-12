import { FileCode, Upload, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface CreatePlayerAnimationDialogProps {
	open: boolean;
	onConfirm: (path: string, files: File[]) => void;
	onCancel: () => void;
}

export function CreatePlayerAnimationDialog({
	open,
	onConfirm,
	onCancel,
}: CreatePlayerAnimationDialogProps) {
	const [path, setPath] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [error, setError] = useState<string | null>(null);

	// Reset state when dialog opens
	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setPath("");
			setFiles([]);
			setError(null);
			onCancel();
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || []);
		if (selectedFiles.length > 2) {
			setError("Please select at most 2 files");
			return;
		}
		setFiles(selectedFiles);
		setError(null);
	};

	const handleRemoveFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleConfirm = () => {
		// Validate inputs
		if (!path.trim()) {
			setError("Please enter a resource path");
			return;
		}

		if (files.length === 0) {
			setError("Please upload at least one C file");
			return;
		}

		if (files.length > 2) {
			setError("Please upload at most 2 files");
			return;
		}

		// Check file extensions
		const allCFiles = files.every(
			(f) => f.name.endsWith(".c") || f.name.endsWith(".h"),
		);
		if (!allCFiles) {
			setError("All files must be C source (.c) or header (.h) files");
			return;
		}

		onConfirm(path.trim(), files);

		// Reset state
		setPath("");
		setFiles([]);
		setError(null);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>Create Player Animation</DialogTitle>
					<DialogDescription>
						Upload C source file(s) containing Link animation data. You can
						upload either a single file with both the LinkAnimationHeader and
						s16 array, or two separate files (one for the header, one for the
						data array).
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="animation-path">Resource Path</Label>
						<Input
							id="animation-path"
							value={path}
							onChange={(e) => setPath(e.target.value)}
							placeholder="e.g., objects/gameplay_keep/gPlayerAnim_link_normal_run_jump"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleConfirm();
								}
							}}
						/>
						<p className="text-xs text-muted-foreground">
							The path where this animation will be stored in the O2R archive
						</p>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="animation-files">C Source Files (1-2 files)</Label>
						<div className="flex flex-col gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									const input = document.getElementById(
										"animation-files",
									) as HTMLInputElement;
									input?.click();
								}}
								className="w-full"
							>
								<Upload className="h-4 w-4 mr-2" />
								Select Files
							</Button>
							<input
								id="animation-files"
								type="file"
								accept=".c,.h"
								multiple
								onChange={handleFileChange}
								className="hidden"
							/>
						</div>

						{files.length > 0 && (
							<div className="space-y-2 mt-2">
								{files.map((file, index) => (
									<div
										key={`${file.name}-${file.size}`}
										className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
									>
										<div className="flex items-center gap-2">
											<FileCode className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-mono">{file.name}</span>
											<span className="text-xs text-muted-foreground">
												({(file.size / 1024).toFixed(1)} KB)
											</span>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveFile(index)}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>

					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => handleOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={!path.trim() || files.length === 0}
					>
						Create Animation
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
