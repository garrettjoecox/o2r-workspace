"use client";

import { useEffect, useRef, useState } from "react";
import type { ResourceEntry } from "@/lib/types";
import { Alert, AlertDescription } from "./ui/alert";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

interface ImageViewerProps {
	resource: ResourceEntry;
	availableTextures?: ResourceEntry[];
}

export enum TextureType {
	Error = 0,
	RGBA32bpp = 1,
	RGBA16bpp = 2,
	Palette4bpp = 3,
	Palette8bpp = 4,
	Grayscale4bpp = 5,
	Grayscale8bpp = 6,
	GrayscaleAlpha4bpp = 7,
	GrayscaleAlpha8bpp = 8,
	GrayscaleAlpha16bpp = 9,
}

interface TextureData {
	textureType: TextureType;
	width: number;
	height: number;
	dataSize: number;
	pixelData: Uint8Array;
}

export function parseTextureData(data: Uint8Array): TextureData | null {
	if (data.length < 16) {
		return null;
	}

	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	let offset = 0;

	const textureType = view.getUint32(offset, true);
	offset += 4;
	const width = view.getUint32(offset, true);
	offset += 4;
	const height = view.getUint32(offset, true);
	offset += 4;
	const dataSize = view.getUint32(offset, true);
	offset += 4;

	const pixelData = new Uint8Array(
		data.buffer,
		data.byteOffset + offset,
		dataSize,
	);

	return {
		textureType,
		width,
		height,
		dataSize,
		pixelData,
	};
}

