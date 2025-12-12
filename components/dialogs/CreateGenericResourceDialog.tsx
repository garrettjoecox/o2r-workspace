import { FileCode, Upload, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface CreateGenericResourceDialogProps {
	open: boolean;
	onConfirm: (
		path: string,
		resourceType: string,
		file: File,
		resourceVersion: number,
		uniqueId: bigint,
		isCustom: boolean,
	) => void;
	onCancel: () => void;
}

// Available resource types from RESOURCE_TYPE_MAP
const RESOURCE_TYPES = [
	{ value: "OARR", label: "Array" },
	{ value: "OANM", label: "Animation" },
	{ value: "OPAM", label: "Player Animation" },
	{ value: "OROM", label: "Room" },
	{ value: "OCOL", label: "Collision Header" },
	{ value: "OSKL", label: "Skeleton" },
	{ value: "OSLB", label: "Skeleton Limb" },
	{ value: "OPTH", label: "Path" },
	{ value: "OCUT", label: "Cutscene" },
	{ value: "OTXT", label: "Text" },
	{ value: "OAUD", label: "Audio" },
	{ value: "OSMP", label: "Audio Sample" },
	{ value: "OSFT", label: "Audio SoundFont" },
	{ value: "OSEQ", label: "Audio Sequence" },
	{ value: "OBGI", label: "Background" },
	{ value: "ORCM", label: "Scene Command" },
	{ value: "ODLT", label: "Display List" },
	{ value: "LGTS", label: "Light" },
	{ value: "OMTX", label: "Matrix" },
	{ value: "OTEX", label: "Texture" },
	{ value: "OVTX", label: "Vertex" },
];

export function CreateGenericResourceDialog({
	open,
	onConfirm,
	onCancel,
}: CreateGenericResourceDialogProps) {
	const [path, setPath] = useState("");
	const [resourceType, setResourceType] = useState<string>("");
	const [file, setFile] = useState<File | null>(null);
	const [resourceVersion, setResourceVersion] = useState("0");
	const [isCustom, setIsCustom] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Reset state when dialog opens
	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setPath("");
			setResourceType("");
			setFile(null);
			setResourceVersion("0");
			setIsCustom(false);
			setError(null);
			onCancel();
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
			setError(null);
		}
	};

	const handleRemoveFile = () => {
		setFile(null);
	};

	const handleConfirm = () => {
		// Validate inputs
		if (!path.trim()) {
			setError("Please enter a resource path");
			return;
		}

		if (!resourceType) {
			setError("Please select a resource type");
			return;
		}

		if (!file) {
			setError("Please upload a file");
			return;
		}

		// Parse numeric fields
		let parsedVersion: number;

		try {
			parsedVersion = Number.parseInt(resourceVersion, 10);
			if (Number.isNaN(parsedVersion) || parsedVersion < 0) {
				setError("Resource version must be a non-negative integer");
				return;
			}
		} catch {
			setError("Invalid resource version");
			return;
		}

		// Use default unique ID (deadbeef pattern)
		const parsedUniqueId = BigInt("0xdeadbeefdeadbeef");

		onConfirm(
			path.trim(),
			resourceType,
			file,
			parsedVersion,
			parsedUniqueId,
			isCustom,
		);

		// Reset state
		setPath("");
		setResourceType("");
		setFile(null);
		setResourceVersion("0");
		setIsCustom(false);
		setError(null);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>Create Generic Resource</DialogTitle>
					<DialogDescription>
						Create a custom resource by specifying header parameters and
						uploading the resource data file.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Resource Path */}
					<div className="grid gap-2">
						<Label htmlFor="resource-path">Resource Path *</Label>
						<Input
							id="resource-path"
							placeholder="e.g., objects/my_object"
							value={path}
							onChange={(e) => setPath(e.target.value)}
						/>
					</div>

					{/* Resource Type */}
					<div className="grid gap-2">
						<Label htmlFor="resource-type">Resource Type *</Label>
						<Select value={resourceType} onValueChange={setResourceType}>
							<SelectTrigger id="resource-type">
								<SelectValue placeholder="Select resource type" />
							</SelectTrigger>
							<SelectContent>
								{RESOURCE_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label} ({type.value})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Resource Version */}
					<div className="grid gap-2">
						<Label htmlFor="resource-version">Resource Version</Label>
						<Input
							id="resource-version"
							type="number"
							min="0"
							value={resourceVersion}
							onChange={(e) => setResourceVersion(e.target.value)}
						/>
					</div>

					{/* Is Custom */}
					<div className="flex items-center space-x-2">
						<Checkbox
							id="is-custom"
							checked={isCustom}
							onCheckedChange={(checked) => setIsCustom(checked === true)}
						/>
						<Label
							htmlFor="is-custom"
							className="text-sm font-normal cursor-pointer"
						>
							Mark as custom resource
						</Label>
					</div>

					{/* File Upload */}
					<div className="grid gap-2">
						<Label htmlFor="file-upload">Resource Data File *</Label>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => document.getElementById("file-upload")?.click()}
							>
								<Upload className="h-4 w-4 mr-2" />
								{file ? "Change File" : "Upload File"}
							</Button>
							<input
								id="file-upload"
								type="file"
								className="hidden"
								onChange={handleFileChange}
							/>
						</div>
						{file && (
							<div className="flex items-center gap-2 p-2 bg-muted rounded-md">
								<FileCode className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm flex-1 truncate">{file.name}</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleRemoveFile}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>

					{/* Error Message */}
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
					<Button onClick={handleConfirm}>Create Resource</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
