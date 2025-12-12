/**
 * Binary format constants for O2R file parsing
 */

/**
 * Size of the OTR resource header in bytes
 */
export const OTR_HEADER_SIZE = 64;

/**
 * Magic numbers for different file types
 */
export const MAGIC_NUMBERS = {
	/** Animation header file magic */
	MNAO: "MNAO",
	/** Animation data file magic */
	MAPO: "MAPO",
	/** Texture file magic */
	TXTO: "TXTO",
	/** Message/Text file magic */
	OTXT: "OTXT",
} as const;

/**
 * Resource type mapping from FourCC to readable names
 */
export const RESOURCE_TYPE_MAP: Record<string, string> = {
	OARR: "Array",
	OANM: "Animation",
	OPAM: "Player Animation",
	OROM: "Room",
	OCOL: "Collision Header",
	OSKL: "Skeleton",
	OSLB: "Skeleton Limb",
	OPTH: "Path",
	OCUT: "Cutscene",
	OTXT: "Text",
	OAUD: "Audio",
	OSMP: "Audio Sample",
	OSFT: "Audio SoundFont",
	OSEQ: "Audio Sequence",
	OBGI: "Background",
	ORCM: "Scene Command",
	ODLT: "Display List",
	LGTS: "Light",
	OMTX: "Matrix",
	OTEX: "Texture",
	OVTX: "Vertex",
};
