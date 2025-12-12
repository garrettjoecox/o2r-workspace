import { Button } from "@/components/ui/button";

type ViewMode = "hex" | "image" | "c-editor";

interface ViewModeSelectorProps {
	viewModes: ViewMode[];
	currentViewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeSelector({
	viewModes,
	currentViewMode,
	onViewModeChange,
}: ViewModeSelectorProps) {
	if (viewModes.length <= 1) {
		return null;
	}

	const getViewModeLabel = (mode: ViewMode): string => {
		if (mode === "c-editor") return "C Editor";
		if (mode === "hex") return "Hex";
		if (mode === "image") return "Image";
		return "Unknown";
	};

	return (
		<div className="ms-6 flex">
			{viewModes.map((mode) => (
				<Button
					key={mode}
					className="rounded-b-none"
					variant={currentViewMode === mode ? "default" : "outline"}
					size="default"
					onClick={() => onViewModeChange(mode)}
				>
					{getViewModeLabel(mode)} View
				</Button>
			))}
		</div>
	);
}
