// Animation parser for Ocarina of Time / Majora's Mask Link animations

export interface AnimationEntry {
  name: string
  frameCount: number
  data: Int16Array
}

export interface AnimationFile {
  header: Uint8Array
  animations: AnimationEntry[]
}

// OTR Header constants
const OTR_HEADER_SIZE = 64
const MNAO_MAGIC = "MNAO" // Animation header file magic
const MAPO_MAGIC = "MAPO" // Animation data file magic

function readUInt32LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
}

function readUInt16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8)
}

function writeUInt32LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff
  data[offset + 1] = (value >> 8) & 0xff
  data[offset + 2] = (value >> 16) & 0xff
  data[offset + 3] = (value >> 24) & 0xff
}

function writeUInt16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff
  data[offset + 1] = (value >> 8) & 0xff
}

function writeInt16LE(data: Uint8Array, offset: number, value: number): void {
  const unsigned = value < 0 ? value + 0x10000 : value
  data[offset] = unsigned & 0xff
  data[offset + 1] = (unsigned >> 8) & 0xff
}

function readInt16BE(data: Uint8Array, offset: number): number {
  const value = (data[offset] << 8) | data[offset + 1]
  return value > 0x7fff ? value - 0x10000 : value
}

function writeInt16BE(data: Uint8Array, offset: number, value: number): void {
  const unsigned = value < 0 ? value + 0x10000 : value
  data[offset] = (unsigned >> 8) & 0xff
  data[offset + 1] = unsigned & 0xff
}

/**
 * Parse animation data from binary format (MAPO file)
 */
export function parseAnimationData(rawData: Uint8Array): Int16Array {
  if (rawData.length < OTR_HEADER_SIZE + 8) {
    throw new Error("File too small to be valid animation data")
  }

  // Verify MAPO magic
  const magic = String.fromCharCode(...rawData.slice(8, 12))
  if (magic !== MAPO_MAGIC) {
    throw new Error(`Invalid animation data file (expected ${MAPO_MAGIC}, got ${magic})`)
  }

  // Animation data starts after 64-byte header
  const dataStart = OTR_HEADER_SIZE
  const numValues = readUInt32LE(rawData, dataStart) // Number of s16 values
  
  // Read s16 array data (big-endian)
  const animData = new Int16Array(numValues)
  
  for (let i = 0; i < numValues; i++) {
    animData[i] = readInt16BE(rawData, dataStart + 4 + i * 2)
  }
  
  return animData
}

/**
 * Parse animation header from binary format (MNAO file)
 */
export function parseAnimationHeader(rawData: Uint8Array): { frameCount: number; dataPath: string } {
  if (rawData.length < OTR_HEADER_SIZE + 8) {
    throw new Error("File too small to be valid animation header")
  }

  // Verify MNAO magic
  const magic = String.fromCharCode(...rawData.slice(8, 12))
  if (magic !== MNAO_MAGIC) {
    throw new Error(`Invalid animation header file (expected ${MNAO_MAGIC}, got ${magic})`)
  }

  // Read header data
  const offset = OTR_HEADER_SIZE
  const version = readUInt32LE(rawData, offset)
  const frameCount = readUInt16LE(rawData, offset + 4)
  const pathLength = readUInt16LE(rawData, offset + 6)
  // 2 bytes of padding/alignment at offset + 8 to offset + 9
  
  // Read path string (after 2-byte padding)
  const pathStart = offset + 10
  const pathData = rawData.slice(pathStart, pathStart + pathLength)
  const dataPath = new TextDecoder().decode(pathData)
  
  return { frameCount, dataPath }
}

/**
 * Parse animation from C source code format
 */
export function parseAnimationFromC(cSource: string): AnimationEntry {
  // Extract array name and data
  const arrayMatch = cSource.match(/s16\s+(\w+)\s*\[\s*\]\s*=\s*\{([^}]+)\}/)
  if (!arrayMatch) {
    throw new Error("Invalid C source format - could not find s16 array declaration")
  }

  const dataArrayName = arrayMatch[1]
  const dataContent = arrayMatch[2]

  // Extract header info
  const headerMatch = cSource.match(/LinkAnimationHeader\s+(\w+)\s*=\s*\{\s*\{\s*(\d+)\s*\}/)
  if (!headerMatch) {
    throw new Error("Invalid C source format - could not find LinkAnimationHeader declaration")
  }

  const animName = headerMatch[1]
  const frameCount = parseInt(headerMatch[2], 10)

  // Parse hex values from the data array
  const hexValues = dataContent.match(/(?:0x[0-9A-Fa-f]+|-0x[0-9A-Fa-f]+)/g)
  if (!hexValues) {
    throw new Error("Invalid C source format - could not find hex values")
  }

  const data = new Int16Array(hexValues.length)
  for (let i = 0; i < hexValues.length; i++) {
    data[i] = parseInt(hexValues[i], 16)
  }

  return {
    name: animName,
    frameCount,
    data,
  }
}

