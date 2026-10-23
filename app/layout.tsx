import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ch@ricks — client inbox",
  description: "Manage your clients' Gmail in one place, with their consent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
