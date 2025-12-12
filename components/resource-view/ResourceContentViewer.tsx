import { AnimationCEditor } from "@/components/animation-c-editor";
import { HexViewer } from "@/components/hex-viewer";
import { ImageViewer } from "@/components/image-viewer";
import { Card, CardContent } from "@/components/ui/card";
import type { ResourceEntry } from "@/lib/types";

type ViewMode = "hex" | "image" | "c-editor";

interface ResourceContentViewerProps {
	resource: ResourceEntry;
	viewMode: ViewMode;
	availableTextures: ResourceEntry[];
	allResources: ResourceEntry[];
	isFromWorkspace: boolean;
	onUpdateResource?: (
		resource: ResourceEntry,
		additionalResources?: ResourceEntry[],
	) => void;
}

export function ResourceContentViewer({
	resource,
	viewMode,
	availableTextures,
	allResources,
	isFromWorkspace,
	onUpdateResource,
}: ResourceContentViewerProps) {
	return (
		<Card className="mb-4 overflow-scroll flex-1">
			<CardContent className="flex-1">
				{viewMode === "hex" && <HexViewer resource={resource} />}
				{viewMode === "image" && resource.header.resourceType === "Texture" && (
					<ImageViewer
						resource={resource}
						availableTextures={availableTextures}
					/>
				)}
				{viewMode === "c-editor" &&
					resource.header.resourceType === "Animation" && (
						<AnimationCEditor
							resource={resource}
							onSave={onUpdateResource}
							isFromWorkspace={isFromWorkspace}
							allResources={allResources}
						/>
					)}
			</CardContent>
		</Card>
	);
}
