// Control code definitions based on game source
export const CONTROL_CODES = {
	NEWLINE: 0x01,
	END: 0x02,
	BOX_BREAK: 0x04,
	COLOR: 0x05,
	SHIFT: 0x06,
	TEXTID: 0x07,
	QUICKTEXT_ENABLE: 0x08,
	QUICKTEXT_DISABLE: 0x09,
	PERSISTENT: 0x0a,
	EVENT: 0x0b,
	BOX_BREAK_DELAYED: 0x0c,
	AWAIT_BUTTON_PRESS: 0x0d,
	FADE: 0x0e,
	NAME: 0x0f,
	OCARINA: 0x10,
	FADE2: 0x11,
	SFX: 0x12,
	ITEM_ICON: 0x13,
	TEXT_SPEED: 0x14,
	BACKGROUND: 0x15,
	MARATHON_TIME: 0x16,
	RACE_TIME: 0x17,
	POINTS: 0x18,
	TOKENS: 0x19,
	UNSKIPPABLE: 0x1a,
	TWO_CHOICE: 0x1b,
	THREE_CHOICE: 0x1c,
	FISH_INFO: 0x1d,
	HIGHSCORE: 0x1e,
	TIME: 0x1f,
} as const;

export const CONTROL_CODE_NAMES: Record<number, string> = {
	[CONTROL_CODES.NEWLINE]: "NEWLINE",
	[CONTROL_CODES.END]: "END",
	[CONTROL_CODES.BOX_BREAK]: "BOX_BREAK",
	[CONTROL_CODES.COLOR]: "COLOR",
	[CONTROL_CODES.SHIFT]: "SHIFT",
	[CONTROL_CODES.TEXTID]: "TEXTID",
	[CONTROL_CODES.QUICKTEXT_ENABLE]: "QUICKTEXT_ENABLE",
	[CONTROL_CODES.QUICKTEXT_DISABLE]: "QUICKTEXT_DISABLE",
	[CONTROL_CODES.PERSISTENT]: "PERSISTENT",
	[CONTROL_CODES.EVENT]: "EVENT",
	[CONTROL_CODES.BOX_BREAK_DELAYED]: "BOX_BREAK_DELAYED",
	[CONTROL_CODES.AWAIT_BUTTON_PRESS]: "AWAIT_BUTTON_PRESS",
	[CONTROL_CODES.FADE]: "FADE",
	[CONTROL_CODES.NAME]: "NAME",
	[CONTROL_CODES.OCARINA]: "OCARINA",
	[CONTROL_CODES.FADE2]: "FADE2",
	[CONTROL_CODES.SFX]: "SFX",
	[CONTROL_CODES.ITEM_ICON]: "ITEM_ICON",
	[CONTROL_CODES.TEXT_SPEED]: "TEXT_SPEED",
	[CONTROL_CODES.BACKGROUND]: "BACKGROUND",
	[CONTROL_CODES.MARATHON_TIME]: "MARATHON_TIME",
	[CONTROL_CODES.RACE_TIME]: "RACE_TIME",
	[CONTROL_CODES.POINTS]: "POINTS",
	[CONTROL_CODES.TOKENS]: "TOKENS",
	[CONTROL_CODES.UNSKIPPABLE]: "UNSKIPPABLE",
	[CONTROL_CODES.TWO_CHOICE]: "TWO_CHOICE",
	[CONTROL_CODES.THREE_CHOICE]: "THREE_CHOICE",
	[CONTROL_CODES.FISH_INFO]: "FISH_INFO",
	[CONTROL_CODES.HIGHSCORE]: "HIGHSCORE",
	[CONTROL_CODES.TIME]: "TIME",
};

// Determine extra bytes needed for each control code
// Updated to match the C++ implementation
function getExtraBytes(code: number): number {
	// End marker - read 2 extra bytes for the text ID when it's TEXTID (0x07)
	if (code === 0x07) {
		return 2;
	}
	// 2-byte control codes
	else if (code === 0x12 || code === 0x11) {
		return 2;
	}
	// 3-byte control codes
	else if (code === 0x15) {
		return 3;
	}
	// 1-byte control codes
	else if (
		code === 0x05 ||
		code === 0x13 ||
		code === 0x0e ||
		code === 0x0c ||
		code === 0x1e ||
		code === 0x06 ||
		code === 0x14
	) {
		return 1;
	}
	return 0;
}

export interface MessageEntry {
	id: number;
	textboxType: number;
	textboxYPos: number;
	data: Uint8Array;
	preview: string;
}

export interface MessageFile {
	header: Uint8Array; // 64-byte header with TXTO magic and message count at offset 64
	messages: MessageEntry[];
}

function readUInt32LE(data: Uint8Array, offset: number): number {
	return (
		data[offset] |
		(data[offset + 1] << 8) |
		(data[offset + 2] << 16) |
		(data[offset + 3] << 24)
	);
}

