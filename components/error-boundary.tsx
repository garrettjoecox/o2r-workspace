"use client";

import { AlertTriangle } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="p-6">
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle>Something went wrong</AlertTitle>
						<AlertDescription className="mt-2 space-y-2">
							<p>
								An error occurred while rendering this component. Please try
								refreshing the page.
							</p>
							{this.state.error && (
								<pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
									{this.state.error.message}
								</pre>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									this.setState({ hasError: false, error: undefined })
								}
								className="mt-2"
							>
								Try Again
							</Button>
						</AlertDescription>
					</Alert>
				</div>
			);
		}

		return this.props.children;
	}
}
