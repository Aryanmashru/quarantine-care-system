import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuarantineCare — 74-Bed Unit Worklist",
  description: "Virus quarantine and treatment facility management app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