function readUInt16LE(data: Uint8Array, offset: number): number {
	return data[offset] | (data[offset + 1] << 8);
}

export function parseMessages(rawData: Uint8Array): MessageEntry[] {
	const messages: MessageEntry[] = [];

	// Read header - 64 bytes header, then message count at offset 64
	if (rawData.length < 68) {
		// 64 byte header + 4 byte message count
		return messages;
	}

	const msgCount = readUInt32LE(rawData, 64);
	let offset = 68; // Start after header + message count

	for (let i = 0; i < msgCount; i++) {
		if (offset + 4 > rawData.length) {
			break;
		}

		// Read message entry header
		const id = readUInt16LE(rawData, offset);
		const textboxType = rawData[offset + 2];
		const textboxYPos = rawData[offset + 3];
		offset += 4;

		// Read string with length prefix (int32)
		if (offset + 4 > rawData.length) {
			break;
		}

		const stringLength = readUInt32LE(rawData, offset);
		offset += 4;

		if (offset + stringLength > rawData.length) {
			break;
		}

		const msgData = rawData.slice(offset, offset + stringLength);
		offset += stringLength;

		if (msgData.length > 0) {
			const preview = generatePreview(msgData);

			messages.push({
				id,
				textboxType,
				textboxYPos,
				data: msgData,
				preview,
			});
		}
	}

	return messages;
}

function generatePreview(data: Uint8Array): string {
	let preview = "";
	let i = 0;

	while (i < data.length && preview.length < 80) {
		const byte = data[i];

		if (byte < 0x20) {
			// Control code - skip it and its extra bytes
			const extra = getExtraBytes(byte);
			i += extra;
		} else if (byte >= 0x20 && byte < 0x7f) {
			// Printable ASCII
			preview += String.fromCharCode(byte);
		} else {
			// Other bytes as hex
			preview += `\\x${byte.toString(16).toUpperCase().padStart(2, "0")}`;
		}

		i++;
	}

	if (i < data.length) {
		preview += "...";
	}

	return preview;
}

export function messageToBlob(message: MessageEntry): Blob {
	// Create a new Uint8Array to avoid type issues
	const data = new Uint8Array(message.data);
	return new Blob([data], { type: "application/octet-stream" });
}

export function messagesToBlob(messages: MessageEntry[]): Blob {
	// Calculate total size needed
	let totalSize = 64 + 4; // 64-byte header + 4-byte message count

	for (const msg of messages) {
		totalSize += 4; // id (2) + textboxType (1) + textboxYPos (1)
		totalSize += 4; // string length prefix
		totalSize += msg.data.length; // message data
	}

	const buffer = new Uint8Array(totalSize);
	let offset = 0;

	// Write 64-byte header
	// Bytes 0-3: Version/flags (0x00000000)
	buffer[offset++] = 0x00;
	buffer[offset++] = 0x00;
	buffer[offset++] = 0x00;
	buffer[offset++] = 0x00;

	// Bytes 4-7: TXTO magic number
	buffer[offset++] = 0x54; // 'T'
	buffer[offset++] = 0x58; // 'X'
	buffer[offset++] = 0x54; // 'T'
	buffer[offset++] = 0x4f; // 'O'

	// Bytes 8-11: Unknown (0x00000000)
	buffer[offset++] = 0x00;
	buffer[offset++] = 0x00;
	buffer[offset++] = 0x00;
	buffer[offset++] = 0x00;

	// Bytes 12-15: 0xDEADBEEF
	buffer[offset++] = 0xef;
	buffer[offset++] = 0xbe;
	buffer[offset++] = 0xad;
	buffer[offset++] = 0xde;

	// Bytes 16-19: 0xDEADBEEF
	buffer[offset++] = 0xef;
	buffer[offset++] = 0xbe;
	buffer[offset++] = 0xad;
	buffer[offset++] = 0xde;

	// Bytes 20-63: Zeros (padding)
	for (let i = 20; i < 64; i++) {
		buffer[offset++] = 0x00;
	}

	// Write message count at offset 64 as uint32 little-endian
	const msgCount = messages.length;
	buffer[offset++] = msgCount & 0xff;
	buffer[offset++] = (msgCount >> 8) & 0xff;
	buffer[offset++] = (msgCount >> 16) & 0xff;
	buffer[offset++] = (msgCount >> 24) & 0xff;

	// Write each message entry
	for (const msg of messages) {
		// Write id as uint16 little-endian
		buffer[offset++] = msg.id & 0xff;
		buffer[offset++] = (msg.id >> 8) & 0xff;

		// Write textboxType and textboxYPos
		buffer[offset++] = msg.textboxType;
		buffer[offset++] = msg.textboxYPos;

		// Write string length as uint32 little-endian
		const strLen = msg.data.length;
		buffer[offset++] = strLen & 0xff;
		buffer[offset++] = (strLen >> 8) & 0xff;
		buffer[offset++] = (strLen >> 16) & 0xff;
		buffer[offset++] = (strLen >> 24) & 0xff;

		// Write message data
		buffer.set(msg.data, offset);
		offset += msg.data.length;
	}

	return new Blob([buffer], { type: "application/octet-stream" });
}

