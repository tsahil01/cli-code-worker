import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLI CODE WORKER",
  description: "CLI CODE WORKER",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
