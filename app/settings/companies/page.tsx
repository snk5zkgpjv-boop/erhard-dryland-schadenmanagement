import {requirePageUser} from "@/lib/auth";
import CompanySettings from "@/components/CompanySettings";
export default async function CompanySettingsPage(){await requirePageUser(["admin"]);return <main className="shell"><section className="hero"><span className="pill">Administration</span><h1>Firmendaten</h1><p className="muted">Kopf-/Fußzeile, Kontakt-, Bank- und Steuerdaten je Firma bearbeiten.</p></section><CompanySettings/></main>}
