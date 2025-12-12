import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type React from "react";
import {
	O2RFilesProvider,
	SelectionProvider,
	WorkspaceProvider,
} from "@/lib/context";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "SoH Animation Editor",
	description:
		"Use Fast64 C outputs to override animation files for Ship of Harkinian",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body className={`font-sans antialiased`}>
				<WorkspaceProvider>
					<O2RFilesProvider>
						<SelectionProvider>
							{children}
							<Analytics />
						</SelectionProvider>
					</O2RFilesProvider>
				</WorkspaceProvider>
			</body>
		</html>
	);
}
