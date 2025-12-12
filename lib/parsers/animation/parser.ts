// Animation parser for Ocarina of Time / Majora's Mask animations

import {
	readInt16LE,
	readUInt16LE,
	readUInt32LE,
	writeInt16LE,
	writeUInt16LE,
	writeUInt32LE,
} from "@/lib/binary-utils";
import { OTR_HEADER_SIZE } from "@/lib/constants/binary";
import type {
	ActorAnimationEntry,
	AnimationEntry,
	AnimationFile,
	AnimationType,
	JointIndex,
	LinkAnimationEntry,
	ResourceEntry,
} from "@/lib/types";

export type {
	ActorAnimationEntry,
	AnimationEntry,
	AnimationFile,
	AnimationType,
	JointIndex,
	LinkAnimationEntry,
	ResourceEntry,
};

/**
 * Parse animation data from binary format (MAPO file)
 */
export function parseAnimationData(rawData: Uint8Array): Int16Array {
	if (rawData.length < OTR_HEADER_SIZE + 8) {
		throw new Error("File too small to be valid animation data");
	}

	// Animation data starts after 64-byte header
	const dataStart = OTR_HEADER_SIZE;
	const numValues = readUInt32LE(rawData, dataStart); // Number of s16 values

	// Read s16 array data (little-endian, matching OTR header endianness flag)
	const animData = new Int16Array(numValues);

	for (let i = 0; i < numValues; i++) {
		animData[i] = readInt16LE(rawData, dataStart + 4 + i * 2);
	}

	return animData;
}

/**
 * Parse animation header from binary format (MNAO file)
 */
export function parseAnimationHeader(rawData: Uint8Array): {
	frameCount: number;
	dataPath: string;
} {
	if (rawData.length < OTR_HEADER_SIZE + 8) {
		throw new Error("File too small to be valid animation header");
	}

	// Read header data
	const offset = OTR_HEADER_SIZE;
	readUInt32LE(rawData, offset); // version (unused)
	const frameCount = readUInt16LE(rawData, offset + 4);
	const pathLength = readUInt16LE(rawData, offset + 6);
	// 2 bytes of padding/alignment at offset + 8 to offset + 9

	// Read path string (after 2-byte padding)
	const pathStart = offset + 10;
	const pathData = rawData.slice(pathStart, pathStart + pathLength);
	const dataPath = new TextDecoder().decode(pathData);

	return { frameCount, dataPath };
}

/**
 * Update the data path in a Link animation header file
 */
export function updateAnimationHeaderPath(
	rawData: Uint8Array,
	newDataPath: string,
): Uint8Array {
	if (rawData.length < OTR_HEADER_SIZE + 8) {
		throw new Error("File too small to be valid animation header");
	}

	// Parse existing header to get frame count
	const offset = OTR_HEADER_SIZE;
	const version = readUInt32LE(rawData, offset);
	const frameCount = readUInt16LE(rawData, offset + 4);

	// Encode new path
	const pathBytes = new TextEncoder().encode(newDataPath);
	const totalSize = OTR_HEADER_SIZE + 10 + pathBytes.length;
	const buffer = new Uint8Array(totalSize);

	// Copy the OTR header (first 64 bytes)
	buffer.set(rawData.slice(0, OTR_HEADER_SIZE));

	// Write header data with new path
	writeUInt32LE(buffer, offset, version);
	writeUInt16LE(buffer, offset + 4, frameCount);
	writeUInt16LE(buffer, offset + 6, pathBytes.length);
	// 2 bytes of padding/alignment at offset + 8 to offset + 9 (already zeroed)

	// Write new path string
	buffer.set(pathBytes, offset + 10);

	return buffer;
}

/**
 * Parse Link animation data array from C source code
 */
export function parseLinkAnimationDataFromC(
	cSource: string,
): { dataArrayName: string; data: Int16Array } | null {
	// Extract array name and data
	const arrayMatch = cSource.match(/s16\s+(\w+)\s*\[\s*\]\s*=\s*\{([^}]+)\}/);
	if (!arrayMatch) {
		return null;
	}

	const dataArrayName = arrayMatch[1];
	const dataContent = arrayMatch[2];

	// Parse hex values from the data array
	const hexValues = dataContent.match(/(?:0x[0-9A-Fa-f]+|-0x[0-9A-Fa-f]+)/g);
	if (!hexValues) {
		return null;
	}

	const data = new Int16Array(hexValues.length);
	for (let i = 0; i < hexValues.length; i++) {
		data[i] = parseInt(hexValues[i], 16);
	}

	return { dataArrayName, data };
}