export function parseMessageData(
	data: Uint8Array,
): Array<{ type: "text" | "control"; value: string; bytes: number[] }> {
	const result: Array<{
		type: "text" | "control";
		value: string;
		bytes: number[];
	}> = [];
	let i = 0;

	while (i < data.length) {
		const byte = data[i];

		if (byte < 0x20) {
			// Control code
			const name =
				CONTROL_CODE_NAMES[byte] ||
				`CTRL_${byte.toString(16).toUpperCase().padStart(2, "0")}`;
			const extra = getExtraBytes(byte);
			const bytes = [byte];

			for (let j = 1; j <= extra; j++) {
				if (i + j < data.length) {
					bytes.push(data[i + j]);
				}
			}

			result.push({
				type: "control",
				value: name,
				bytes,
			});

			i += 1 + extra;
		} else {
			// Text character
			let text = "";
			const bytes: number[] = [];

			while (i < data.length && data[i] >= 0x20) {
				bytes.push(data[i]);
				if (data[i] < 0x7f) {
					text += String.fromCharCode(data[i]);
				} else {
					text += `\\x${data[i].toString(16).toUpperCase().padStart(2, "0")}`;
				}
				i++;
			}

			result.push({
				type: "text",
				value: text,
				bytes,
			});
		}
	}

	return result;
}

// Convert message data to editable text format with control codes as [NAME(args)]
export function messageDataToEditableText(data: Uint8Array): string {
	const parsed = parseMessageData(data);
	let result = "";

	for (const item of parsed) {
		if (item.type === "control") {
			// Format control codes with their byte values
			if (item.bytes.length > 1) {
				const args = item.bytes
					.slice(1)
					.map((b) => `0x${b.toString(16).toUpperCase().padStart(2, "0")}`)
					.join(", ");
				result += `[${item.value}(${args})]`;
			} else {
				result += `[${item.value}]`;
			}
		} else {
			result += item.value;
		}
	}

	return result;
}

// Convert editable text back to binary data
export function editableTextToMessageData(text: string): Uint8Array {
	const bytes: number[] = [];
	let i = 0;

	while (i < text.length) {
		if (text[i] === "[") {
			// Parse control code
			const endBracket = text.indexOf("]", i);
			if (endBracket === -1) {
				// Malformed - treat as literal text
				bytes.push(text.charCodeAt(i));
				i++;
				continue;
			}

			const codeStr = text.substring(i + 1, endBracket);
			const parenIndex = codeStr.indexOf("(");
			const codeName =
				parenIndex !== -1 ? codeStr.substring(0, parenIndex) : codeStr;

			// Find the control code byte
			let codeValue: number | undefined;
			for (const [byte, name] of Object.entries(CONTROL_CODE_NAMES)) {
				if (name === codeName) {
					codeValue = parseInt(byte);
					break;
				}
			}

			if (codeValue === undefined) {
				// Unknown control code - skip it or treat as text
				i = endBracket + 1;
				continue;
			}

			bytes.push(codeValue);

			// Parse arguments if present
			if (parenIndex !== -1) {
				const argsStr = codeStr.substring(parenIndex + 1, codeStr.length - 1);
				const args = argsStr.split(",").map((arg) => {
					const trimmed = arg.trim();
					if (trimmed.startsWith("0x")) {
						return parseInt(trimmed.substring(2), 16);
					}
					return parseInt(trimmed, 10);
				});

				for (const arg of args) {
					if (!isNaN(arg)) {
						bytes.push(arg);
					}
				}
			}

			i = endBracket + 1;
		} else if (text[i] === "\\" && i + 1 < text.length && text[i + 1] === "x") {
			// Parse hex escape \xNN
			if (i + 3 < text.length) {
				const hexStr = text.substring(i + 2, i + 4);
				const value = parseInt(hexStr, 16);
				if (!isNaN(value)) {
					bytes.push(value);
					i += 4;
					continue;
				}
			}
			bytes.push(text.charCodeAt(i));
			i++;
		} else {
			// Regular ASCII character
			bytes.push(text.charCodeAt(i));
			i++;
		}
	}

	return new Uint8Array(bytes);
}

// Helper to insert a control code at cursor position
export function insertControlCode(
	text: string,
	cursorPosition: number,
	code: number,
	name: string,
	args: number[] = [],
): { newText: string; newCursorPosition: number } {
	const codeStr =
		args.length > 0
			? `[${name}(${args.map((a) => `0x${a.toString(16).toUpperCase().padStart(2, "0")}`).join(", ")})]`
			: `[${name}]`;

	const newText =
		text.substring(0, cursorPosition) +
		codeStr +
		text.substring(cursorPosition);
	const newCursorPosition = cursorPosition + codeStr.length;

	return { newText, newCursorPosition };
}
