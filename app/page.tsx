"use client";

import { FileCode2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { HexViewer } from "@/components/hex-viewer";
import { ResourceTree } from "@/components/resource-tree";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseO2RArchive, type ResourceEntry } from "@/lib/o2r-parser";

export interface O2RFile {
	filename: string;
	resources: ResourceEntry[];
}

export default function Home() {
	const [o2rFiles, setO2rFiles] = useState<O2RFile[]>([]);
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFileSelect = useCallback(async (file: File) => {
		setIsLoading(true);
		setError(null);

		try {
			const parsedResources = await parseO2RArchive(file);

			setO2rFiles((prev) => {
				// Check if file with same name already exists
				const existingIndex = prev.findIndex((f) => f.filename === file.name);

				if (existingIndex !== -1) {
					// Replace existing file
					const newFiles = [...prev];
					newFiles[existingIndex] = {
						filename: file.name,
						resources: parsedResources,
					};
					return newFiles;
				} else {
					// Add new file
					return [...prev, { filename: file.name, resources: parsedResources }];
				}
			});

			// Clear selection when uploading a file
			setSelectedPath(null);
			setSelectedFileIndex(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to parse O2R file");
			console.error("Error parsing O2R:", err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const file = e.dataTransfer.files[0];
			if (file) {
				handleFileSelect(file);
			}
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				handleFileSelect(file);
			}
		},
		[handleFileSelect],
	);

	const handleResourceSelect = useCallback(
		(path: string, fileIndex: number) => {
			setSelectedPath(path);
			setSelectedFileIndex(fileIndex);
		},
		[],
	);

	const handleRemoveFile = useCallback(
		(fileIndex: number) => {
			setO2rFiles((prev) => prev.filter((_, index) => index !== fileIndex));

			// Clear selection if the removed file was selected
			if (selectedFileIndex === fileIndex) {
				setSelectedPath(null);
				setSelectedFileIndex(null);
			} else if (selectedFileIndex !== null && selectedFileIndex > fileIndex) {
				// Adjust the selected file index if a file before it was removed
				setSelectedFileIndex(selectedFileIndex - 1);
			}
		},
		[selectedFileIndex],
	);

	const selectedResource =
		selectedFileIndex !== null
			? o2rFiles[selectedFileIndex]?.resources.find(
					(r) => r.path === selectedPath,
				)
			: null;

	return (
		<main className="min-h-screen max-h-screen overflow-hidden bg-background flex flex-row">
			<div className="w-100 border-r border-border bg-card flex flex-col">
				<header className="border-b border-border bg-card">
					<div className="container mx-auto px-6 py-4">
						<div className="flex items-center gap-3">
							<FileCode2 className="w-8 h-8 text-primary" />
							<div>
								<h1 className="text-2xl font-bold text-foreground">
									O2R Workspace
								</h1>
								<p className="text-sm text-muted-foreground">
									Explore and edit O2R resources
								</p>
							</div>
						</div>
					</div>
				</header>
				<div className="border-b border-border p-4 flex items-center justify-between gap-2">
					<h2 className="font-semibold">O2Rs</h2>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => document.getElementById("add-file-input")?.click()}
						>
							<Upload className="h-4 w-4 mr-1" />
							Upload
						</Button>
						<input
							id="add-file-input"
							type="file"
							accept=".o2r,.zip"
							className="hidden"
							onChange={handleFileInputChange}
						/>
					</div>
				</div>
				<div className="flex-1 overflow-scroll">
					<ResourceTree
						o2rFiles={o2rFiles}
						selectedPath={selectedPath}
						selectedFileIndex={selectedFileIndex}
						onResourceSelect={handleResourceSelect}
						onRemoveFile={handleRemoveFile}
					/>
				</div>
			</div>

			{/* Main content area */}
			<div className="flex-1 overflow-scroll">
				{selectedResource ? (
					<div className="p-6">
						<HexViewer resource={selectedResource} />
					</div>
				) : o2rFiles.length === 0 ? (
					<div className="container mx-auto px-6 py-8 flex items-center justify-center">
						<Card className="w-full max-w-2xl">
							<CardContent className="pt-6">
								<div
									className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
									onDrop={handleDrop}
									onDragOver={handleDragOver}
									onClick={() => document.getElementById("file-input")?.click()}
								>
									<Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
									<h2 className="text-xl font-semibold mb-2">
										Drop an O2R file to get started
									</h2>
									<p className="text-muted-foreground mb-4">
										or click to browse your files
									</p>
									{isLoading && (
										<p className="text-sm text-primary">Loading...</p>
									)}
									{error && <p className="text-sm text-destructive">{error}</p>}
									<input
										id="file-input"
										type="file"
										accept=".o2r,.zip"
										className="hidden"
										onChange={handleFileInputChange}
									/>
								</div>
							</CardContent>
						</Card>
					</div>
				) : (
					<div className="h-full flex items-center justify-center text-muted-foreground">
						<div className="text-center">
							<FileCode2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
							<p>Select a resource from the tree to view its contents</p>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
