"use client";

import { Code2, Copy, Edit, Eye, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	type ActorAnimationEntry,
	type AnimationEntry,
	animationToC,
	type LinkAnimationEntry,
} from "@/lib/animation-parser";

interface AnimationEditorProps {
	animation: AnimationEntry;
	onUpdate?: (animation: AnimationEntry) => void;
}

export function AnimationEditor({ animation, onUpdate }: AnimationEditorProps) {
	const [view, setView] = useState<"info" | "hex" | "edit">("info");
	const [editName, setEditName] = useState(animation.name);
	const [editFrameCount, setEditFrameCount] = useState(
		animation.frameCount.toString(),
	);
	const [editData, setEditData] = useState("");
	const [editJointIndices, setEditJointIndices] = useState("");
	const [editStaticIndexMax, setEditStaticIndexMax] = useState("");
	const [hasChanges, setHasChanges] = useState(false);

	useEffect(() => {
		setEditName(animation.name);
		setEditFrameCount(animation.frameCount.toString());

		if (animation.type === "link") {
			setEditData(
				Array.from(animation.data)
					.map((v) =>
						v < 0
							? `-0x${(-v).toString(16).toUpperCase().padStart(4, "0")}`
							: `0x${v.toString(16).toUpperCase().padStart(4, "0")}`,
					)
					.join(", "),
			);
		} else {
			setEditData(
				Array.from(animation.frameData)
					.map((v) =>
						v < 0
							? `-0x${(-v).toString(16).toUpperCase().padStart(4, "0")}`
							: `0x${v.toString(16).toUpperCase().padStart(4, "0")}`,
					)
					.join(", "),
			);
			setEditJointIndices(
				animation.jointIndices
					.map(
						(j) =>
							`{ 0x${j.x.toString(16).toUpperCase().padStart(4, "0")}, 0x${j.y.toString(16).toUpperCase().padStart(4, "0")}, 0x${j.z.toString(16).toUpperCase().padStart(4, "0")} }`,
					)
					.join(",\n"),
			);
			setEditStaticIndexMax(animation.staticIndexMax.toString());
		}

		setHasChanges(false);
	}, [animation]);

	const handleSave = () => {
		if (onUpdate) {
			try {
				if (animation.type === "link") {
					// Parse Link animation
					const hexValues = editData.match(
						/(?:0x[0-9A-Fa-f]+|-0x[0-9A-Fa-f]+)/g,
					);
					if (!hexValues) {
						alert("Invalid data format");
						return;
					}

					const newData = new Int16Array(hexValues.length);
					for (let i = 0; i < hexValues.length; i++) {
						newData[i] = parseInt(hexValues[i], 16);
					}

					const updatedAnimation: LinkAnimationEntry = {
						type: "link",
						name: editName,
						frameCount: parseInt(editFrameCount, 10),
						data: newData,
					};
					onUpdate(updatedAnimation);
				} else {
					// Parse Actor animation
					const hexValues = editData.match(
						/(?:0x[0-9A-Fa-f]+|-0x[0-9A-Fa-f]+)/g,
					);
					if (!hexValues) {
						alert("Invalid frame data format");
						return;
					}

					const newFrameData = new Int16Array(hexValues.length);
					for (let i = 0; i < hexValues.length; i++) {
						newFrameData[i] = parseInt(hexValues[i], 16);
					}

					// Parse joint indices
					const jointMatches = editJointIndices.matchAll(
						/\{\s*(0x[0-9A-Fa-f]+)\s*,\s*(0x[0-9A-Fa-f]+)\s*,\s*(0x[0-9A-Fa-f]+)\s*\}/g,
					);
					const newJointIndices = [];
					for (const match of jointMatches) {
						newJointIndices.push({
							x: parseInt(match[1], 16),
							y: parseInt(match[2], 16),
							z: parseInt(match[3], 16),
						});
					}

					if (newJointIndices.length === 0) {
						alert("Invalid joint indices format");
						return;
					}

					const updatedAnimation: ActorAnimationEntry = {
						type: "actor",
						name: editName,
						frameCount: parseInt(editFrameCount, 10),
						frameData: newFrameData,
						jointIndices: newJointIndices,
						staticIndexMax: parseInt(editStaticIndexMax, 10),
					};
					onUpdate(updatedAnimation);
				}
				setHasChanges(false);
			} catch (error) {
				alert(
					"Error parsing animation data: " +
						(error instanceof Error ? error.message : "Unknown error"),
				);
			}
		}
	};

	const handleCancel = () => {
		setEditName(animation.name);
		setEditFrameCount(animation.frameCount.toString());

		if (animation.type === "link") {
			setEditData(
				Array.from(animation.data)
					.map((v) =>
						v < 0
							? `-0x${(-v).toString(16).toUpperCase().padStart(4, "0")}`
							: `0x${v.toString(16).toUpperCase().padStart(4, "0")}`,
					)
					.join(", "),
			);
		} else {
			setEditData(
				Array.from(animation.frameData)
					.map((v) =>
						v < 0
							? `-0x${(-v).toString(16).toUpperCase().padStart(4, "0")}`
							: `0x${v.toString(16).toUpperCase().padStart(4, "0")}`,
					)
					.join(", "),
			);
			setEditJointIndices(
				animation.jointIndices
					.map(
						(j) =>
							`{ 0x${j.x.toString(16).toUpperCase().padStart(4, "0")}, 0x${j.y.toString(16).toUpperCase().padStart(4, "0")}, 0x${j.z.toString(16).toUpperCase().padStart(4, "0")} }`,
					)
					.join(",\n"),
			);
			setEditStaticIndexMax(animation.staticIndexMax.toString());
		}

		setHasChanges(false);
		setView("info");
	};

	const handleCopyC = async () => {
		const cSource = animationToC(animation);
		await navigator.clipboard.writeText(cSource);
		alert("C source copied to clipboard!");
	};

	const renderHexDump = () => {
		const lines: string[] = [];
		const valuesPerLine = 8;
		const data =
			animation.type === "link" ? animation.data : animation.frameData;

		for (let i = 0; i < data.length; i += valuesPerLine) {
			const values = [];
			for (let j = 0; j < valuesPerLine && i + j < data.length; j++) {
				const value = data[i + j];
				const hexStr =
					value < 0
						? `-0x${(-value).toString(16).toUpperCase().padStart(4, "0")}`
						: `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;
				values.push(hexStr.padStart(7, " "));
			}
			lines.push(
				`${(i * 2).toString(16).toUpperCase().padStart(4, "0")}: ${values.join(" ")}`,
			);
		}

		return lines.join("\n");
	};

	const getAnimationInfo = () => {
		if (animation.type === "link") {
			return {
				type: "Link Animation",
				dataValues: animation.data.length,
				binarySize: animation.data.length * 2,
			};
		} else {
			return {
				type: "Actor Animation",
				dataValues: animation.frameData.length,
				binarySize:
					animation.frameData.length * 2 + animation.jointIndices.length * 6,
				jointCount: animation.jointIndices.length,
				staticIndexMax: animation.staticIndexMax,
			};
		}
	};

	const info = getAnimationInfo();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-mono font-semibold text-foreground">
						{animation.name}
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{info.type} | Frames: {animation.frameCount} | Data Values:{" "}
						{info.dataValues} | Size: {info.binarySize} bytes
						{animation.type === "actor" && ` | Joints: ${info.jointCount}`}
						{hasChanges && (
							<span className="ml-2 text-amber-500">• Unsaved changes</span>
						)}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleCopyC}>
						<Copy className="w-4 h-4 mr-2" />
						Copy C
					</Button>
					<Button
						variant={view === "info" ? "default" : "outline"}
						size="sm"
						onClick={() => setView("info")}
					>
						<Eye className="w-4 h-4 mr-2" />
						Info
					</Button>
					<Button
						variant={view === "edit" ? "default" : "outline"}
						size="sm"
						onClick={() => setView("edit")}
					>
						<Edit className="w-4 h-4 mr-2" />
						Edit
					</Button>
					<Button
						variant={view === "hex" ? "default" : "outline"}
						size="sm"
						onClick={() => setView("hex")}
					>
						<Code2 className="w-4 h-4 mr-2" />
						Hex
					</Button>
				</div>
			</div>

			<Card className="p-6">
				<div className="h-[calc(100vh-20rem)]">
					{view === "edit" ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-semibold">Edit Animation</h3>
								<div className="flex gap-2">
									{hasChanges && (
										<>
											<Button
												onClick={handleCancel}
												variant="outline"
												size="sm"
											>
												<X className="w-4 h-4 mr-2" />
												Cancel
											</Button>
											<Button onClick={handleSave} size="sm">
												<Save className="w-4 h-4 mr-2" />
												Save
											</Button>
										</>
									)}
								</div>
							</div>

							<div className="space-y-4">
								<div>
									<Label htmlFor="anim-name">Animation Name</Label>
									<Input
										id="anim-name"
										value={editName}
										onChange={(e) => {
											setEditName(e.target.value);
											setHasChanges(true);
										}}
										className="font-mono"
									/>
								</div>

								<div>
									<Label htmlFor="frame-count">Frame Count</Label>
									<Input
										id="frame-count"
										type="number"
										value={editFrameCount}
										onChange={(e) => {
											setEditFrameCount(e.target.value);
											setHasChanges(true);
										}}
										className="font-mono"
									/>
								</div>

								<div>
									<Label htmlFor="anim-data">
										{animation.type === "link"
											? "Animation Data"
											: "Frame Data"}{" "}
										(s16 hex values)
									</Label>
									<Textarea
										id="anim-data"
										value={editData}
										onChange={(e) => {
											setEditData(e.target.value);
											setHasChanges(true);
										}}
										className="font-mono text-xs min-h-[200px]"
										placeholder="0x0021, 0x0A78, -0x0016, ..."
									/>
								</div>

								{animation.type === "actor" && (
									<>
										<div>
											<Label htmlFor="joint-indices">
												Joint Indices (JointIndex array)
											</Label>
											<Textarea
												id="joint-indices"
												value={editJointIndices}
												onChange={(e) => {
													setEditJointIndices(e.target.value);
													setHasChanges(true);
												}}
												className="font-mono text-xs min-h-[200px]"
												placeholder="{ 0x0000, 0x0001, 0x0000 },&#10;{ 0x0002, 0x0003, 0x0002 }, ..."
											/>
										</div>

										<div>
											<Label htmlFor="static-index-max">Static Index Max</Label>
											<Input
												id="static-index-max"
												type="number"
												value={editStaticIndexMax}
												onChange={(e) => {
													setEditStaticIndexMax(e.target.value);
													setHasChanges(true);
												}}
												className="font-mono"
											/>
										</div>
									</>
								)}
							</div>
						</div>
					) : view === "hex" ? (
						<div>
							<h3 className="font-semibold mb-4">Hex Dump</h3>
							<pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
								{renderHexDump()}
							</pre>
						</div>
					) : (
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold mb-2">Animation Information</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">Type:</span>
										<div className="font-mono">{info.type}</div>
									</div>
									<div>
										<span className="text-muted-foreground">Name:</span>
										<div className="font-mono">{animation.name}</div>
									</div>
									<div>
										<span className="text-muted-foreground">Frame Count:</span>
										<div className="font-mono">{animation.frameCount}</div>
									</div>
									<div>
										<span className="text-muted-foreground">Data Values:</span>
										<div className="font-mono">{info.dataValues}</div>
									</div>
									{animation.type === "actor" && (
										<>
											<div>
												<span className="text-muted-foreground">
													Joint Count:
												</span>
												<div className="font-mono">{info.jointCount}</div>
											</div>
											<div>
												<span className="text-muted-foreground">
													Static Index Max:
												</span>
												<div className="font-mono">{info.staticIndexMax}</div>
											</div>
										</>
									)}
									<div>
										<span className="text-muted-foreground">Binary Size:</span>
										<div className="font-mono">{info.binarySize} bytes</div>
									</div>
								</div>
							</div>

							<div>
								<h3 className="font-semibold mb-2">
									{animation.type === "link" ? "Data" : "Frame Data"} Preview
									(first 64 values)
								</h3>
								<pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
									{Array.from(
										(animation.type === "link"
											? animation.data
											: animation.frameData
										).slice(0, 64),
									)
										.map((v, i) => {
											const hexStr =
												v < 0
													? `-0x${(-v).toString(16).toUpperCase().padStart(4, "0")}`
													: `0x${v.toString(16).toUpperCase().padStart(4, "0")}`;
											return (
												(i % 8 === 0 ? "\n" : "") +
												hexStr.padStart(7, " ") +
												(i < 63 ? "," : "")
											);
										})
										.join(" ")}
									{(animation.type === "link"
										? animation.data.length
										: animation.frameData.length) > 64 && "\n..."}
								</pre>
							</div>

							{animation.type === "actor" && (
								<div>
									<h3 className="font-semibold mb-2">
										Joint Indices Preview (first 10)
									</h3>
									<pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
										{animation.jointIndices
											.slice(0, 10)
											.map(
												(j, i) =>
													`{ 0x${j.x.toString(16).toUpperCase().padStart(4, "0")}, 0x${j.y.toString(16).toUpperCase().padStart(4, "0")}, 0x${j.z.toString(16).toUpperCase().padStart(4, "0")} },`,
											)
											.join("\n")}
										{animation.jointIndices.length > 10 && "\n..."}
									</pre>
								</div>
							)}

							<div>
								<h3 className="font-semibold mb-2">C Source Preview</h3>
								<pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md max-h-[300px] overflow-auto">
									{animationToC(animation)}
								</pre>
							</div>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
