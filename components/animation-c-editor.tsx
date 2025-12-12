"use client";

import { AlertCircle, Download, Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type AnimationEntry,
	animationToC,
	animationToResourceBinary,
	parseAnimationFromC,
	parseAnimationFromResource,
	splitLinkAnimationToBlobs,
} from "@/lib/parsers/animation";
import type { ResourceEntry } from "@/lib/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface AnimationCEditorProps {
	resource: ResourceEntry;
	onSave?: (
		updatedResource: ResourceEntry,
		additionalResources?: ResourceEntry[],
	) => void;
	isFromWorkspace?: boolean;
	allResources?: ResourceEntry[];
}

export function AnimationCEditor({
	resource,
	onSave,
	isFromWorkspace = false,
	allResources = [],
}: AnimationCEditorProps) {
	const [cCode, setCCode] = useState<string>("");
	const [animation, setAnimation] = useState<AnimationEntry | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [hasChanges, setHasChanges] = useState(false);

	// Parse the resource into C code on mount
	useEffect(() => {
		try {
			const parsedAnimation = parseAnimationFromResource(
				resource,
				allResources,
			);
			setAnimation(parsedAnimation);
			const generatedC = animationToC(parsedAnimation);
			setCCode(generatedC);
			setError(null);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to parse animation",
			);
		}
	}, [resource, allResources]);

	const handleCodeChange = (newCode: string) => {
		setCCode(newCode);
		setHasChanges(true);
	};

	const handleSave = async () => {
		try {
			// Parse the C code back into animation data
			const updatedAnimation = parseAnimationFromC(cCode);

			if (updatedAnimation.type === "actor") {
				// Convert back to binary format for Actor animations
				const binaryData = animationToResourceBinary(updatedAnimation);

				// Create updated resource with new data
				const updatedResource: ResourceEntry = {
					...resource,
					dataWithoutHeader: binaryData,
					data: new Uint8Array([...resource.data.slice(0, 64), ...binaryData]),
				};

				setAnimation(updatedAnimation);
				setHasChanges(false);
				setError(null);

				if (onSave) {
					onSave(updatedResource);
				}
			} else if (updatedAnimation.type === "link") {
				// For Link animations, we need to split into header and data files
				// Extract the path prefix from the current resource
				const folderPath = resource.path.substring(
					0,
					resource.path.lastIndexOf("/"),
				);

				// Split the animation into header and data blobs
				const { headerBlob, dataBlob, dataPath } = splitLinkAnimationToBlobs(
					updatedAnimation,
					folderPath,
				);

				// Convert blobs to Uint8Array
				const [headerBuffer, dataBuffer] = await Promise.all([
					headerBlob.arrayBuffer(),
					dataBlob.arrayBuffer(),
				]);

				const headerData = new Uint8Array(headerBuffer);
				const dataData = new Uint8Array(dataBuffer);

				// Create updated header resource
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

				setAnimation(updatedAnimation);
				setHasChanges(false);
				setError(null);

				if (onSave) {
					// Pass both the header resource and the data resource
					onSave(updatedHeaderResource, [dataResource]);
				}
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to parse C code. Please check syntax.",
			);
		}
	};

	const handleDownload = () => {
		const blob = new Blob([cCode], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${animation?.name || "animation"}.c`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const getAnimationInfo = () => {
		if (!animation) return null;

		if (animation.type === "link") {
			return `${animation.frameCount} frames • ${animation.data.length} values`;
		} else {
			return `${animation.frameCount} frames • ${animation.frameData.length} values • ${animation.jointIndices.length} joints`;
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between mb-4">
				<div className="flex gap-2">
					<Button
						onClick={handleSave}
						disabled={!hasChanges}
						size="sm"
						variant={hasChanges ? "default" : "outline"}
					>
						<Save className="h-4 w-4 mr-1" />
						{isFromWorkspace ? "Save Changes" : "Save to Workspace"}
					</Button>
					<Button onClick={handleDownload} size="sm" variant="outline">
						<Download className="h-4 w-4 mr-1" />
						Download
					</Button>
				</div>
				{animation && (
					<div className="text-sm text-muted-foreground">
						{animation.type === "link" ? "Link Animation" : "Actor Animation"} •{" "}
						{getAnimationInfo()}
					</div>
				)}
			</div>

			{error && (
				<Alert variant="destructive" className="mb-4">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="flex-1 border rounded-md overflow-hidden">
				<textarea
					value={cCode}
					onChange={(e) => handleCodeChange(e.target.value)}
					className="w-full h-full p-4 font-mono text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
					spellCheck={false}
				/>
			</div>

			{hasChanges && (
				<div className="mt-4 text-sm text-muted-foreground">
					You have unsaved changes. Click "
					{isFromWorkspace ? "Save Changes" : "Save to Workspace"}" to apply
					them{isFromWorkspace ? " to the resource" : " and add to workspace"}.
				</div>
			)}
		</div>
	);
}
