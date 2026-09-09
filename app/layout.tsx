import "./globals.css";
import "./ui-polish.css";
import "./report-print-fix.css";
import "./measurement-photo-fix.css";
import "./photo-edit-fix.css";
import "./report-photo-manager.css";
import type { Metadata } from "next";
import CaseMobileEditEnhancer from "@/components/CaseMobileEditEnhancer";
import CasePhotoEditEnhancer from "@/components/CasePhotoEditEnhancer";
export const metadata: Metadata = {
  title:"Erhard Organisationszentrale",
  description:"Organisation, Kunden, Zeiten, Finanzen und Familie an einem Ort"
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="de"><body>{children}<CaseMobileEditEnhancer/><CasePhotoEditEnhancer/></body></html>
}
