"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { MessageEntry } from "@/lib/message-parser";

interface MessageListProps {
	messages: MessageEntry[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	selectedForExport: Set<number>;
	onToggleExport: (id: number) => void;
}

export function MessageList({
	messages,
	selectedId,
	onSelect,
	selectedForExport,
	onToggleExport,
}: MessageListProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredMessages = useMemo(() => {
		if (!searchQuery.trim()) {
			return messages;
		}

		const query = searchQuery.toLowerCase().trim();

		return messages.filter((msg) => {
			// Check decimal ID
			if (msg.id.toString().includes(query)) {
				return true;
			}

			// Check hex ID (with or without 0x prefix)
			const hexId = msg.id.toString(16).toLowerCase();
			const cleanQuery = query.startsWith("0x") ? query.slice(2) : query;
			if (hexId.includes(cleanQuery)) {
				return true;
			}

			// Check preview content
			if (msg.preview.toLowerCase().includes(query)) {
				return true;
			}

			return false;
		});
	}, [messages, searchQuery]);

	return (
		<div className="flex flex-col gap-4">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search by ID or content..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-9"
				/>
			</div>
			<div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
				<div className="space-y-2 pr-4">
					{filteredMessages.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							No messages found
						</div>
					) : (
						filteredMessages.map((msg) => (
							<Card
								key={msg.id}
								className={`p-4 cursor-pointer transition-colors ${
									selectedId === msg.id
										? "bg-primary/20 border-primary"
										: "hover:bg-primary/50"
								}`}
								onClick={() => onSelect(msg.id)}
							>
								<div className="flex items-start gap-3">
									<Checkbox
										checked={selectedForExport.has(msg.id)}
										onCheckedChange={() => onToggleExport(msg.id)}
										onClick={(e) => e.stopPropagation()}
										className="mt-0.5"
									/>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between">
											<span className="text-sm font-mono font-medium text-primary">
												0x{msg.id.toString(16).toUpperCase().padStart(4, "0")} (
												{msg.id})
											</span>
											<span className="text-xs text-muted-foreground">
												{msg.data.length} bytes
											</span>
										</div>
										<p className="text-sm font-mono text-foreground/80 truncate">
											{msg.preview}
										</p>
									</div>
								</div>
							</Card>
						))
					)}
				</div>
			</div>
		</div>
	);
}
