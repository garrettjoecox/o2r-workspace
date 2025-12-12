import { FileCode2 } from "lucide-react";

export function WorkspaceHeader() {
	return (
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
	);
}
