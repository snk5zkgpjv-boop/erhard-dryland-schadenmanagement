import Link from "next/link";
import {requirePageUser} from "@/lib/auth";
import {getSql} from "@/lib/db";
import PrintButton from "@/components/PrintButton";
import styles from "./page.module.css";

function money(v:any){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})}
function qty(v:any){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})}
function date(v:any){return v?new Date(v).toLocaleDateString("de-DE"):""}
function period(a:any,b:any){const x=date(a),y=date(b);return x&&y&&x!==y?`${x} – ${y}`:x||y||""}
function inferGroup(x:any){
 const c=String(x.category||"").trim();
 if(c&&!/Excel|Dederer|AXA|Standardleistung|eigene/i.test(c))return c;
 const s=String(x.description||"").toLowerCase();
 if(/trocknung|trockner|adsorption|klima/.test(s))return "Trocknung/Geräteeinsatz";
 if(/folienwand|raumtrennung|abtrennung/.test(s))return "Raumtrennung";
 if(/rapport|stundenbasis|arbeitsstunde/.test(s))return "Rapportarbeiten";
 if(/an\/abfahrt|anfahrt|fahrzeug/.test(s))return "Fahrzeugkostenanteil";
 return "Sonstige Leistungen";
}
function itemMm(x:any){
 const text=String(x.description||"").replace(/\n+/g," ").trim();
 const lines=Math.max(1,Math.ceil(text.length/74));
 return 5.0+lines*3.45;
}
function groupMm(g:any){return 6.2+g.items.reduce((s:number,x:any)=>s+itemMm(x),0)+6.2}
function paginate(groups:any[]){
 const pages:any[][]=[];let page:any[]=[],used=0;
 const firstCap=143,otherCap=226;
 let cap=firstCap;
 for(const g of groups){
  const gh=groupMm(g);
  if(page.length&&used+gh>cap){pages.push(page);page=[];used=0;cap=otherCap}
  if(gh<=cap-used){page.push(g);used+=gh;continue}
  let part:any[]=[];
  for(const item of g.items){
   const ih=itemMm(item),overhead=12.4;
   const partH=overhead+part.reduce((s:number,x:any)=>s+itemMm(x),0);
   if(part.length&&used+partH+ih>cap){
    page.push({name:g.name,items:part,continued:true});pages.push(page);
    page=[];used=0;cap=otherCap;part=[]
   }
   part.push(item)
  }
  if(part.length){page.push({name:g.name,items:part,continued:false});used+=12.4+part.reduce((s:number,x:any)=>s+itemMm(x),0)}
 }
 if(page.length)pages.push(page);
 return pages.length?pages:[[]]
}

