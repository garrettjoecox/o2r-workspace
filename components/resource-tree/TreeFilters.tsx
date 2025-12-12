import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface TreeFiltersProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	filterType: string;
	onFilterChange: (type: string) => void;
	availableTypes: string[];
}

export function TreeFilters({
	searchQuery,
	onSearchChange,
	filterType,
	onFilterChange,
	availableTypes,
}: TreeFiltersProps) {
	return (
		<div className="p-2 border-b border-border flex">
			<div className="relative pr-2">
				<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search resources..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-8 pr-8 h-9"
				/>
				{searchQuery && (
					<button
						type="button"
						onClick={() => onSearchChange("")}
						className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>
			<Select value={filterType} onValueChange={onFilterChange}>
				<SelectTrigger className="h-9">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4" />
						<SelectValue />
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Types</SelectItem>
					{availableTypes.map((type) => (
						<SelectItem key={type} value={type}>
							{type}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
