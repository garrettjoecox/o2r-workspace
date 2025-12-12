/**
 * Shared type definitions for the O2R Animation Editor
 */

/**
 * Resource header structure from OTR files
 */
export interface ResourceHeader {
	endianness: number;
	isCustom: boolean;
	resourceType: string;
	resourceVersion: number;
	uniqueId: bigint;
}

/**
 * A resource entry from an O2R archive
 */
export interface ResourceEntry {
	path: string;
	header: ResourceHeader;
	data: Uint8Array; // Full resource data including header
	dataWithoutHeader: Uint8Array; // Data after the 64-byte header
}

/**
 * Joint index structure for animations
 */
export interface JointIndex {
	x: number;
	y: number;
	z: number;
}

/**
 * Link animation entry
 */
export interface LinkAnimationEntry {
	type: "link";
	name: string;
	frameCount: number;
	data: Int16Array;
}

/**
 * Actor animation entry
 */
export interface ActorAnimationEntry {
	type: "actor";
	name: string;
	frameCount: number;
	frameData: Int16Array;
	jointIndices: JointIndex[];
	staticIndexMax: number;
}

/**
 * Union type for animation entries
 */
export type AnimationEntry = LinkAnimationEntry | ActorAnimationEntry;

/**
 * Animation type discriminator
 */
export type AnimationType = "link" | "actor";

/**
 * Animation file structure
 */
export interface AnimationFile {
	header: Uint8Array;
	animations: AnimationEntry[];
}
