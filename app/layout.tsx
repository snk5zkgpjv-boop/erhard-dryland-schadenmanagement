import "./globals.css";
import "./ui-polish.css";
import "./report-print-fix.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title:"Erhard & Dryland Schadenmanagement",
  description:"Digitale Schadenakte für Erhard Dienstleistungen und Dryland Trocknungstechnik"
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="de"><body>{children}</body></html>
}
