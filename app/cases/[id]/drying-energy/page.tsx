import Link from "next/link";
import {requirePageUser} from "@/lib/auth";
import DryingEnergyManager from "@/components/DryingEnergyManager";
export default async function DryingEnergyPage({params}:{params:Promise<{id:string}>}){
 await requirePageUser(["admin","techniker","buero"]);const{id}=await params;
 return <main className="shell"><div className="topbar"><Link className="back" href={`/cases/${id}`}>← Zur Schadenakte</Link></div><section className="hero"><span className="pill">Ausführung</span><h1>Trocknung, Laufzeit & Energieverbrauch</h1><p className="muted">Gerätelaufzeiten und Leistungswerte werden automatisch zur Verbrauchsberechnung verwendet und können bei Bedarf korrigiert werden.</p></section><DryingEnergyManager caseId={id}/></main>
}
