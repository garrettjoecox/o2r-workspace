import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OverwriteDialogProps {
	open: boolean;
	resourcePath: string | null;
	onConfirm: () => void;
	onCancel: () => void;
}

export function OverwriteDialog({
	open,
	resourcePath,
	onConfirm,
	onCancel,
}: OverwriteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Overwrite existing resource?</AlertDialogTitle>
					<AlertDialogDescription>
						A resource already exists at path{" "}
						<span className="font-mono text-sm">{resourcePath}</span>. Do you
						want to replace it with the new version?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>Overwrite</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
