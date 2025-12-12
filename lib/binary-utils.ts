/**
 * Binary utility functions for reading and writing various data types
 * in different byte orders (little-endian and big-endian).
 */

/**
 * Read an unsigned 32-bit integer in little-endian format
 * @param data - The byte array to read from
 * @param offset - The offset in the array to start reading
 * @returns The 32-bit unsigned integer value
 */
export function readUInt32LE(data: Uint8Array, offset: number): number {
	return (
		data[offset] |
		(data[offset + 1] << 8) |
		(data[offset + 2] << 16) |
		(data[offset + 3] << 24)
	);
}

/**
 * Read an unsigned 16-bit integer in little-endian format
 * @param data - The byte array to read from
 * @param offset - The offset in the array to start reading
 * @returns The 16-bit unsigned integer value
 */
export function readUInt16LE(data: Uint8Array, offset: number): number {
	return data[offset] | (data[offset + 1] << 8);
}

/**
 * Read an unsigned 64-bit integer in little-endian format as BigInt
 * @param data - The byte array to read from
 * @param offset - The offset in the array to start reading
 * @returns The 64-bit unsigned integer as BigInt
 */
export function readUInt64LE(data: Uint8Array, offset: number): bigint {
	const low = BigInt(readUInt32LE(data, offset));
	const high = BigInt(readUInt32LE(data, offset + 4));
	return (high << BigInt(32)) | low;
}

/**
 * Read a signed 16-bit integer in big-endian format
 * @param data - The byte array to read from
 * @param offset - The offset in the array to start reading
 * @returns The 16-bit signed integer value
 */
export function readInt16BE(data: Uint8Array, offset: number): number {
	const value = (data[offset] << 8) | data[offset + 1];
	return value > 0x7fff ? value - 0x10000 : value;
}

/**
 * Write an unsigned 32-bit integer in little-endian format
 * @param data - The byte array to write to
 * @param offset - The offset in the array to start writing
 * @param value - The value to write
 */
export function writeUInt32LE(
	data: Uint8Array,
	offset: number,
	value: number,
): void {
	data[offset] = value & 0xff;
	data[offset + 1] = (value >> 8) & 0xff;
	data[offset + 2] = (value >> 16) & 0xff;
	data[offset + 3] = (value >> 24) & 0xff;
}

/**
 * Write an unsigned 16-bit integer in little-endian format
 * @param data - The byte array to write to
 * @param offset - The offset in the array to start writing
 * @param value - The value to write
 */
export function writeUInt16LE(
	data: Uint8Array,
	offset: number,
	value: number,
): void {
	data[offset] = value & 0xff;
	data[offset + 1] = (value >> 8) & 0xff;
}

/**
 * Write a signed 16-bit integer in little-endian format
 * @param data - The byte array to write to
 * @param offset - The offset in the array to start writing
 * @param value - The value to write
 */
export function writeInt16LE(
	data: Uint8Array,
	offset: number,
	value: number,
): void {
	const unsigned = value < 0 ? value + 0x10000 : value;
	data[offset] = unsigned & 0xff;
	data[offset + 1] = (unsigned >> 8) & 0xff;
}

/**
 * Convert a 4-byte little-endian value to an ASCII string
 * @param typeValue - The 32-bit value representing the type
 * @returns The ASCII string representation
 */
export function fourCCToString(typeValue: number): string {
	const byte1 = String.fromCharCode((typeValue >> 24) & 0xff);
	const byte2 = String.fromCharCode((typeValue >> 16) & 0xff);
	const byte3 = String.fromCharCode((typeValue >> 8) & 0xff);
	const byte4 = String.fromCharCode((typeValue >> 0) & 0xff);
	return byte1 + byte2 + byte3 + byte4;
}

/**
 * Convert an ASCII string to a 4-byte little-endian value
 * @param str - The ASCII string (must be 4 characters)
 * @returns The 32-bit value
 */
export function stringToFourCC(str: string): number {
	if (str.length !== 4) {
		throw new Error("FourCC string must be exactly 4 characters");
	}
	return (
		(str.charCodeAt(0) << 24) |
		(str.charCodeAt(1) << 16) |
		(str.charCodeAt(2) << 8) |
		str.charCodeAt(3)
	);
}