/**
 * Parse Link animation header from C source code
 */
export function parseLinkAnimationHeaderFromC(
	cSource: string,
): { animName: string; frameCount: number; dataArrayName: string } | null {
	// Extract header info
	const headerMatch = cSource.match(
		/LinkAnimationHeader\s+(\w+)\s*=\s*\{\s*\{\s*(\d+)\s*\}\s*,\s*(\w+)/,
	);
	if (!headerMatch) {
		return null;
	}

	const animName = headerMatch[1];
	const frameCount = parseInt(headerMatch[2], 10);
	const dataArrayName = headerMatch[3];

	return { animName, frameCount, dataArrayName };
}

/**
 * Parse Actor animation frame data array from C source code
 */
export function parseActorFrameDataFromC(
	cSource: string,
): { dataArrayName: string; data: Int16Array } | null {
	// Extract array name and data (matches both [] and [size])
	const arrayMatch = cSource.match(
		/s16\s+(\w+)\s*\[\s*\d*\s*\]\s*=\s*\{([^}]+)\}/,
	);
	if (!arrayMatch) {
		return null;
	}

	const dataArrayName = arrayMatch[1];
	const dataContent = arrayMatch[2];

	// Parse hex values from the data array
	const hexValues = dataContent.match(/(?:0x[0-9A-Fa-f]+|-0x[0-9A-Fa-f]+)/g);
	if (!hexValues) {
		return null;
	}

	const data = new Int16Array(hexValues.length);
	for (let i = 0; i < hexValues.length; i++) {
		data[i] = parseInt(hexValues[i], 16);
	}

	return { dataArrayName, data };
}

/**
 * Parse Actor animation joint indices from C source code
 */
export function parseActorJointIndicesFromC(
	cSource: string,
): { indicesArrayName: string; indices: JointIndex[] } | null {
	// Extract array name and data (matches both [] and [size])
	// Use [\s\S] to match across newlines and handle nested braces
	const arrayMatch = cSource.match(
		/JointIndex\s+(\w+)\s*\[\s*\d*\s*\]\s*=\s*\{([\s\S]+?)\};/,
	);
	if (!arrayMatch) {
		return null;
	}

	const indicesArrayName = arrayMatch[1];
	const dataContent = arrayMatch[2];

	// Parse joint index entries like { 0x0000, 0x0001, 0x0000, }
	const entryMatches = dataContent.matchAll(
		/\{\s*(0x[0-9A-Fa-f]+)\s*,\s*(0x[0-9A-Fa-f]+)\s*,\s*(0x[0-9A-Fa-f]+)\s*,?\s*\}/g,
	);
	const indices: JointIndex[] = [];

	for (const match of entryMatches) {
		indices.push({
			x: parseInt(match[1], 16),
			y: parseInt(match[2], 16),
			z: parseInt(match[3], 16),
		});
	}

	if (indices.length === 0) {
		return null;
	}

	return { indicesArrayName, indices };
}

/**
 * Parse Actor animation header from C source code
 */
export function parseActorAnimationHeaderFromC(cSource: string): {
	animName: string;
	frameCount: number;
	frameDataName: string;
	jointIndicesName: string;
	staticIndexMax: number;
} | null {
	// Extract header info: AnimationHeader name = { { frameCount }, frameData, jointIndices, staticIndexMax };
	const headerMatch = cSource.match(
		/AnimationHeader\s+(\w+)\s*=\s*\{\s*\{\s*(\d+)\s*\}\s*,\s*(\w+)\s*,\s*(\w+)\s*,\s*(\d+)\s*\}/,
	);
	if (!headerMatch) {
		return null;
	}

	const animName = headerMatch[1];
	const frameCount = parseInt(headerMatch[2], 10);
	const frameDataName = headerMatch[3];
	const jointIndicesName = headerMatch[4];
	const staticIndexMax = parseInt(headerMatch[5], 10);

	return {
		animName,
		frameCount,
		frameDataName,
		jointIndicesName,
		staticIndexMax,
	};
}

/**
 * Parse animation from C source code format (combined file)
 * Automatically detects Link or Actor animation type
 */
