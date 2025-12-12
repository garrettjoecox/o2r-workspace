"use client";

import { formatHexData } from "@/lib/parsers/o2r";
import type { ResourceEntry } from "@/lib/types";

export function HexViewer({ resource }: { resource: ResourceEntry }) {
	const hexData = formatHexData(resource.dataWithoutHeader);

	return (
		<div className="h-full flex flex-col">
			<div className="h-full">
				<pre className="font-mono text-xs p-4 leading-relaxed whitespace-pre">
					{hexData}
				</pre>
			</div>
		</div>
	);
}