function decodeTexture(
	textureData: TextureData,
	paletteData?: TextureData,
): ImageData | null {
	const { textureType, width, height, pixelData } = textureData;
	const imageData = new ImageData(width, height);
	const pixels = imageData.data;

	try {
		switch (textureType) {
			case TextureType.RGBA32bpp: {
				// 4 bytes per pixel (RGBA)
				if (pixelData.length < width * height * 4) {
					throw new Error("Insufficient data for RGBA32bpp");
				}
				for (let i = 0; i < pixels.length; i++) {
					pixels[i] = pixelData[i];
				}
				break;
			}

			case TextureType.RGBA16bpp: {
				// 2 bytes per pixel (RGB5A1)
				// Format: RRRRR GGGGG BBBBB A (5-5-5-1 bits), big-endian
				if (pixelData.length < width * height * 2) {
					throw new Error("Insufficient data for RGBA16bpp");
				}
				for (let i = 0; i < width * height; i++) {
					const byte1 = pixelData[i * 2]; // High byte
					const byte2 = pixelData[i * 2 + 1]; // Low byte
					const pixel16 = (byte1 << 8) | byte2; // Big-endian

					// RGB5A1 format
					const r = (((pixel16 >> 11) & 0x1f) * 255) / 31; // Scale 5-bit to 8-bit
					const g = (((pixel16 >> 6) & 0x1f) * 255) / 31;
					const b = (((pixel16 >> 1) & 0x1f) * 255) / 31;
					const a = (pixel16 & 0x1) * 255; // 1-bit alpha: 0 or 255

					pixels[i * 4] = r;
					pixels[i * 4 + 1] = g;
					pixels[i * 4 + 2] = b;
					pixels[i * 4 + 3] = a;
				}
				break;
			}

			case TextureType.Grayscale8bpp: {
				// 1 byte per pixel (grayscale)
				if (pixelData.length < width * height) {
					throw new Error("Insufficient data for Grayscale8bpp");
				}
				for (let i = 0; i < width * height; i++) {
					const gray = pixelData[i];
					pixels[i * 4] = gray;
					pixels[i * 4 + 1] = gray;
					pixels[i * 4 + 2] = gray;
					pixels[i * 4 + 3] = 255;
				}
				break;
			}

			case TextureType.GrayscaleAlpha8bpp: {
				// 1 byte per pixel (4 bits gray, 4 bits alpha)
				if (pixelData.length < width * height) {
					throw new Error("Insufficient data for GrayscaleAlpha8bpp");
				}
				for (let i = 0; i < width * height; i++) {
					const byte = pixelData[i];
					const gray = ((byte >> 4) & 0xf) * 17; // Scale 4-bit to 8-bit
					const alpha = (byte & 0xf) * 17;
					pixels[i * 4] = gray;
					pixels[i * 4 + 1] = gray;
					pixels[i * 4 + 2] = gray;
					pixels[i * 4 + 3] = alpha;
				}
				break;
			}

			case TextureType.GrayscaleAlpha16bpp: {
				// 2 bytes per pixel (8 bits gray, 8 bits alpha)
				if (pixelData.length < width * height * 2) {
					throw new Error("Insufficient data for GrayscaleAlpha16bpp");
				}
				for (let i = 0; i < width * height; i++) {
					const gray = pixelData[i * 2];
					const alpha = pixelData[i * 2 + 1];
					pixels[i * 4] = gray;
					pixels[i * 4 + 1] = gray;
					pixels[i * 4 + 2] = gray;
					pixels[i * 4 + 3] = alpha;
				}
				break;
			}

			case TextureType.Grayscale4bpp: {
				// 4 bits per pixel (2 pixels per byte)
				if (pixelData.length < Math.ceil((width * height) / 2)) {
					throw new Error("Insufficient data for Grayscale4bpp");
				}
				for (let i = 0; i < width * height; i++) {
					const byteIndex = Math.floor(i / 2);
					const byte = pixelData[byteIndex];
					const gray = (i % 2 === 0 ? byte >> 4 : byte & 0xf) * 17; // Scale 4-bit to 8-bit
					pixels[i * 4] = gray;
					pixels[i * 4 + 1] = gray;
					pixels[i * 4 + 2] = gray;
					pixels[i * 4 + 3] = 255;
				}
				break;
			}

			case TextureType.GrayscaleAlpha4bpp: {
				// 4 bits per pixel (2 bits gray, 2 bits alpha)
				if (pixelData.length < Math.ceil((width * height) / 2)) {
					throw new Error("Insufficient data for GrayscaleAlpha4bpp");
				}
				for (let i = 0; i < width * height; i++) {
					const byteIndex = Math.floor(i / 2);
					const byte = pixelData[byteIndex];
					const nibble = i % 2 === 0 ? byte >> 4 : byte & 0xf;
					const gray = ((nibble >> 2) & 0x3) * 85; // Scale 2-bit to 8-bit
					const alpha = (nibble & 0x3) * 85;
					pixels[i * 4] = gray;
					pixels[i * 4 + 1] = gray;
					pixels[i * 4 + 2] = gray;
					pixels[i * 4 + 3] = alpha;
				}
				break;
			}

			case TextureType.Palette4bpp: {
				// 4 bits per pixel (2 pixels per byte) - palette indices
				if (!paletteData) {
					return null; // Need palette
				}
				if (pixelData.length < Math.ceil((width * height) / 2)) {
					throw new Error("Insufficient data for Palette4bpp");
				}

				// Extract palette colors (assuming RGBA32bpp palette)
				const paletteColors: number[] = [];
				if (paletteData.textureType === TextureType.RGBA32bpp) {
					for (
						let i = 0;
						i < Math.min(256, paletteData.pixelData.length / 4);
						i++
					) {
						paletteColors.push(
							paletteData.pixelData[i * 4], // R
							paletteData.pixelData[i * 4 + 1], // G
							paletteData.pixelData[i * 4 + 2], // B
							paletteData.pixelData[i * 4 + 3], // A
						);
					}
				} else if (paletteData.textureType === TextureType.RGBA16bpp) {
					// Handle RGBA16bpp palette (RGB5A1 format)
					for (
						let i = 0;
						i < Math.min(256, paletteData.pixelData.length / 2);
						i++
					) {
						const byte1 = paletteData.pixelData[i * 2]; // High byte
						const byte2 = paletteData.pixelData[i * 2 + 1]; // Low byte
						const pixel16 = (byte1 << 8) | byte2; // Big-endian

						// RGB5A1 format
						const r = (((pixel16 >> 11) & 0x1f) * 255) / 31; // Scale 5-bit to 8-bit
						const g = (((pixel16 >> 6) & 0x1f) * 255) / 31;
						const b = (((pixel16 >> 1) & 0x1f) * 255) / 31;
						const a = (pixel16 & 0x1) * 255; // 1-bit alpha: 0 or 255

						paletteColors.push(r, g, b, a);
					}
				} else {
					throw new Error("Unsupported palette format");
				}

				for (let i = 0; i < width * height; i++) {
					const byteIndex = Math.floor(i / 2);
					const byte = pixelData[byteIndex];
					const paletteIndex = i % 2 === 0 ? byte >> 4 : byte & 0xf;
					const colorIndex = paletteIndex * 4;

					if (colorIndex < paletteColors.length) {
						pixels[i * 4] = paletteColors[colorIndex];
						pixels[i * 4 + 1] = paletteColors[colorIndex + 1];
						pixels[i * 4 + 2] = paletteColors[colorIndex + 2];
						pixels[i * 4 + 3] = paletteColors[colorIndex + 3];
					} else {
						// Default to magenta for missing palette entries
						pixels[i * 4] = 255;
						pixels[i * 4 + 1] = 0;
						pixels[i * 4 + 2] = 255;
						pixels[i * 4 + 3] = 255;
					}
				}
				break;
			}

			case TextureType.Palette8bpp: {
				// 8 bits per pixel - palette indices
				if (!paletteData) {
					console.log("failed");

					return null; // Need palette
				}
				if (pixelData.length < width * height) {
					throw new Error("Insufficient data for Palette8bpp");
				}

				// Extract palette colors (assuming RGBA32bpp palette)
				const paletteColors: number[] = [];
				if (paletteData.textureType === TextureType.RGBA32bpp) {
					for (
						let i = 0;
						i < Math.min(256, paletteData.pixelData.length / 4);
						i++
					) {
						paletteColors.push(
							paletteData.pixelData[i * 4], // R
							paletteData.pixelData[i * 4 + 1], // G
							paletteData.pixelData[i * 4 + 2], // B
							paletteData.pixelData[i * 4 + 3], // A
						);
					}
				} else if (paletteData.textureType === TextureType.RGBA16bpp) {
					// Handle RGBA16bpp palette (RGB5A1 format)
					for (
						let i = 0;
						i < Math.min(256, paletteData.pixelData.length / 2);
						i++
					) {
						const byte1 = paletteData.pixelData[i * 2]; // High byte
						const byte2 = paletteData.pixelData[i * 2 + 1]; // Low byte
						const pixel16 = (byte1 << 8) | byte2; // Big-endian

						// RGB5A1 format
						const r = (((pixel16 >> 11) & 0x1f) * 255) / 31; // Scale 5-bit to 8-bit
						const g = (((pixel16 >> 6) & 0x1f) * 255) / 31;
						const b = (((pixel16 >> 1) & 0x1f) * 255) / 31;
						const a = (pixel16 & 0x1) * 255; // 1-bit alpha: 0 or 255

						paletteColors.push(r, g, b, a);
					}
				} else {
					throw new Error("Unsupported palette format");
				}

				for (let i = 0; i < width * height; i++) {
					const paletteIndex = pixelData[i];
					const colorIndex = paletteIndex * 4;

					if (colorIndex < paletteColors.length) {
						pixels[i * 4] = paletteColors[colorIndex];
						pixels[i * 4 + 1] = paletteColors[colorIndex + 1];
						pixels[i * 4 + 2] = paletteColors[colorIndex + 2];
						pixels[i * 4 + 3] = paletteColors[colorIndex + 3];
					} else {
						// Default to magenta for missing palette entries
						pixels[i * 4] = 255;
						pixels[i * 4 + 1] = 0;
						pixels[i * 4 + 2] = 255;
						pixels[i * 4 + 3] = 255;
					}
				}
				break;
			}

			default:
				return null;
		}

		return imageData;
	} catch (error) {
		console.error("Error decoding texture:", error);
		return null;
	}
}