export function parseAnimationFromC(cSource: string): AnimationEntry {
	// Try to detect animation type
	const hasLinkHeader = /LinkAnimationHeader/.test(cSource);
	const hasActorHeader =
		/AnimationHeader/.test(cSource) && !/LinkAnimationHeader/.test(cSource);

	if (hasLinkHeader) {
		// Parse as Link animation
		const dataResult = parseLinkAnimationDataFromC(cSource);
		const headerResult = parseLinkAnimationHeaderFromC(cSource);

		if (dataResult && headerResult) {
			return {
				type: "link",
				name: headerResult.animName,
				frameCount: headerResult.frameCount,
				data: dataResult.data,
			};
		}

		if (dataResult && !headerResult) {
			throw new Error(
				"File contains only Link animation data array - header file needed",
			);
		}

		if (!dataResult && headerResult) {
			throw new Error(
				"File contains only Link animation header - data file needed",
			);
		}
	}

	if (hasActorHeader) {
		// Parse as Actor animation
		const frameDataResult = parseActorFrameDataFromC(cSource);
		const jointIndicesResult = parseActorJointIndicesFromC(cSource);
		const headerResult = parseActorAnimationHeaderFromC(cSource);

		if (frameDataResult && jointIndicesResult && headerResult) {
			return {
				type: "actor",
				name: headerResult.animName,
				frameCount: headerResult.frameCount,
				frameData: frameDataResult.data,
				jointIndices: jointIndicesResult.indices,
				staticIndexMax: headerResult.staticIndexMax,
			};
		}

		if (!frameDataResult) {
			throw new Error("File contains no frame data array - s16 array needed");
		}

		if (!jointIndicesResult) {
			throw new Error(
				"File contains no joint indices - JointIndex array needed",
			);
		}

		if (!headerResult) {
			throw new Error("File contains no AnimationHeader declaration");
		}
	}

	throw new Error("Invalid C source format - could not detect animation type");
}

/**
 * Combine separate data and header files into a complete Link animation
 */
export function combineLinkAnimationFiles(
	dataSource: string,
	headerSource: string,
): LinkAnimationEntry {
	const dataResult = parseLinkAnimationDataFromC(dataSource);
	const headerResult = parseLinkAnimationHeaderFromC(headerSource);

	if (!dataResult) {
		throw new Error("Invalid data file - could not find s16 array declaration");
	}

	if (!headerResult) {
		throw new Error(
			"Invalid header file - could not find LinkAnimationHeader declaration",
		);
	}

	return {
		type: "link",
		name: headerResult.animName,
		frameCount: headerResult.frameCount,
		data: dataResult.data,
	};
}

/**
 * Combine separate files into a complete Actor animation
 */
export function combineActorAnimationFiles(
	frameDataSource: string,
	jointIndicesSource: string,
	headerSource: string,
): ActorAnimationEntry {
	const frameDataResult = parseActorFrameDataFromC(frameDataSource);
	const jointIndicesResult = parseActorJointIndicesFromC(jointIndicesSource);
	const headerResult = parseActorAnimationHeaderFromC(headerSource);

	if (!frameDataResult) {
		throw new Error(
			"Invalid frame data file - could not find s16 array declaration",
		);
	}

	if (!jointIndicesResult) {
		throw new Error(
			"Invalid joint indices file - could not find JointIndex array declaration",
		);
	}

	if (!headerResult) {
		throw new Error(
			"Invalid header file - could not find AnimationHeader declaration",
		);
	}

	return {
		type: "actor",
		name: headerResult.animName,
		frameCount: headerResult.frameCount,
		frameData: frameDataResult.data,
		jointIndices: jointIndicesResult.indices,
		staticIndexMax: headerResult.staticIndexMax,
	};
}

/**
 * Combine separate data and header files - auto-detects animation type
 */
export function combineAnimationFiles(
	dataSource: string,
	headerSource: string,
): AnimationEntry {
	// Try to detect animation type from header
	const hasLinkHeader = /LinkAnimationHeader/.test(headerSource);

	if (hasLinkHeader) {
		return combineLinkAnimationFiles(dataSource, headerSource);
	}

	// For actor animations, we need all three files, so throw error
	throw new Error(
		"Actor animations require frame data, joint indices, and header files",
	);
}

/**
 * Convert Link animation to C source code format
 */
