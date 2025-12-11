"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatHexData, type ResourceEntry } from "@/lib/o2r-parser";

interface HexViewerProps {
	resource: ResourceEntry;
}

export function HexViewer({ resource }: HexViewerProps) {
	const hexData = formatHexData(resource.dataWithoutHeader);

	return (
		<div className="h-full flex flex-col">
			<Card className="mb-4">
				<CardHeader>
					<CardTitle className="text-lg">{resource.path}</CardTitle>
					<CardDescription>{resource.header.resourceType}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">Size:</span>{" "}
							<span className="font-mono">
								{resource.dataWithoutHeader.length} bytes
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Total with header:</span>{" "}
							<span className="font-mono">{resource.data.length} bytes</span>
						</div>
						<div>
							<span className="text-muted-foreground">Version:</span>{" "}
							<span className="font-mono">
								{resource.header.resourceVersion}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Custom:</span>{" "}
							<span className="font-mono">
								{resource.header.isCustom ? "Yes" : "No"}
							</span>
						</div>
						<div className="col-span-2">
							<span className="text-muted-foreground">Unique ID:</span>{" "}
							<span className="font-mono text-xs">
								0x{resource.header.uniqueId.toString(16).padStart(16, "0")}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="flex-1 flex flex-col overflow-hidden">
				<CardHeader>
					<CardTitle className="text-base">
						Hex View (without OTR header)
					</CardTitle>
					<CardDescription>Binary data content</CardDescription>
				</CardHeader>
				<CardContent className="flex-1 overflow-hidden p-0">
					<div className="h-full">
						<pre className="font-mono text-xs p-4 leading-relaxed whitespace-pre">
							{hexData}
						</pre>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
