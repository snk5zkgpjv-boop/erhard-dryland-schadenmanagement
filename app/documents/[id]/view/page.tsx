import Link from "next/link";
import {requirePageUser} from "@/lib/auth";
import {getSql} from "@/lib/db";
import PrintButton from "@/components/PrintButton";
import styles from "./page.module.css";

function money(v:any){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"}
function qty(v:any){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})}
function date(v:any){if(!v)return "";return new Date(v).toLocaleDateString("de-DE")}
function period(a:any,b:any){
 const da=date(a),db=date(b);
 if(da&&db&&da!==db)return `${da} - ${db}`;
 return da||db||"";
}

export default async function DocumentView({params}:{params:Promise<{id:string}>}){
 await requirePageUser(["admin","buero"]);
 const{id}=await params,sql=getSql();

 const rows=await sql`
   SELECT d.*,
          co.code AS company_code,co.name AS company_name,co.legal_name,
          co.street AS company_street,co.postal_code AS company_postal_code,co.city AS company_city,
          co.phone,co.mobile,co.email,co.tax_number,co.vat_id,co.iban,co.bic,co.bank,
          c.title case_title,c.object_street,c.object_postal_code,c.object_city,
          cu.first_name customer_first_name,cu.last_name customer_last_name,cu.company_name customer_company_name,
          cu.street customer_street,cu.postal_code customer_postal_code,cu.city customer_city
   FROM documents d
   JOIN companies co ON co.id=d.company_id
   LEFT JOIN cases c ON c.id=d.case_id
   LEFT JOIN customers cu ON cu.id=c.customer_id
   WHERE d.id=${id} LIMIT 1`;
 if(!rows.length)return <main className="shell"><h1>Dokument nicht gefunden</h1></main>;

 const d:any=rows[0];
 const items=await sql`SELECT * FROM document_items WHERE document_id=${id} ORDER BY sort_order,created_at`;
 const customer=d.customer_company_name||[d.customer_first_name,d.customer_last_name].filter(Boolean).join(" ")||"–";
 const isInvoice=d.document_type==="rechnung";
 const documentTitle=isInvoice?`Rechnung ${d.document_number||""}`:`Angebot Nr. ${d.document_number||""}`;
 const servicePeriod=period(d.service_period_from,d.service_period_to);
 const deliveryStreet=d.delivery_street||d.object_street||"";
 const deliveryPostal=d.delivery_postal_code||d.object_postal_code||"";
 const deliveryCity=d.delivery_city||d.object_city||"";
 const hasDelivery=Boolean(d.delivery_name||deliveryStreet||deliveryPostal||deliveryCity);

 return <main className={styles.screen}>
   <div className={`shell noPrint ${styles.actions}`}><Link className="back" href={`/documents/${id}`}>← Bearbeiten</Link><PrintButton/></div>

   <article className={styles.sheet}>
    <header className={styles.header}>
      <img className={styles.logo} src={d.company_code==="DRYLAND"?"/dryland-logo.png":"/erhard-logo.png"} alt={d.company_name}/>
      <div className={styles.headerLine}/>
    </header>

    <section className={styles.addressArea}>
      <div className={styles.billing}>
       <div className={styles.senderLine}>
        {d.company_name} | {d.company_street||""} | {[d.company_postal_code,d.company_city].filter(Boolean).join(" ")}
       </div>
       <div className={styles.recipient}>
        <strong>{customer}</strong><br/>
        {d.customer_street||""}<br/>
        {[d.customer_postal_code,d.customer_city].filter(Boolean).join(" ")}
       </div>
      </div>

      <aside className={styles.metaTop}>
       {hasDelivery&&<div className={styles.delivery}>
         <strong>Liefer-/Leistungsadresse:</strong><br/>
         {d.delivery_name&&<>{d.delivery_name}<br/></>}
         {deliveryStreet}<br/>
         {[deliveryPostal,deliveryCity].filter(Boolean).join(" ")}
       </div>}
       <div className={styles.metaDate}>
        {isInvoice&&<><strong>Datum:</strong> {date(d.document_date)}<br/>{servicePeriod&&<><strong>Leistungszeitraum:</strong> {servicePeriod}<br/></>}</>}
        {!isInvoice&&<>{date(d.document_date)}</>}
       </div>
      </aside>
    </section>

    {!isInvoice&&<p className={styles.introStrong}>Herzlichen Dank für Ihr Interesse an unseren Produkten und Dienstleistungen. Wir erlauben uns wie folgt anzubieten:</p>}

    <section className={styles.titleArea}>
      <div>
       <h1>{documentTitle}</h1>
       {d.title&&<div className={styles.subject}>{d.title}</div>}
      </div>
      {isInvoice&&<div className={styles.invoiceMeta}>
        <div><span>Datum:</span><strong>{date(d.document_date)}</strong></div>
        {servicePeriod&&<div><span>Leistungszeitraum:</span><strong>{servicePeriod}</strong></div>}
        {hasDelivery&&<div><span>Leistungsadresse:</span><strong>{[deliveryStreet,[deliveryPostal,deliveryCity].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</strong></div>}
      </div>}
    </section>

    {isInvoice&&<p className={styles.invoiceIntro}>für die Erledigung der von Ihnen beauftragten Tätigkeiten berechnen wir Ihnen wie folgt:</p>}

    <table className={styles.items}>
      <thead>
       <tr>
        <th className={styles.pos}>Pos.</th>
        <th>Beschreibung</th>
        <th className={styles.price}>Einzelpreis €</th>
        <th className={styles.amount}>Menge</th>
        <th className={styles.sum}>Summe €</th>
       </tr>
      </thead>
      <tbody>
       {items.map((x:any,i:number)=><tr key={x.id}>
         <td className={styles.pos}>{i+1}</td>
         <td className={styles.description}>{x.description}</td>
         <td className={styles.price}>{money(x.unit_price)}</td>
         <td className={styles.amount}>{qty(x.quantity)} {x.unit||""}</td>
         <td className={styles.sum}>{money(x.line_total)}</td>
       </tr>)}
      </tbody>
    </table>

    <section className={styles.totals}>
      <div><span>Netto</span><strong>{money(d.net_total)}</strong></div>
      {!d.reverse_charge&&<div><span>USt.</span><strong>{money(d.vat_total)}</strong></div>}
      <div className={styles.totalGrand}><span>Gesamtbetrag</span><strong>{money(d.gross_total)}</strong></div>
    </section>

    {isInvoice&&d.reverse_charge&&<section className={styles.paymentText}>
      <p>Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG.</p>
      <p>Gemäß § 13b Abs. 2 Nr. 4 UStG ist der Leistungsempfänger Steuerschuldner. In dieser Rechnung wird deshalb keine Umsatzsteuer ausgewiesen.</p>
    </section>}

    {isInvoice&&<section className={styles.paymentText}>
      <p>Zahlbar sofort und ohne Abzug.</p>
      {d.document_number&&<p>Bei Überweisung tragen Sie bitte im Verwendungszweck die Rechnungsnummer {d.document_number} ein.</p>}
    </section>}

    <footer className={styles.footer}>
      <div>
       {d.iban&&<>Kontoinhaber: {d.company_name}<br/>IBAN: {d.iban}<br/></>}
       {d.bic&&<>BIC: {d.bic}<br/></>}
       {d.tax_number&&<>Steuernummer: {d.tax_number}</>}
      </div>
      <div className={styles.pageNo}>Seite 1</div>
      <div className={styles.footerRight}>
       <strong>{d.company_name}</strong><br/>
       {d.company_street||""}<br/>
       {[d.company_postal_code,d.company_city].filter(Boolean).join(" ")}<br/>
       {d.phone&&<>Tel.: {d.phone}<br/></>}
       {d.mobile&&<>Mobil: {d.mobile}<br/></>}
       {d.email&&<>E-Mail: {d.email}</>}
      </div>
    </footer>
   </article>
 </main>
}