export function linkAnimationToC(animation: LinkAnimationEntry): string {
	const dataArrayName =
		animation.name.replace(/^gPlayerAnim_/, "gPlayerAnim_") + "_Data";

	let cSource = `s16 ${dataArrayName}[] = {\n`;

	// Format data as hex values, 8 per line
	for (let i = 0; i < animation.data.length; i++) {
		if (i % 8 === 0) {
			cSource += "    ";
		}

		const value = animation.data[i];
		const hexStr =
			value < 0
				? `-0x${(-value).toString(16).toUpperCase().padStart(4, "0")}`
				: `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;
		cSource += hexStr;

		if (i < animation.data.length - 1) {
			cSource += ", ";
		}

		if (i % 8 === 7 && i < animation.data.length - 1) {
			cSource += "\n";
		}
	}

	cSource += "\n};\n\n";
	cSource += `LinkAnimationHeader ${animation.name} = { \n`;
	cSource += `    { ${animation.frameCount} }, ${dataArrayName}\n`;
	cSource += "};\n";

	return cSource;
}

/**
 * Convert Actor animation to C source code format
 */
export function actorAnimationToC(animation: ActorAnimationEntry): string {
	const frameDataName = animation.name + "FrameData";
	const jointIndicesName = animation.name + "JointIndices";

	let cSource = `#include "ultra64.h"\n#include "global.h"\n\n`;

	// Frame data array
	cSource += `s16 ${frameDataName}[${animation.frameData.length}] = {\n`;

	for (let i = 0; i < animation.frameData.length; i++) {
		if (i % 8 === 0) {
			cSource += "    ";
		}

		const value = animation.frameData[i];
		const hexStr =
			value < 0
				? `-0x${(-value).toString(16).toUpperCase().padStart(4, "0")}`
				: `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;
		cSource += hexStr;

		if (i < animation.frameData.length - 1) {
			cSource += ", ";
		}

		if (i % 8 === 7 && i < animation.frameData.length - 1) {
			cSource += "\n";
		}
	}

	cSource += "\n};\n\n";

	// Joint indices array
	cSource += `JointIndex ${jointIndicesName}[${animation.jointIndices.length}] = {\n`;

	for (let i = 0; i < animation.jointIndices.length; i++) {
		const joint = animation.jointIndices[i];
		const xStr = `0x${joint.x.toString(16).toUpperCase().padStart(4, "0")}`;
		const yStr = `0x${joint.y.toString(16).toUpperCase().padStart(4, "0")}`;
		const zStr = `0x${joint.z.toString(16).toUpperCase().padStart(4, "0")}`;
		cSource += `    { ${xStr}, ${yStr}, ${zStr}, },\n`;
	}

	cSource += "};\n\n";

	// Animation header
	cSource += `AnimationHeader ${animation.name} = { { ${animation.frameCount} }, ${frameDataName}, ${jointIndicesName}, ${animation.staticIndexMax} };\n`;

	return cSource;
}

/**
 * Convert animation to C source code format (auto-detects type)
 */
export function animationToC(animation: AnimationEntry): string {
	if (animation.type === "link") {
		return linkAnimationToC(animation);
	} else {
		return actorAnimationToC(animation);
	}
}

/**
 * Convert animation data to binary format (MAPO file for Link, or ANIM file for Actor)
 */
export function animationDataToBlob(animation: AnimationEntry): Blob {
	if (animation.type === "link") {
		// Link animation - MAPO format
		const dataSize = animation.data.length * 2;
		const totalSize = OTR_HEADER_SIZE + 4 + dataSize;
		const buffer = new Uint8Array(totalSize);

		// Write OTR header (first 64 bytes)
		buffer.fill(0, 0, 64);

		// Byte 0: Endianness (0 = little-endian)
		buffer[0] = 0;
		// Byte 1: IsCustom (0 = false)
		buffer[1] = 0;
		// Bytes 2-3: Unused
		buffer[2] = 0;
		buffer[3] = 0;

		// Bytes 4-7: Resource Type as UInt32
		// "MAPO" = 0x4F50414D in little-endian
		writeUInt32LE(buffer, 4, 0x4f50414d);

		// Bytes 8-11: Resource Version (0)
		writeUInt32LE(buffer, 8, 0);

		// Bytes 12-19: Unique ID (0xdeadbeefdeadbeef)
		writeUInt32LE(buffer, 12, 0xdeadbeef);
		writeUInt32LE(buffer, 16, 0xdeadbeef);

		// Write data count (number of s16 values, not bytes)
		writeUInt32LE(buffer, OTR_HEADER_SIZE, animation.data.length);

		// Write animation data as little-endian s16 values
		for (let i = 0; i < animation.data.length; i++) {
			writeInt16LE(buffer, OTR_HEADER_SIZE + 4 + i * 2, animation.data[i]);
		}

		return new Blob([buffer], { type: "application/octet-stream" });
	} else {
		// Actor animation - write as binary animation data
		// AnimationType (4 bytes) + frameCount (2 bytes) + rotValuesCnt (4 bytes) + rotation values + rotIndCnt (4 bytes) + joint indices + staticIndexMax (2 bytes)
		const rotValuesSize = animation.frameData.length * 2;
		const jointIndicesSize = animation.jointIndices.length * 6; // 3 uint16 per joint
		const totalSize =
			OTR_HEADER_SIZE + 4 + 2 + 4 + rotValuesSize + 4 + jointIndicesSize + 2;
		const buffer = new Uint8Array(totalSize);

		// Write OTR header (first 64 bytes)
		buffer.fill(0, 0, 64);
		buffer[0] = 0; // Endianness
		buffer[1] = 0; // IsCustom

		// Bytes 4-7: Resource Type (custom for actor animations)
		// "ANIM" = 0x4D494E41 in little-endian
		writeUInt32LE(buffer, 4, 0x4d494e41);
		writeUInt32LE(buffer, 8, 0); // Version
		writeUInt32LE(buffer, 12, 0xdeadbeef);
		writeUInt32LE(buffer, 16, 0xdeadbeef);

		let offset = OTR_HEADER_SIZE;

		// Write AnimationType (1 for normal animation)
		writeUInt32LE(buffer, offset, 1);
		offset += 4;

		// Write frame count
		writeUInt16LE(buffer, offset, animation.frameCount);
		offset += 2;

		// Write rotation values count
		writeUInt32LE(buffer, offset, animation.frameData.length);
		offset += 4;

		// Write rotation values
		for (let i = 0; i < animation.frameData.length; i++) {
			writeUInt16LE(buffer, offset, animation.frameData[i] & 0xffff);
			offset += 2;
		}

		// Write rotation indices count
		writeUInt32LE(buffer, offset, animation.jointIndices.length);
		offset += 4;

		// Write joint indices
		for (const joint of animation.jointIndices) {
			writeUInt16LE(buffer, offset, joint.x);
			offset += 2;
			writeUInt16LE(buffer, offset, joint.y);
			offset += 2;
			writeUInt16LE(buffer, offset, joint.z);
			offset += 2;
		}

		// Write staticIndexMax
		writeUInt16LE(buffer, offset, animation.staticIndexMax);

		return new Blob([buffer], { type: "application/octet-stream" });
	}
}

/**
 * Convert Link animation data to binary format (MAPO file only, without header)
 */
export function linkAnimationDataToBlob(animation: LinkAnimationEntry): Blob {
	const dataSize = animation.data.length * 2;
	const totalSize = OTR_HEADER_SIZE + 4 + dataSize;
	const buffer = new Uint8Array(totalSize);

	// Write OTR header (first 64 bytes)
	buffer.fill(0, 0, 64);

	// Byte 0: Endianness (0 = little-endian)
	buffer[0] = 0;
	// Byte 1: IsCustom (0 = false)
	buffer[1] = 0;
	// Bytes 2-3: Unused
	buffer[2] = 0;
	buffer[3] = 0;

	// Bytes 4-7: Resource Type as UInt32
	// "MAPO" = 0x4F50414D in little-endian
	writeUInt32LE(buffer, 4, 0x4f50414d);

	// Bytes 8-11: Resource Version (0)
	writeUInt32LE(buffer, 8, 0);

	// Bytes 12-19: Unique ID (0xdeadbeefdeadbeef)
	writeUInt32LE(buffer, 12, 0xdeadbeef);
	writeUInt32LE(buffer, 16, 0xdeadbeef);

	// Write data count (number of s16 values, not bytes)
	writeUInt32LE(buffer, OTR_HEADER_SIZE, animation.data.length);

	// Write animation data as little-endian s16 values (matching OTR header endianness flag)
	for (let i = 0; i < animation.data.length; i++) {
		writeInt16LE(buffer, OTR_HEADER_SIZE + 4 + i * 2, animation.data[i]);
	}

	return new Blob([buffer], { type: "application/octet-stream" });
}

/**
 * Split a Link animation into header and data blobs for saving
 * Returns both the header blob (MNAO) and data blob (MAPO)
 */
export function splitLinkAnimationToBlobs(
	animation: LinkAnimationEntry,
	dataPathPrefix: string,
): { headerBlob: Blob; dataBlob: Blob; dataPath: string } {
	// Generate data path like "__OTR__misc/link_animation/gPlayerAnimData_..."
	const dataPath = `${dataPathPrefix}/${animation.name}_Data`;

	return {
		headerBlob: animationHeaderToBlob(animation, dataPath),
		dataBlob: linkAnimationDataToBlob(animation),
		dataPath,
	};
}

/**
 * Convert Link animation to binary header format (MNAO file)
 * Note: Actor animations don't use separate header files
 * @deprecated Use splitLinkAnimationToBlobs instead for better control
 */
export function animationHeaderToBlob(
	animation: LinkAnimationEntry,
	dataPath: string,
): Blob {
	const pathBytes = new TextEncoder().encode(`__OTR__${dataPath}`);
	const totalSize = OTR_HEADER_SIZE + 10 + pathBytes.length; // 10 = 4 (version) + 2 (frameCount) + 2 (pathLength) + 2 (padding)
	const buffer = new Uint8Array(totalSize);

	// Write OTR header (first 64 bytes)
	buffer.fill(0, 0, 64);

	// Byte 0: Endianness (0 = little-endian)
	buffer[0] = 0;
	// Byte 1: IsCustom (0 = false)
	buffer[1] = 0;
	// Bytes 2-3: Unused
	buffer[2] = 0;
	buffer[3] = 0;

	// Bytes 4-7: Resource Type as UInt32
	// "MNAO" = 0x4F414E4D in little-endian (matches C++ reader->ReadUInt32())
	writeUInt32LE(buffer, 4, 0x4f414e4d);

	// Bytes 8-11: Resource Version (0)
	writeUInt32LE(buffer, 8, 0);

	// Bytes 12-19: Unique ID (0xdeadbeefdeadbeef)
	writeUInt32LE(buffer, 12, 0xdeadbeef);
	writeUInt32LE(buffer, 16, 0xdeadbeef);

	// Write header data
	const offset = OTR_HEADER_SIZE;
	writeUInt32LE(buffer, offset, 1); // version
	writeUInt16LE(buffer, offset + 4, animation.frameCount);
	writeUInt16LE(buffer, offset + 6, pathBytes.length);
	// 2 bytes of padding/alignment at offset + 8 to offset + 9 (already zeroed)

	// Write path string (after 2-byte padding)
	buffer.set(pathBytes, offset + 10);

	return new Blob([buffer], { type: "application/octet-stream" });
}

/**
 * Create a preview string for an animation
 */
export function generateAnimationPreview(animation: AnimationEntry): string {
	if (animation.type === "link") {
		return `${animation.name} (Link, ${animation.frameCount} frames, ${animation.data.length} values)`;
	} else {
		return `${animation.name} (Actor, ${animation.frameCount} frames, ${animation.frameData.length} values, ${animation.jointIndices.length} joints)`;
	}
}

/**
 * Parse Link animation from header resource and find corresponding data
 */
function parseLinkAnimationFromHeader(
	headerResource: ResourceEntry,
	relatedResources: ResourceEntry[],
): LinkAnimationEntry {
	// Parse the header
	const { frameCount, dataPath } = parseAnimationHeader(headerResource.data);

	// Find the corresponding data file
	// The dataPath is something like "__OTR__misc/link_animation/gPlayerAnimData_1B4B00"
	// We need to find a resource with a matching path
	const dataResource = relatedResources.find((r) => {
		// Remove __OTR__ prefix if present
		const normalizedDataPath = dataPath.replace(/^__OTR__/, "");
		const normalizedResourcePath = r.path.replace(/^__OTR__/, "");
		return normalizedResourcePath === normalizedDataPath;
	});

	if (!dataResource) {
		throw new Error(
			`Could not find data file for Link animation. Expected path: ${dataPath}`,
		);
	}

	// Parse the animation data
	const animData = parseAnimationData(dataResource.data);

	// Extract animation name from header resource path
	const pathParts = headerResource.path.split("/");
	const name = pathParts[pathParts.length - 1].replace(/\.(o2r|otr)$/, "");

	return {
		type: "link",
		name,
		frameCount,
		data: animData,
	};
}

/**
 * Parse animation from binary resource format
 * This works with the OTR resource format used in the o2r files
 * For Type 1 (Link) animations, you need both the header and data resources
 */
export function parseAnimationFromResource(
	resource: ResourceEntry,
	relatedResources?: ResourceEntry[],
): AnimationEntry {
	const data = resource.dataWithoutHeader;
	let offset = 0;

	// Read AnimationType (uint32)
	const animType = readUInt32LE(data, offset);
	offset += 4;

	// Type 1 = Link animations (require both header and data files)
	if (animType === 1) {
		return parseLinkAnimationFromHeader(resource, relatedResources || []);
	}

	// Type 0 = Actor/Normal animations (single file)

	// Read frame count (int16)
	const frameCount = readUInt16LE(data, offset);
	offset += 2;

	// Read rotation values count (uint32)
	const rotValuesCnt = readUInt32LE(data, offset);
	offset += 4;

	// Read rotation values (uint16 array)
	const frameData = new Int16Array(rotValuesCnt);
	for (let i = 0; i < rotValuesCnt; i++) {
		frameData[i] = readUInt16LE(data, offset);
		offset += 2;
	}

	// Read rotation indices count (uint32)
	const rotIndCnt = readUInt32LE(data, offset);
	offset += 4;

	// Read joint indices (3 x uint16 per joint)
	const jointIndices: JointIndex[] = [];
	for (let i = 0; i < rotIndCnt; i++) {
		jointIndices.push({
			x: readUInt16LE(data, offset),
			y: readUInt16LE(data, offset + 2),
			z: readUInt16LE(data, offset + 4),
		});
		offset += 6;
	}

	// Read staticIndexMax (int16)
	const staticIndexMax = readUInt16LE(data, offset);

	// Extract animation name from path
	const pathParts = resource.path.split("/");
	const name = pathParts[pathParts.length - 1].replace(/\.(o2r|otr)$/, "");

	return {
		type: "actor",
		name,
		frameCount,
		frameData,
		jointIndices,
		staticIndexMax,
	};
}

/**
 * Convert animation to binary resource format
 * This creates the binary data that can replace the resource's dataWithoutHeader
 */
export function animationToResourceBinary(
	animation: ActorAnimationEntry,
): Uint8Array {
	// Calculate size
	// AnimationType (4) + frameCount (2) + rotValuesCnt (4) + rotation values (n*2) + rotIndCnt (4) + joint indices (n*6) + staticIndexMax (2)
	const rotValuesSize = animation.frameData.length * 2;
	const jointIndicesSize = animation.jointIndices.length * 6;
	const totalSize = 4 + 2 + 4 + rotValuesSize + 4 + jointIndicesSize + 2;

	const buffer = new Uint8Array(totalSize);
	let offset = 0;

	// Write AnimationType (uint32) - 0 for Normal/Actor animation
	writeUInt32LE(buffer, offset, 0);
	offset += 4;

	// Write frame count (int16 as uint16)
	writeUInt16LE(buffer, offset, animation.frameCount);
	offset += 2;

	// Write rotation values count (uint32)
	writeUInt32LE(buffer, offset, animation.frameData.length);
	offset += 4;

	// Write rotation values (uint16 array)
	for (let i = 0; i < animation.frameData.length; i++) {
		// Store as uint16 (matching game's ReadUInt16)
		writeUInt16LE(buffer, offset, animation.frameData[i] & 0xffff);
		offset += 2;
	}

	// Write rotation indices count (uint32)
	writeUInt32LE(buffer, offset, animation.jointIndices.length);
	offset += 4;

	// Write joint indices (3 x uint16 per joint)
	for (const joint of animation.jointIndices) {
		writeUInt16LE(buffer, offset, joint.x);
		offset += 2;
		writeUInt16LE(buffer, offset, joint.y);
		offset += 2;
		writeUInt16LE(buffer, offset, joint.z);
		offset += 2;
	}

	// Write staticIndexMax (int16 as uint16)
	writeUInt16LE(buffer, offset, animation.staticIndexMax);

	return buffer;
}
