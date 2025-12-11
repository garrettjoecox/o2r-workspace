"use client";

import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTROL_CODE_NAMES, CONTROL_CODES } from "@/lib/message-parser";

interface ControlCodeMenuProps {
	onInsert: (code: number, name: string) => void;
}

const CONTROL_CODE_GROUPS = {
	"Text Flow": [
		CONTROL_CODES.NEWLINE,
		CONTROL_CODES.END,
		CONTROL_CODES.BOX_BREAK,
		CONTROL_CODES.BOX_BREAK_DELAYED,
		CONTROL_CODES.AWAIT_BUTTON_PRESS,
	],
	Formatting: [
		CONTROL_CODES.COLOR,
		CONTROL_CODES.SHIFT,
		CONTROL_CODES.TEXT_SPEED,
	],
	"Visual Effects": [
		CONTROL_CODES.FADE,
		CONTROL_CODES.FADE2,
		CONTROL_CODES.BACKGROUND,
	],
	Interactive: [
		CONTROL_CODES.TWO_CHOICE,
		CONTROL_CODES.THREE_CHOICE,
		CONTROL_CODES.QUICKTEXT_ENABLE,
		CONTROL_CODES.QUICKTEXT_DISABLE,
		CONTROL_CODES.UNSKIPPABLE,
	],
	Content: [
		CONTROL_CODES.TEXTID,
		CONTROL_CODES.NAME,
		CONTROL_CODES.ITEM_ICON,
		CONTROL_CODES.OCARINA,
	],
	"Display Data": [
		CONTROL_CODES.MARATHON_TIME,
		CONTROL_CODES.RACE_TIME,
		CONTROL_CODES.POINTS,
		CONTROL_CODES.TOKENS,
		CONTROL_CODES.FISH_INFO,
		CONTROL_CODES.HIGHSCORE,
		CONTROL_CODES.TIME,
	],
	Other: [CONTROL_CODES.SFX, CONTROL_CODES.EVENT, CONTROL_CODES.PERSISTENT],
};

export function ControlCodeMenu({ onInsert }: ControlCodeMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
					<Code2 className="w-4 h-4 mr-2" />
					Insert Control Code
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-64 max-h-[500px] overflow-y-auto">
				{Object.entries(CONTROL_CODE_GROUPS).map(([groupName, codes]) => (
					<div key={groupName}>
						<DropdownMenuLabel>{groupName}</DropdownMenuLabel>
						{codes.map((code) => {
							const name = CONTROL_CODE_NAMES[code];
							return (
								<DropdownMenuItem
									key={code}
									onClick={() => onInsert(code, name)}
									className="font-mono text-xs"
								>
									<span className="text-muted-foreground mr-2">
										0x{code.toString(16).toUpperCase().padStart(2, "0")}
									</span>
									{name}
								</DropdownMenuItem>
							);
						})}
						<DropdownMenuSeparator />
					</div>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
