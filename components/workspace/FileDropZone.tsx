import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FileDropZoneProps {
	onDrop: (e: React.DragEvent) => void;
	onDragOver: (e: React.DragEvent) => void;
	onClick: () => void;
	isLoading: boolean;
	error: string | null;
}

export function FileDropZone({
	onDrop,
	onDragOver,
	onClick,
	isLoading,
	error,
}: FileDropZoneProps) {
	return (
		<div className="h-full flex items-center justify-center text-muted-foreground">
			<Card className="w-full max-w-2xl">
				<CardContent className="pt-6">
					<div
						className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
						onDrop={onDrop}
						onDragOver={onDragOver}
						onClick={onClick}
					>
						<Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
						<h2 className="text-xl font-semibold mb-2">
							Drop an O2R file to get started
						</h2>
						<p className="text-muted-foreground mb-4">
							or click to browse your files
						</p>
						{isLoading && <p className="text-sm text-primary">Loading...</p>}
						{error && <p className="text-sm text-destructive">{error}</p>}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