export default async function DocumentView({params}:{params:Promise<{id:string}>}){
 await requirePageUser(["admin","buero"]);const{id}=await params,sql=getSql();
 const rows=await sql`SELECT d.*,
   co.code company_code,co.name company_name,co.legal_name,co.street company_street,co.postal_code company_postal_code,co.city company_city,
   co.phone,co.mobile,co.email,co.tax_number,co.vat_id,co.iban,co.bic,co.bank_name,co.logo_url,co.footer_json,
   c.title case_title,c.case_number,c.reference_number,c.claim_number,c.object_name,c.object_street,c.object_postal_code,c.object_city,
   cu.first_name customer_first_name,cu.last_name customer_last_name,cu.company_name customer_company_name,
   cu.street customer_street,cu.postal_code customer_postal_code,cu.city customer_city
  FROM documents d JOIN companies co ON co.id=d.company_id
  LEFT JOIN cases c ON c.id=d.case_id LEFT JOIN customers cu ON cu.id=c.customer_id
  WHERE d.id=${id} LIMIT 1`;
 if(!rows.length)return <main className="shell"><h1>Dokument nicht gefunden</h1></main>;
 const d:any=rows[0],raw=await sql`SELECT * FROM document_items WHERE document_id=${id} ORDER BY sort_order,created_at`;
 const customer=d.customer_company_name||[d.customer_first_name,d.customer_last_name].filter(Boolean).join(" ")||"–";
 const map=new Map<string,any[]>();for(const x of raw as any[]){const g=inferGroup(x);if(!map.has(g))map.set(g,[]);map.get(g)!.push(x)}
 const groups=[...map].map(([name,items])=>({name,items})),pages=paginate(groups);
 const logo=d.logo_url||(d.company_code==="DRYLAND"?"/dryland-logo.png":"/erhard-logo.png"),footer=d.footer_json||{};
 const isInvoice=d.document_type==="rechnung",title=isInvoice?`Rechnung ${d.document_number||""}`:`Angebot ${d.document_number||""}`;
 const servicePeriod=period(d.service_period_from,d.service_period_to),editor=footer.default_editor||"";
 const deliveryName=d.delivery_name||d.object_name||d.case_title||"";
 const deliveryStreet=d.delivery_street||d.object_street||"";
 const deliveryPlace=[d.delivery_postal_code||d.object_postal_code,d.delivery_city||d.object_city].filter(Boolean).join(" ");
 const reference=String(d.reference_number||"").trim();
 let carry=0;
 return <main className={styles.screen}>
  <div className={`shell noPrint ${styles.toolbar}`}><Link className="back" href={`/documents/${id}`}>← Bearbeiten</Link><PrintButton/></div>
  {pages.map((pg:any[],pi:number)=>{
   const pageNet=pg.reduce((s:number,g:any)=>s+g.items.reduce((q:number,x:any)=>q+Number(x.line_total||0),0),0),prior=carry;carry+=pageNet;
   const last=pi===pages.length-1;
   return <article className={styles.page} key={pi}>
    {pi===0?<><header className={styles.header}><img src={logo} alt={d.company_name}/><div className={styles.rule}/></header>
     <section className={styles.address}><div className={styles.sender}>{d.company_name} • {d.company_street||""} • {[d.company_postal_code,d.company_city].filter(Boolean).join(" ")}</div><div className={styles.recipient}><strong>{customer}</strong><br/>{d.customer_street||""}<br/>{[d.customer_postal_code,d.customer_city].filter(Boolean).join(" ")}</div></section>
     <section className={styles.docHead}>
      <div className={styles.titleBlock}><h1>{title}</h1>{reference&&<div className={styles.reference}>Referenz: {reference}</div>}{d.case_number&&<div className={styles.projectRef}>Projekt-Nr.: {d.case_number}</div>}{d.claim_number&&<div className={styles.projectRef}>Schaden-Nr.: {d.claim_number}</div>}</div>
      <div className={styles.meta}>
       <div className={styles.metaRow}><span>Datum</span><strong>{date(d.document_date)}</strong></div>
       {servicePeriod&&<div className={styles.metaRow}><span>Leistungszeitraum</span><strong>{servicePeriod}</strong></div>}
       {editor&&<div className={styles.metaRow}><span>Bearbeiter</span><strong>{editor}</strong></div>}
       {(deliveryName||deliveryStreet||deliveryPlace)&&<div className={`${styles.metaRow} ${styles.deliveryRow}`}><span>Leistungsort</span><strong>{deliveryName&&<>{deliveryName}<br/></>}{deliveryStreet&&<>{deliveryStreet}<br/></>}{deliveryPlace}</strong></div>}
      </div>
     </section>
     <p className={styles.intro}>{isInvoice?"für die Erledigung der von Ihnen beauftragten Tätigkeiten berechnen wir Ihnen wie folgt:":"für die von Ihnen angefragten Leistungen erlauben wir uns wie folgt anzubieten:"}</p>
    </>:<div className={styles.carryTop}>Übertrag: € {money(prior)}</div>}
    <table className={styles.table}><thead><tr><th className={styles.pos}>Pos</th><th>Beschreibung</th><th className={styles.price}>Einzelpreis €</th><th className={styles.amount}>Menge</th><th className={styles.sum}>Summe €</th></tr></thead>
     <tbody>{pg.map((g:any,gi:number)=><Group key={`${g.name}-${gi}`} g={g} groupNo={groups.findIndex(x=>x.name===g.name)+1}/>)}</tbody>
     {!last&&<tfoot><tr className={styles.transfer}><td></td><td></td><td colSpan={2}>Übertrag</td><td>€ {money(carry)}</td></tr></tfoot>}
    </table>
    {last&&<><section className={styles.totals}><div><span>Netto</span><strong>{money(d.net_total)}</strong></div>{!d.reverse_charge&&<div><span>{Number(d.vat_total||0)>0?"19% MwSt":"MwSt"}</span><strong>{money(d.vat_total)}</strong></div>}<div className={styles.grand}><span>Gesamtbetrag €</span><strong>{money(d.gross_total)}</strong></div></section>
     {isInvoice&&<section className={styles.payment}><p>Zahlbar sofort und ohne Abzug.</p>{d.document_number&&<p>Bei Überweisung mittels Internet-Banking tragen Sie bitte im Feld "Verwendungszweck"<br/>die Rechnungsnummer {d.document_number} ein.</p>}</section>}</>}
    <footer className={styles.footer}><div>Kontoinhaber: {footer.account_holder||d.company_name}<br/>IBAN: {d.iban||""}<br/>BIC: {d.bic||""}<br/>Steuernummer: {d.tax_number||""}</div><div className={styles.pageNo}>Seite {pi+1} von {pages.length}</div><div className={styles.footerRight}><strong>{d.company_name}</strong><br/>{d.company_street||""}<br/>{[d.company_postal_code,d.company_city].filter(Boolean).join(" ")}<br/>{d.phone&&<>Tel.: {d.phone}<br/></>}{d.mobile&&<>Mobil: {d.mobile}</>}</div></footer>
   </article>
  })}
 </main>
}
function Group({g,groupNo}:{g:any,groupNo:number}){
 const subtotal=g.items.reduce((s:number,x:any)=>s+Number(x.line_total||0),0);
 return <><tr className={styles.group}><td colSpan={5}>{g.name}{g.continued?" (Fortsetzung)":""}</td></tr>{g.items.map((x:any,i:number)=><tr key={x.id||i} className={styles.item}><td>{groupNo}.{i+1}</td><td><strong>{String(x.description||"").split("\n")[0]}</strong>{String(x.description||"").includes("\n")&&<div className={styles.details}>{String(x.description).split("\n").slice(1).join("\n")}</div>}</td><td className={styles.num}>{money(x.unit_price)}</td><td className={styles.num}>{qty(x.quantity)} {x.unit||""}</td><td className={styles.num}>{money(x.line_total)}</td></tr>)}<tr className={styles.subtotal}><td colSpan={4}>Zwischensumme {g.name}</td><td>€ {money(subtotal)}</td></tr></>
}
