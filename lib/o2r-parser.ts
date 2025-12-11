// O2R (OTR Archive) parser for reading Ship of Harkinian resource files

export interface ResourceHeader {
  endianness: number
  isCustom: boolean
  resourceType: string
  resourceVersion: number
  uniqueId: bigint
}

export interface ResourceEntry {
  path: string
  header: ResourceHeader
  data: Uint8Array // Full resource data including header
  dataWithoutHeader: Uint8Array // Data after the 64-byte header
}

const OTR_HEADER_SIZE = 64

/**
 * Read a UInt32 in little-endian format
 */
function readUInt32LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
}

/**
 * Read a UInt64 in little-endian format as BigInt
 */
function readUInt64LE(data: Uint8Array, offset: number): bigint {
  const low = BigInt(readUInt32LE(data, offset))
  const high = BigInt(readUInt32LE(data, offset + 4))
  return (high << BigInt(32)) | low
}

/**
 * Convert resource type bytes to string
 */
function resourceTypeToString(typeValue: number): string {
  // Resource type is stored as a 4-byte value
  // Convert to string representation
  const byte1 = String.fromCharCode((typeValue >> 0) & 0xFF)
  const byte2 = String.fromCharCode((typeValue >> 8) & 0xFF)
  const byte3 = String.fromCharCode((typeValue >> 16) & 0xFF)
  const byte4 = String.fromCharCode((typeValue >> 24) & 0xFF)
  
  const typeStr = byte1 + byte2 + byte3 + byte4
  
  // Map known types to readable names
  const typeMap: Record<string, string> = {
    'MAPO': 'Animation Data (Link)',
    'MNAO': 'Animation Header (Link)',
    'ANIM': 'Animation (Actor)',
    'MSGT': 'Message Table',
    'TEXT': 'Text',
    'BLOB': 'Binary Data',
    'MTEX': 'Texture',
    'VTEX': 'Vertex Texture',
    'SKEL': 'Skeleton',
    'ROOM': 'Room',
    'SCEN': 'Scene',
    'COLL': 'Collision',
    'PATH': 'Path',
    'RLUT': 'Resource LUT',
  }
  
  return typeMap[typeStr] || typeStr
}

/**
 * Parse the OTR header from resource data
 */
export function parseResourceHeader(data: Uint8Array): ResourceHeader {
  if (data.length < OTR_HEADER_SIZE) {
    throw new Error(`Data too small for OTR header (need ${OTR_HEADER_SIZE} bytes, got ${data.length})`)
  }
  
  const endianness = data[0]
  const isCustom = data[1] !== 0
  const resourceType = resourceTypeToString(readUInt32LE(data, 4))
  const resourceVersion = readUInt32LE(data, 8)
  const uniqueId = readUInt64LE(data, 12)
  
  return {
    endianness,
    isCustom,
    resourceType,
    resourceVersion,
    uniqueId,
  }
}

/**
 * Parse an O2R archive file (which is a ZIP file)
 */
export async function parseO2RArchive(file: File): Promise<ResourceEntry[]> {
  // Dynamically import JSZip
  const JSZip = (await import('jszip')).default
  
  const zip = await JSZip.loadAsync(file)
  const resources: ResourceEntry[] = []
  
  // Iterate through all files in the archive
  for (const [path, zipEntry] of Object.entries(zip.files)) {
    // Skip directories
    if (zipEntry.dir) {
      continue
    }
    
    try {
      // Read the file data
      const data = await zipEntry.async('uint8array')
      
      // Skip files that are too small to have a header
      if (data.length < OTR_HEADER_SIZE) {
        console.warn(`Skipping ${path}: too small for OTR header`)
        continue
      }
      
      // Parse the header
      const header = parseResourceHeader(data)
      
      // Extract data without header
      const dataWithoutHeader = data.slice(OTR_HEADER_SIZE)
      
      resources.push({
        path,
        header,
        data,
        dataWithoutHeader,
      })
    } catch (error) {
      console.error(`Error parsing ${path}:`, error)
      // Continue with other files even if one fails
    }
  }
  
  return resources
}

/**
 * Get a preview/description of a resource
 */
export function getResourceDescription(resource: ResourceEntry): string {
  const size = (resource.data.length / 1024).toFixed(2)
  return `${resource.header.resourceType} (${size} KB)`
}

/**
 * Format resource data as hex string for display
 */
export function formatHexData(data: Uint8Array, bytesPerLine: number = 16): string {
  const lines: string[] = []
  
  for (let i = 0; i < data.length; i += bytesPerLine) {
    const offset = i.toString(16).padStart(8, '0')
    const bytes: string[] = []
    const ascii: string[] = []
    
    for (let j = 0; j < bytesPerLine; j++) {
      if (i + j < data.length) {
        const byte = data[i + j]
        bytes.push(byte.toString(16).padStart(2, '0'))
        // Display printable ASCII characters, otherwise use '.'
        ascii.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.')
      } else {
        bytes.push('  ')
        ascii.push(' ')
      }
    }
    
    // Group bytes in chunks of 8 for readability
    const hexPart1 = bytes.slice(0, 8).join(' ')
    const hexPart2 = bytes.slice(8, 16).join(' ')
    const hexPart = `${hexPart1}  ${hexPart2}`
    
    lines.push(`${offset}  ${hexPart}  |${ascii.join('')}|`)
  }
  
  return lines.join('\n')
}