/**
 * Convert animation to C source code format
 */
export function animationToC(animation: AnimationEntry): string {
  const dataArrayName = animation.name.replace(/^gPlayerAnim_/, "gPlayerAnim_") + "_Data"
  
  let cSource = `s16 ${dataArrayName}[] = {\n`
  
  // Format data as hex values, 8 per line
  for (let i = 0; i < animation.data.length; i++) {
    if (i % 8 === 0) {
      cSource += "    "
    }
    
    const value = animation.data[i]
    const hexStr = value < 0 ? `-0x${(-value).toString(16).toUpperCase().padStart(4, "0")}` : `0x${value.toString(16).toUpperCase().padStart(4, "0")}`
    cSource += hexStr
    
    if (i < animation.data.length - 1) {
      cSource += ", "
    }
    
    if (i % 8 === 7 && i < animation.data.length - 1) {
      cSource += "\n"
    }
  }
  
  cSource += "\n};\n\n"
  cSource += `LinkAnimationHeader ${animation.name} = { \n`
  cSource += `    { ${animation.frameCount} }, ${dataArrayName}\n`
  cSource += "};\n"
  
  return cSource
}

/**
 * Convert animation data to binary format (MAPO file)
 */
export function animationDataToBlob(animation: AnimationEntry, dataFileName: string): Blob {
  const dataSize = animation.data.length * 2
  const totalSize = OTR_HEADER_SIZE + 4 + dataSize
  const buffer = new Uint8Array(totalSize)
  
  // Write OTR header (first 64 bytes)
  buffer.fill(0, 0, 64)
  
  // Byte 0: Endianness (0 = little-endian)
  buffer[0] = 0
  // Byte 1: IsCustom (0 = false)
  buffer[1] = 0
  // Bytes 2-3: Unused
  buffer[2] = 0
  buffer[3] = 0
  
  // Bytes 4-7: Resource Type as UInt32
  // "MAPO" = 0x4F50414D in little-endian (matches C++ reader->ReadUInt32())
  writeUInt32LE(buffer, 4, 0x4F50414D)
  
  // Bytes 8-11: Resource Version (0)
  writeUInt32LE(buffer, 8, 0)
  
  // Bytes 12-19: Unique ID (0xdeadbeefdeadbeef)
  writeUInt32LE(buffer, 12, 0xdeadbeef)
  writeUInt32LE(buffer, 16, 0xdeadbeef)
  
  // Write data count (number of s16 values, not bytes)
  writeUInt32LE(buffer, OTR_HEADER_SIZE, animation.data.length)
  
  // Write animation data as little-endian s16 values
  for (let i = 0; i < animation.data.length; i++) {
    writeInt16LE(buffer, OTR_HEADER_SIZE + 4 + i * 2, animation.data[i])
  }
  
  return new Blob([buffer], { type: "application/octet-stream" })
}

/**
 * Convert animation to binary header format (MNAO file)
 */
export function animationHeaderToBlob(animation: AnimationEntry, dataPath: string): Blob {
  const pathBytes = new TextEncoder().encode(dataPath)
  const totalSize = OTR_HEADER_SIZE + 10 + pathBytes.length // 10 = 4 (version) + 2 (frameCount) + 2 (pathLength) + 2 (padding)
  const buffer = new Uint8Array(totalSize)
  
  // Write OTR header (first 64 bytes)
  buffer.fill(0, 0, 64)
  
  // Byte 0: Endianness (0 = little-endian)
  buffer[0] = 0
  // Byte 1: IsCustom (0 = false)
  buffer[1] = 0
  // Bytes 2-3: Unused
  buffer[2] = 0
  buffer[3] = 0
  
  // Bytes 4-7: Resource Type as UInt32
  // "MNAO" = 0x4F414E4D in little-endian (matches C++ reader->ReadUInt32())
  writeUInt32LE(buffer, 4, 0x4F414E4D)
  
  // Bytes 8-11: Resource Version (0)
  writeUInt32LE(buffer, 8, 0)
  
  // Bytes 12-19: Unique ID (0xdeadbeefdeadbeef)
  writeUInt32LE(buffer, 12, 0xdeadbeef)
  writeUInt32LE(buffer, 16, 0xdeadbeef)
  
  // Write header data
  const offset = OTR_HEADER_SIZE
  writeUInt32LE(buffer, offset, 1) // version
  writeUInt16LE(buffer, offset + 4, animation.frameCount)
  writeUInt16LE(buffer, offset + 6, pathBytes.length)
  // 2 bytes of padding/alignment at offset + 8 to offset + 9 (already zeroed)
  
  // Write path string (after 2-byte padding)
  buffer.set(pathBytes, offset + 10)
  
  return new Blob([buffer], { type: "application/octet-stream" })
}

/**
 * Create a preview string for an animation
 */
export function generateAnimationPreview(animation: AnimationEntry): string {
  return `${animation.name} (${animation.frameCount} frames, ${animation.data.length} values)`
}
