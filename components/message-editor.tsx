"use client";

import { Code2, Edit, Eye, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ControlCodeMenu } from "@/components/control-code-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	editableTextToMessageData,
	insertControlCode,
	type MessageEntry,
	messageDataToEditableText,
	parseMessageData,
} from "@/lib/message-parser";

interface MessageEditorProps {
	message: MessageEntry;
	onUpdate?: (message: MessageEntry) => void;
}

export function MessageEditor({ message, onUpdate }: MessageEditorProps) {
	const [view, setView] = useState<"parsed" | "hex" | "edit">("parsed");
	const [editText, setEditText] = useState("");
	const [hasChanges, setHasChanges] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const parsed = parseMessageData(message.data);

	// Initialize edit text when message changes
	useEffect(() => {
		setEditText(messageDataToEditableText(message.data));
		setHasChanges(false);
	}, [message.id, message.data]);

	const handleSave = () => {
		if (onUpdate) {
			const newData = editableTextToMessageData(editText);
			const updatedMessage: MessageEntry = {
				...message,
				data: newData,
			};
			onUpdate(updatedMessage);
			setHasChanges(false);
		}
	};

	const handleCancel = () => {
		setEditText(messageDataToEditableText(message.data));
		setHasChanges(false);
		setView("parsed");
	};

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setEditText(e.target.value);
		setHasChanges(true);
	};

	const handleInsertControlCode = (code: number, name: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const cursorPosition = textarea.selectionStart;

		// Determine if this control code needs arguments
		let args: number[] = [];

		// Prompt for arguments based on control code
		if (code === 0x05) {
			// COLOR
			const colorInput = prompt("Enter color value (0x00-0xFF):", "0x00");
			if (colorInput) {
				const colorValue = parseInt(colorInput, 16);
				if (!isNaN(colorValue)) args = [colorValue];
			}
		} else if (code === 0x07) {
			// TEXTID
			const textIdInput = prompt("Enter text ID (0x0000-0xFFFF):", "0x0000");
			if (textIdInput) {
				const textId = parseInt(textIdInput, 16);
				if (!isNaN(textId)) {
					args = [textId & 0xff, (textId >> 8) & 0xff];
				}
			}
		} else if (code === 0x12 || code === 0x11) {
			// SFX, FADE2
			const val1 = prompt("Enter first byte (0x00-0xFF):", "0x00");
			const val2 = prompt("Enter second byte (0x00-0xFF):", "0x00");
			if (val1 && val2) {
				const v1 = parseInt(val1, 16);
				const v2 = parseInt(val2, 16);
				if (!isNaN(v1) && !isNaN(v2)) args = [v1, v2];
			}
		} else if (code === 0x15) {
			// BACKGROUND
			const val1 = prompt("Enter first byte (0x00-0xFF):", "0x00");
			const val2 = prompt("Enter second byte (0x00-0xFF):", "0x00");
			const val3 = prompt("Enter third byte (0x00-0xFF):", "0x00");
			if (val1 && val2 && val3) {
				const v1 = parseInt(val1, 16);
				const v2 = parseInt(val2, 16);
				const v3 = parseInt(val3, 16);
				if (!isNaN(v1) && !isNaN(v2) && !isNaN(v3)) args = [v1, v2, v3];
			}
		} else if ([0x13, 0x0e, 0x0c, 0x1e, 0x06, 0x14].includes(code)) {
			// Single byte argument codes
			const valueInput = prompt("Enter value (0x00-0xFF):", "0x00");
			if (valueInput) {
				const value = parseInt(valueInput, 16);
				if (!isNaN(value)) args = [value];
			}
		}

		const { newText, newCursorPosition } = insertControlCode(
			editText,
			cursorPosition,
			code,
			name,
			args,
		);
		setEditText(newText);
		setHasChanges(true);

		// Restore cursor position
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(newCursorPosition, newCursorPosition);
		}, 0);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-mono font-semibold text-foreground">
						0x{message.id.toString(16).toUpperCase().padStart(4, "0")} (
						{message.id})
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Type: {message.textboxType} | Y-Pos: {message.textboxYPos}
						{hasChanges && (
							<span className="ml-2 text-amber-500">• Unsaved changes</span>
						)}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant={view === "parsed" ? "default" : "outline"}
						size="sm"
						onClick={() => setView("parsed")}
					>
						<Eye className="w-4 h-4 mr-2" />
						View
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
							<div className="flex items-center justify-between">
								<ControlCodeMenu onInsert={handleInsertControlCode} />
								<div className="flex gap-2">
									{hasChanges && (
										<>
											<Button onClick={handleSave} size="sm" variant="default">
												<Save className="w-4 h-4 mr-2" />
												Save Changes
											</Button>
											<Button
												onClick={handleCancel}
												size="sm"
												variant="outline"
											>
												<X className="w-4 h-4 mr-2" />
												Cancel
											</Button>
										</>
									)}
								</div>
							</div>
							<Textarea
								ref={textareaRef}
								value={editText}
								onChange={handleTextChange}
								className="min-h-[400px] font-mono text-sm"
								placeholder="Enter message text here. Use [CONTROL_CODE] for control codes."
							/>
							<div className="text-xs text-muted-foreground">
								<p>
									Control codes are formatted as [NAME] or [NAME(0x00, 0x01)]
									with arguments.
								</p>
								<p>
									Use the "Insert Control Code" button to add control codes
									easily.
								</p>
							</div>
						</div>
					) : view === "parsed" ? (
						<div className="font-mono text-sm whitespace-pre-wrap">
							{parsed.map((item, index) => (
								<span key={index}>
									{item.type === "control" ? (
										<>
											<Badge
												variant="secondary"
												className="bg-accent text-xs text-accent-foreground inline-flex items-center gap-1 align-middle mx-1"
											>
												{item.value}
											</Badge>
											<span className="text-muted-foreground text-xs mx-1">
												[
												{item.bytes
													.map(
														(b) =>
															`0x${b.toString(16).toUpperCase().padStart(2, "0")}`,
													)
													.join(" ")}
												]
											</span>
										</>
									) : (
										<span className="text-foreground">{item.value}</span>
									)}
								</span>
							))}
						</div>
					) : (
						<div className="font-mono text-sm">
							<div className="grid grid-cols-[auto_1fr_1fr] gap-4">
								<div className="text-muted-foreground">Offset</div>
								<div className="text-muted-foreground">Hex</div>
								<div className="text-muted-foreground">ASCII</div>

								{Array.from({
									length: Math.ceil(message.data.length / 16),
								}).map((_, rowIndex) => {
									const offset = rowIndex * 16;
									const rowData = message.data.slice(offset, offset + 16);

									return (
										<div key={rowIndex} className="contents">
											<div className="text-primary">
												{offset.toString(16).toUpperCase().padStart(8, "0")}
											</div>
											<div className="text-foreground">
												{Array.from(rowData)
													.map((b) =>
														b.toString(16).toUpperCase().padStart(2, "0"),
													)
													.join(" ")}
											</div>
											<div className="text-muted-foreground">
												{Array.from(rowData)
													.map((b) =>
														b >= 0x20 && b < 0x7f
															? String.fromCharCode(b)
															: ".",
													)
													.join("")}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
