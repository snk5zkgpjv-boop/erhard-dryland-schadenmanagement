import Link from "next/link";
import {requirePageUser} from "@/lib/auth";
import {getSql} from "@/lib/db";
import PrintButton from "@/components/CaseFormPrintButton";
import styles from "./page.module.css";

function line(v:any){return v==null?"":String(v)}

export default async function AssignmentView({params}:{params:Promise<{id:string}>}){
 await requirePageUser(["admin","techniker","buero"]);
 const{id}=await params,sql=getSql();
 const rows=await sql`
  SELECT a.*,
   c.case_number,c.title,c.object_street,c.object_postal_code,c.object_city,c.damage_description,c.recommended_action,
   co.code company_code,co.name company_name,co.street company_street,co.postal_code company_postal_code,co.city company_city,
   co.phone,co.mobile,co.email,co.tax_number,co.logo_url,
   cu.kind customer_kind,cu.first_name,cu.last_name,cu.company_name customer_company_name,
   cu.street customer_street,cu.postal_code customer_postal_code,cu.city customer_city
  FROM assignments a
  JOIN cases c ON c.id=a.case_id
  JOIN companies co ON co.id=a.company_id
  LEFT JOIN customers cu ON cu.id=c.customer_id
  WHERE a.case_id=${id}
  ORDER BY a.created_at DESC LIMIT 1`;
 if(!rows.length)return <main className="shell"><h1>Noch keine Auftragserteilung gespeichert.</h1><Link className="back" href={`/cases/${id}`}>← Zur Schadenakte</Link></main>;
 const x:any=rows[0];
 const isCompany=x.customer_kind==="company"||Boolean(x.customer_company_name);
 const surname=isCompany?(x.customer_company_name||""):(x.last_name||"");
 const firstname=isCompany?"":(x.first_name||"");
 const scope=x.scope||x.recommended_action||x.damage_description||"Leckage & Trocknung";
 const logo=x.logo_url||(x.company_code==="DRYLAND"?"/dryland-logo.png":"/erhard-logo.png");
 return <main className={styles.screen}>
  <div className={`shell noPrint ${styles.toolbar}`}><Link className="back" href={`/cases/${id}/forms`}>← Formulare</Link><PrintButton/></div>
  <article className={styles.page}>
   <header className={styles.header}>
    <img src={logo} alt={x.company_name}/>
    <div className={styles.contact}>
     {x.company_street||""}<br/>
     {[x.company_postal_code,x.company_city].filter(Boolean).join(" ")}<br/>
     {x.phone&&<><strong>Telefon: {x.phone}</strong><br/></>}
     {x.tax_number&&<>St.Nr. {x.tax_number}</>}
    </div>
   </header>

   <h1 className={styles.mainTitle}>Auftragserteilung{x.assignment_number?` ${x.assignment_number}`:""}</h1>
   <section className={styles.orderBox}>
    <p className={styles.lead}>Hiermit erteilt Herr / Frau / Firma</p>
    <div className={styles.fields2}>
     <div className={styles.lineField}><div className={styles.value}>{line(surname)}</div><div className={styles.label}>Name</div></div>
     <div className={styles.lineField}><div className={styles.value}>{line(firstname)}</div><div className={styles.label}>Vorname</div></div>
     <div className={styles.lineField}><div className={styles.value}>{line(x.customer_street)}</div><div className={styles.label}>Straße</div></div>
     <div className={styles.lineField}><div className={styles.value}>{[x.customer_postal_code,x.customer_city].filter(Boolean).join(" ")}</div><div className={styles.label}>PLZ / Ort</div></div>
    </div>
    <p className={styles.measureLead}>den Auftrag zur Durchführung von folgenden Maßnahmen:</p>
    <div className={styles.measure}>{scope}</div>
    <div className={styles.signatureRow}><div className={styles.signatureLine}><span>Ort / Datum</span></div><div className={styles.signatureLine}><span>Unterschrift / Stempel Auftraggeber</span></div></div>
   </section>

   <h2 className={styles.sectionTitle}>Abtretungserklärung</h2>
   <section className={styles.assignmentBox}>
    <p>Der Auftraggeber und Kostenschuldner tritt erfüllungshalber den ihm aus einem Versicherungsvertrag gegenüber dem nachbezeichneten Versicherungsunternehmen zustehenden Anspruch für die beim Dienstleister in Auftrag gegebenen Arbeiten an den Dienstleister ab.</p>
    <div className={styles.insuranceBox}>
     <div className={styles.insRow}><span>Versicherung</span><b>:</b><div className={styles.insValue}>{line(x.insurer)}</div></div>
     <div className={styles.insGrid}>
      <div className={styles.insRow}><span>Straße, Nr</span><b>:</b><div className={styles.insValue}></div></div>
      <div className={styles.insRow}><span>PLZ / Ort</span><b>:</b><div className={styles.insValue}></div></div>
      <div className={styles.insRow}><span>Schaden-Nr.</span><b>:</b><div className={styles.insValue}>{line(x.claim_number)}</div></div>
      <div className={styles.insRow}><span>Vers.-Schein-Nr.</span><b>:</b><div className={styles.insValue}>{line(x.insurance_number)}</div></div>
     </div>
    </div>
    <p>Sollte die bezeichnete Versicherung die Regulierung ablehnen, wird hiermit durch die Unterschrift erklärt, dass der Auftraggeber die Forderungen des Dienstleisters an die {x.company_name}, {x.company_street||""}, {[x.company_postal_code,x.company_city].filter(Boolean).join(" ")}, ausgleichen wird. Soweit der Versicherer Netto-Zahlungen für den Versicherungsnehmer leistet, bleibt der Auftraggeber zur Zahlung verpflichtet. Diese Abtretung berührt keine anderen Forderungen im Rahmen des Versicherungsvertrages als Kostenersatz für Schadenbeseitigung. Das heißt, der Versicherungsnehmer als Auftraggeber ermächtigt die Versicherung, den in Frage stehenden Betrag gegen Vorlage der Rechnung direkt an {x.company_name} für den ausführenden Dienstleister zu überweisen. Die Rechnung wird auf den Auftraggeber / Versicherungsnehmer ausgestellt, wobei die gesetzliche Mehrwertsteuer gesondert ausgewiesen wird.</p>
    <div className={styles.signatureRow}><div className={styles.signatureLine}><span>Ort / Datum</span></div><div className={styles.signatureLine}><span>Unterschrift Abtretender / Versicherungsnehmer</span></div></div>
    <p className={styles.acceptText}>Der Dienstleister nimmt die Abtretung an:</p>
    <div className={styles.signatureRow}><div className={styles.signatureLine}><span>Ort / Datum</span></div><div className={styles.signatureLine}><span>Unterschrift / Stempel Dienstleister</span></div></div>
   </section>
  </article>
 </main>
}