export function ImageViewer({
	resource,
	availableTextures = [],
}: ImageViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [textureInfo, setTextureInfo] = useState<TextureData | null>(null);
	const [selectedPalettePath, setSelectedPalettePath] = useState<string | null>(
		null,
	);
	const [isPaletteTexture, setIsPaletteTexture] = useState(false);

	useEffect(() => {
		const textureData = parseTextureData(resource.dataWithoutHeader);
		if (!textureData) return;

		const needsPalette =
			textureData.textureType === TextureType.Palette4bpp ||
			textureData.textureType === TextureType.Palette8bpp;

		setIsPaletteTexture(needsPalette);

		// Auto-select first available texture as palette if needed
		if (
			needsPalette &&
			availableTextures.length > 0 &&
			availableTextures.findIndex((t) => t.path === selectedPalettePath) === -1
		) {
			setSelectedPalettePath(availableTextures[0].path);
		}
	}, [resource, availableTextures, selectedPalettePath]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		setError(null);
		const textureData = parseTextureData(resource.dataWithoutHeader);

		if (!textureData) {
			setError("Failed to parse texture data");
			return;
		}

		setTextureInfo(textureData);

		// Get palette data if needed
		let paletteData: TextureData | undefined;
		if (isPaletteTexture && selectedPalettePath) {
			const paletteResource = availableTextures.find(
				(t) => t.path === selectedPalettePath,
			);
			if (paletteResource) {
				paletteData =
					parseTextureData(paletteResource.dataWithoutHeader) || undefined;
			}
		}

		const imageData = decodeTexture(textureData, paletteData);
		if (!imageData) {
			const isPalette =
				textureData.textureType === TextureType.Palette4bpp ||
				textureData.textureType === TextureType.Palette8bpp;

			if (isPalette && !selectedPalettePath) {
				setError(
					"This is a palette texture. Please select a palette texture from the dropdown.",
				);
			} else if (isPalette && !paletteData) {
				setError("Failed to load palette texture.");
			} else {
				setError(
					`Unsupported or unimplemented texture type: ${TextureType[textureData.textureType] || textureData.textureType}`,
				);
			}
			return;
		}

		canvas.width = textureData.width;
		canvas.height = textureData.height;

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			setError("Failed to get canvas context");
			return;
		}

		ctx.putImageData(imageData, 0, 0);
	}, [resource, isPaletteTexture, selectedPalettePath, availableTextures]);

	return (
		<div className="flex flex-col items-center gap-4 p-4">
			{isPaletteTexture && availableTextures.length > 0 && (
				<div className="w-full max-w-md flex items-center justify-center">
					<div className="text-sm font-medium mr-2">Palette:</div>
					<Select
						value={selectedPalettePath || ""}
						onValueChange={setSelectedPalettePath}
					>
						<SelectTrigger>
							<SelectValue placeholder="Choose a palette texture..." />
						</SelectTrigger>
						<SelectContent>
							{availableTextures.map((texture) => (
								<SelectItem key={texture.path} value={texture.path}>
									{texture.path.split("/").pop()}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
			{isPaletteTexture && availableTextures.length === 0 && (
				<Alert>
					<AlertDescription>
						This is a palette texture, but no other textures are available in
						the same folder to use as a palette.
					</AlertDescription>
				</Alert>
			)}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<canvas
				ref={canvasRef}
				className="border rounded shadow-sm"
				style={{
					imageRendering: "pixelated",
					width: textureInfo ? `${textureInfo.width * 4}px` : "auto",
					height: textureInfo ? `${textureInfo.height * 4}px` : "auto",
					maxWidth: "100%",
					maxHeight: "80vh",
				}}
			/>
		</div>
	);
}
