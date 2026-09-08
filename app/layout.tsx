import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Erhard & Dryland Schadenmanagement",
  description: "Digitale Schadenakte, Trocknung, Rapporte, Energieverbrauch, Angebote und Rechnungen"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
