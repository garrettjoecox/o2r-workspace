"use client";

import { useEffect, useState } from "react";
import { MoveResourceDialog } from "@/components/dialogs/MoveResourceDialog";
import { parseTextureData } from "@/components/image-viewer";
import { ResourceContentViewer } from "@/components/resource-view/ResourceContentViewer";
import { ResourceMetadata } from "@/components/resource-view/ResourceMetadata";
import { ViewModeSelector } from "@/components/resource-view/ViewModeSelector";
import {
	parseAnimationFromResource,
	splitLinkAnimationToBlobs,
} from "@/lib/parsers/animation";
import type { ResourceEntry } from "@/lib/types";

interface ResourceViewProps {
	resource: ResourceEntry;
	isFromWorkspace?: boolean;
	onAddToWorkspace?: (
		resource: ResourceEntry,
		additionalResources?: ResourceEntry[],
	) => void;
	allResources?: ResourceEntry[];
	onUpdateResource?: (
		resource: ResourceEntry,
		additionalResources?: ResourceEntry[],
	) => void;
	onDelete?: (resource: ResourceEntry) => void;
	onMove?: (resource: ResourceEntry, newPath: string) => void;
}

type ViewMode = "hex" | "image" | "c-editor";

export function ResourceView({
	resource,
	isFromWorkspace = false,
	onAddToWorkspace,
	allResources = [],
	onUpdateResource,
	onDelete,
	onMove,
}: ResourceViewProps) {
	const [viewMode, setViewMode] = useState<ViewMode>("image");
	const [viewModes, setViewModes] = useState<ViewMode[]>(["hex"]);
	const [showMoveDialog, setShowMoveDialog] = useState(false);

	// Get textures from the same folder for palette selection
	const folderPath = resource.path.substring(0, resource.path.lastIndexOf("/"));
	const availableTextures = allResources.filter(
		(r) =>
			r.header.resourceType === "Texture" &&
			r.path.startsWith(folderPath + "/") &&
			r.path.includes("TLUT") &&
			r.path !== resource.path,
	);

	const parsedAnimation =
		resource.header.resourceType === "Animation"
			? parseAnimationFromResource(resource, allResources)
			: null;
	const parsedTexture =
		resource.header.resourceType === "Texture"
			? parseTextureData(resource.dataWithoutHeader)
			: null;

	useEffect(() => {
		const modes: ViewMode[] = [];
		switch (resource.header.resourceType) {
			case "Texture":
				setViewMode("image");
				modes.push("image");
				break;
			case "Animation":
				setViewMode("c-editor");
				modes.push("c-editor");
				break;
			default:
				setViewMode("hex");
				break;
		}

		modes.push("hex");
		setViewModes(modes);
	}, [resource.header.resourceType]);

	const handleAddToWorkspace = async () => {
		if (!onAddToWorkspace) return;

		// For Link animations (type 1), we need to also add the data file
		if (resource.header.resourceType === "Animation") {
			try {
				// Parse the animation to determine its type
				const parsedAnim = parseAnimationFromResource(resource, allResources);

				if (parsedAnim.type === "link") {
					// For Link animations, regenerate both header and data files
					const folderPath = resource.path.substring(
						0,
						resource.path.lastIndexOf("/"),
					);

					const { headerBlob, dataBlob, dataPath } = splitLinkAnimationToBlobs(
						parsedAnim,
						folderPath,
					);

					// Convert blobs to Uint8Array
					const [headerBuffer, dataBuffer] = await Promise.all([
						headerBlob.arrayBuffer(),
						dataBlob.arrayBuffer(),
					]);

					const headerData = new Uint8Array(headerBuffer);
					const dataData = new Uint8Array(dataBuffer);

					// Create updated header resource with new data path
					const updatedHeaderResource: ResourceEntry = {
						...resource,
						data: headerData,
						dataWithoutHeader: headerData.slice(64),
					};

					// Create data resource
					const dataResource: ResourceEntry = {
						path: dataPath,
						header: {
							endianness: 0,
							isCustom: false,
							resourceType: "Player Animation",
							resourceVersion: 0,
							uniqueId: BigInt("0xdeadbeefdeadbeef"),
						},
						data: dataData,
						dataWithoutHeader: dataData.slice(64),
					};

					onAddToWorkspace(updatedHeaderResource, [dataResource]);
					return;
				}
			} catch (e) {
				console.error("Failed to parse Link animation:", e);
			}
		}
		onAddToWorkspace(resource);
	};

	const handleMove = (newPath: string) => {
		if (onMove) {
			onMove(resource, newPath);
		}
		setShowMoveDialog(false);
	};

	return (
		<div className="h-full flex flex-col overflow-hidden p-6">
			<ResourceMetadata
				resource={resource}
				parsedAnimation={parsedAnimation}
				parsedTexture={parsedTexture}
				isFromWorkspace={isFromWorkspace}
				onAddToWorkspace={handleAddToWorkspace}
				onMove={onMove ? () => setShowMoveDialog(true) : undefined}
				onDelete={onDelete ? () => onDelete(resource) : undefined}
			/>

			<ViewModeSelector
				viewModes={viewModes}
				currentViewMode={viewMode}
				onViewModeChange={setViewMode}
			/>

			<ResourceContentViewer
				resource={resource}
				viewMode={viewMode}
				availableTextures={availableTextures}
				allResources={allResources}
				isFromWorkspace={isFromWorkspace}
				onUpdateResource={onUpdateResource}
			/>

			<MoveResourceDialog
				open={showMoveDialog}
				currentPath={resource.path}
				onConfirm={handleMove}
				onCancel={() => setShowMoveDialog(false)}
			/>
		</div>
	);
}
