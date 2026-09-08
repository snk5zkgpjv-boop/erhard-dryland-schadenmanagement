import Link from "next/link";
import {requirePageUser} from "@/lib/auth";
import {getSql} from "@/lib/db";
import PrintButton from "@/components/CaseFormPrintButton";
import styles from "@/components/CaseFormLayout.module.css";
function date(v:any){return v?new Date(v).toLocaleDateString("de-DE"):"–"}
function num(v:any,d=1){return v===null||v===undefined?"–":Number(v).toLocaleString("de-DE",{minimumFractionDigits:d,maximumFractionDigits:2})}
function money(v:any){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"}

export default async function EnergyView({params}:{params:Promise<{id:string,energyId:string}>}){
 await requirePageUser(["admin","techniker","buero"]);
 const{id,energyId}=await params,sql=getSql();
 const rows=await sql`SELECT e.*,c.case_number,c.title,c.object_street,c.object_postal_code,c.object_city,c.insurer,c.insurance_number,c.claim_number,
  co.code company_code,co.name company_name,co.street company_street,co.postal_code company_postal_code,co.city company_city,co.email,co.phone,co.mobile,
  cu.first_name,cu.last_name,cu.company_name customer_company_name
  FROM energy_records e JOIN cases c ON c.id=e.case_id JOIN companies co ON co.id=c.company_id LEFT JOIN customers cu ON cu.id=c.customer_id
  WHERE e.id=${energyId} AND e.case_id=${id} LIMIT 1`;
 if(!rows.length)return <main className="shell"><h1>Energieverbrauchsnachweis nicht gefunden.</h1></main>;
 const x:any=rows[0],customer=x.customer_company_name||[x.first_name,x.last_name].filter(Boolean).join(" ")||"–";
 const cost=x.consumption_kwh!=null&&x.price_per_kwh!=null?Number(x.consumption_kwh)*Number(x.price_per_kwh):null;
 return <main className={styles.screen}>
  <div className={`shell noPrint ${styles.toolbar}`}><Link className="back" href={`/cases/${id}/forms`}>← Formulare</Link><PrintButton/></div>
  <article className={styles.sheet}>
   <header className={styles.header}><img src={x.company_code==="DRYLAND"?"/dryland-logo.png":"/erhard-logo.png"} alt="Logo"/><div className={styles.company}><strong>{x.company_name}</strong><br/>{x.company_street||""}<br/>{[x.company_postal_code,x.company_city].filter(Boolean).join(" ")}<br/>{x.email||""}</div></header>
   <div className={styles.energyHero}>Stromverbrauchsnachweis für technische Trocknung</div>
   <div className={styles.grid2}>
    <table className={styles.infoTable}><tbody>
     <tr><th>Kunde / Auftraggeber</th><td>{customer}</td></tr>
     <tr><th>Schadenort / Objekt</th><td>{x.object_street||""}<br/>{[x.object_postal_code,x.object_city].filter(Boolean).join(" ")}</td></tr>
     <tr><th>Wohneinheit / Bereich</th><td>{x.unit_name||"–"}</td></tr>
    </tbody></table>
    <table className={styles.infoTable}><tbody>
     <tr><th>Projekt-/Schadennr.</th><td>{x.case_number||"–"}</td></tr>
     <tr><th>Versicherung</th><td>{x.insurer||"–"}</td></tr>
     <tr><th>Schadennummer</th><td>{x.claim_number||"–"}</td></tr>
     <tr><th>Versicherungsnummer</th><td>{x.insurance_number||"–"}</td></tr>
    </tbody></table>
   </div>

   <h2 className={styles.subTitle}>Trocknungszeitraum und Verbrauch</h2>
   <table className={styles.infoTable}><tbody>
    <tr><th>Beginn</th><td>{date(x.start_date)}</td><th>Ende</th><td>{date(x.end_date)}</td></tr>
    <tr><th>Anfangszählerstand</th><td>{num(x.meter_start)} kWh</td><th>Endzählerstand</th><td>{num(x.meter_end)} kWh</td></tr>
   </tbody></table>
   <div className={styles.energyValue}>{num(x.consumption_kwh)} kWh</div>
   {x.price_per_kwh!=null&&<table className={styles.infoTable}><tbody><tr><th>Strompreis</th><td>{num(x.price_per_kwh,2)} €/kWh</td></tr><tr><th>Errechnete Stromkosten</th><td><strong>{cost!=null?money(cost):"–"}</strong></td></tr></tbody></table>}
   <div className={styles.notice}>Dieser Nachweis dokumentiert den während der technischen Trocknung erfassten Stromverbrauch für den oben genannten Schadenfall und kann zur Vorlage beim Auftraggeber bzw. Versicherer verwendet werden.</div>
   <div className={styles.signatureGrid}><div className={styles.sigLine}>Ort, Datum</div><div className={styles.sigLine}>Unterschrift / Stempel ausführende Firma</div></div>
   <footer className={styles.footer}><span>{x.company_name}</span><span>Stromverbrauchsnachweis</span></footer>
  </article>
 </main>
}
