import { FolderInput, Plus, Trash } from "lucide-react";
import { TextureType } from "@/components/image-viewer";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { AnimationEntry, ResourceEntry } from "@/lib/types";

interface ParsedTexture {
	width: number;
	height: number;
	textureType: number;
}

interface ResourceMetadataProps {
	resource: ResourceEntry;
	parsedAnimation: AnimationEntry | null;
	parsedTexture: ParsedTexture | null;
	isFromWorkspace: boolean;
	onAddToWorkspace?: () => void;
	onMove?: () => void;
	onDelete?: () => void;
}

export function ResourceMetadata({
	resource,
	parsedAnimation,
	parsedTexture,
	isFromWorkspace,
	onAddToWorkspace,
	onMove,
	onDelete,
}: ResourceMetadataProps) {
	return (
		<Card className="mb-4">
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<CardTitle className="text-lg">{resource.path}</CardTitle>
						<CardDescription>{resource.header.resourceType}</CardDescription>
					</div>
					{!isFromWorkspace && onAddToWorkspace && (
						<Button
							size="sm"
							onClick={onAddToWorkspace}
							className="flex-shrink-0"
						>
							<Plus className="h-4 w-4 mr-1" />
							Add to Workspace
						</Button>
					)}
					{isFromWorkspace && (onDelete || onMove) && (
						<div className="flex gap-2 flex-shrink-0">
							{onMove && (
								<Button size="sm" variant="outline" onClick={onMove}>
									<FolderInput className="h-4 w-4 mr-1" />
									Move
								</Button>
							)}
							{onDelete && (
								<Button size="sm" variant="destructive" onClick={onDelete}>
									<Trash className="h-4 w-4 mr-1" />
									Delete
								</Button>
							)}
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-muted-foreground">Size:</span>{" "}
						<span className="font-mono">
							{resource.dataWithoutHeader.length} bytes ({resource.data.length}{" "}
							w/ header)
						</span>
					</div>
					{parsedAnimation && (
						<>
							<div>
								<span className="text-muted-foreground">Type:</span>{" "}
								<span className="font-mono">{parsedAnimation.type}</span>
							</div>
							<div>
								<span className="text-muted-foreground">Frames:</span>{" "}
								<span className="font-mono">{parsedAnimation.frameCount}</span>
							</div>
							{parsedAnimation.type === "actor" && (
								<>
									<div>
										<span className="text-muted-foreground">Joints:</span>{" "}
										<span className="font-mono">
											{parsedAnimation.jointIndices.length}
										</span>
									</div>
									<div>
										<span className="text-muted-foreground">
											Static Index Max:
										</span>{" "}
										<span className="font-mono">
											{parsedAnimation.staticIndexMax}
										</span>
									</div>
								</>
							)}
							{parsedAnimation.type === "link" && (
								<div>
									<span className="text-muted-foreground">Values:</span>{" "}
									<span className="font-mono">
										{parsedAnimation.data.length}
									</span>
								</div>
							)}
						</>
					)}
					{parsedTexture && (
						<>
							<div>
								<span className="text-muted-foreground">Dimensions:</span>{" "}
								<span className="font-mono">
									{parsedTexture.width} x {parsedTexture.height}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Format:</span>{" "}
								<span className="font-mono">
									{TextureType[parsedTexture.textureType]}
								</span>
							</div>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
