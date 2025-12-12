// O2R (OTR Archive) parser for reading Ship of Harkinian resource files

import {
	fourCCToString,
	readUInt32LE,
	readUInt64LE,
	stringToFourCC,
	writeUInt32LE,
	writeUInt64LE,
} from "@/lib/binary-utils";
import { OTR_HEADER_SIZE, RESOURCE_TYPE_MAP } from "@/lib/constants/binary";
import type { ResourceEntry, ResourceHeader } from "@/lib/types";

export type { ResourceEntry, ResourceHeader };

/**
 * Convert resource type bytes to string, returns null for unknown types
 */
function resourceTypeToString(typeValue: number): string | null {
	const typeStr = fourCCToString(typeValue);
	return RESOURCE_TYPE_MAP[typeStr] || null;
}

/**
 * Parse the OTR header from resource data
 */
export function parseResourceHeader(data: Uint8Array): ResourceHeader | null {
	if (data.length < OTR_HEADER_SIZE) {
		throw new Error(
			`Data too small for OTR header (need ${OTR_HEADER_SIZE} bytes, got ${data.length})`,
		);
	}

	const endianness = data[0];
	const isCustom = data[1] !== 0;
	const resourceType = resourceTypeToString(readUInt32LE(data, 4));
	const resourceVersion = readUInt32LE(data, 8);
	const uniqueId = readUInt64LE(data, 12);

	// Return null if resource type is not recognized
	if (!resourceType) {
		return null;
	}

	return {
		endianness,
		isCustom,
		resourceType,
		resourceVersion,
		uniqueId,
	};
}

/**
 * Parse an O2R archive file (which is a ZIP file)
 */
export async function parseO2RArchive(file: File): Promise<ResourceEntry[]> {
	// Dynamically import JSZip
	const JSZip = (await import("jszip")).default;

	const zip = await JSZip.loadAsync(file);
	const resources: ResourceEntry[] = [];

	// Iterate through all files in the archive
	for (const [path, zipEntry] of Object.entries(zip.files)) {
		// Skip directories
		if (zipEntry.dir) {
			continue;
		}

		try {
			// Read the file data
			const data = await zipEntry.async("uint8array");

			// Skip files that are too small to have a header
			if (data.length < OTR_HEADER_SIZE) {
				// console.warn(`Skipping ${path}: too small for OTR header`);
				continue;
			}

			// Parse the header
			const header = parseResourceHeader(data);

			// Skip resources with unrecognized types
			if (!header) {
				// console.warn(`Skipping ${path}: unrecognized resource type`);
				continue;
			}

			// Extract data without header
			const dataWithoutHeader = data.slice(OTR_HEADER_SIZE);

			resources.push({
				path,
				header,
				data,
				dataWithoutHeader,
			});
		} catch (error) {
			console.error(`Error parsing ${path}:`, error);
			// Continue with other files even if one fails
		}
	}

	return resources;
}

/**
 * Get a preview/description of a resource
 */
export function getResourceDescription(resource: ResourceEntry): string {
	const size = (resource.data.length / 1024).toFixed(2);
	return `${resource.header.resourceType} (${size} KB)`;
}

/**
 * Format resource data as hex string for display
 */
export function formatHexData(
	data: Uint8Array,
	bytesPerLine: number = 16,
): string {
	const lines: string[] = [];

	for (let i = 0; i < data.length; i += bytesPerLine) {
		const offset = i.toString(16).padStart(8, "0");
		const bytes: string[] = [];
		const ascii: string[] = [];

		for (let j = 0; j < bytesPerLine; j++) {
			if (i + j < data.length) {
				const byte = data[i + j];
				bytes.push(byte.toString(16).padStart(2, "0"));
				// Display printable ASCII characters, otherwise use '.'
				ascii.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".");
			} else {
				bytes.push("  ");
				ascii.push(" ");
			}
		}

		// Group bytes in chunks of 8 for readability
		const hexPart1 = bytes.slice(0, 8).join(" ");
		const hexPart2 = bytes.slice(8, 16).join(" ");
		const hexPart = `${hexPart1}  ${hexPart2}`;

		lines.push(`${offset}  ${hexPart}  |${ascii.join("")}|`);
	}

	return lines.join("\n");
}

/**
 * Export resources as an O2R archive (ZIP file)
 */
export async function exportO2RArchive(
	resources: ResourceEntry[],
	filename: string = "workspace.o2r",
): Promise<void> {
	// Dynamically import JSZip
	const JSZip = (await import("jszip")).default;

	const zip = new JSZip();

	// Add each resource to the ZIP
	for (const resource of resources) {
		// Use the full resource data (including header)
		zip.file(resource.path, resource.data);
	}

	// Generate the ZIP file
	const blob = await zip.generateAsync({ type: "blob" });

	// Create download link
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Create a resource header byte array
 */
export function createResourceHeader(
	resourceType: string,
	resourceVersion: number = 0,
	uniqueId: bigint = BigInt(0),
	isCustom: boolean = false,
	endianness: number = 0,
): Uint8Array {
	const header = new Uint8Array(OTR_HEADER_SIZE);

	// Byte 0: endianness
	header[0] = endianness;

	// Byte 1: isCustom flag
	header[1] = isCustom ? 1 : 0;

	// Bytes 2-3: reserved (padding)
	header[2] = 0;
	header[3] = 0;

	// Bytes 4-7: resource type (FourCC)
	writeUInt32LE(header, 4, stringToFourCC(resourceType));

	// Bytes 8-11: resource version
	writeUInt32LE(header, 8, resourceVersion);

	// Bytes 12-19: unique ID (64-bit)
	writeUInt64LE(header, 12, uniqueId);

	// Bytes 20-63: reserved (padding)
	for (let i = 20; i < OTR_HEADER_SIZE; i++) {
		header[i] = 0;
	}

	return header;
}

/**
 * Create a complete resource from header parameters and data
 */
export function createResource(
	path: string,
	resourceType: string,
	dataWithoutHeader: Uint8Array,
	resourceVersion: number = 0,
	uniqueId: bigint = BigInt(0),
	isCustom: boolean = false,
	endianness: number = 0,
): ResourceEntry {
	const header = createResourceHeader(
		resourceType,
		resourceVersion,
		uniqueId,
		isCustom,
		endianness,
	);

	// Combine header and data
	const data = new Uint8Array(header.length + dataWithoutHeader.length);
	data.set(header, 0);
	data.set(dataWithoutHeader, header.length);

	return {
		path,
		header: {
			endianness,
			isCustom,
			resourceType: RESOURCE_TYPE_MAP[resourceType] || resourceType,
			resourceVersion,
			uniqueId,
		},
		data,
		dataWithoutHeader,
	};
}
