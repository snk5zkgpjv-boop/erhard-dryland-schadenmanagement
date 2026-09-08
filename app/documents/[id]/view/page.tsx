import Link from "next/link";import {requirePageUser} from "@/lib/auth";import {getSql} from "@/lib/db";import PrintButton from "@/components/PrintButton";
function money(v:any){return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"}function date(v:any){if(!v)return "–";return new Date(v).toLocaleDateString("de-DE")}
export default async function DocumentView({params}:{params:Promise<{id:string}>}){
 await requirePageUser(["admin","buero"]);const{id}=await params,sql=getSql();
 const rows=await sql`SELECT d.*,co.*,co.id company_record_id,c.title case_title,c.object_street,c.object_postal_code,c.object_city,
 cu.first_name customer_first_name,cu.last_name customer_last_name,cu.company_name customer_company_name,cu.street customer_street,cu.postal_code customer_postal_code,cu.city customer_city
 FROM documents d JOIN companies co ON co.id=d.company_id LEFT JOIN cases c ON c.id=d.case_id LEFT JOIN customers cu ON cu.id=c.customer_id WHERE d.id=${id} LIMIT 1`;
 if(!rows.length)return <main className="shell"><h1>Dokument nicht gefunden</h1></main>;const d:any=rows[0],items=await sql`SELECT * FROM document_items WHERE document_id=${id} ORDER BY sort_order,created_at`;
 const cust=d.customer_company_name||[d.customer_first_name,d.customer_last_name].filter(Boolean).join(" ")||"–",type=d.document_type==="rechnung"?"Rechnung":"Angebot";
 return <main style={{background:"#eef2f5",padding:"16px 0"}}><div className="shell noPrint actions"><Link className="back" href={`/documents/${id}`}>← Bearbeiten</Link><PrintButton/></div>
  <section className="documentSheet"><div className="documentHeader"><img src={d.code==="DRYLAND"?"/dryland-logo.png":"/erhard-logo.png"} alt="Logo"/><div><strong>{d.name}</strong><br/>{d.street||""}<br/>{[d.postal_code,d.city].filter(Boolean).join(" ")}<br/>{d.email||""}</div></div>
   <div className="docAddress"><strong>{cust}</strong><br/>{d.customer_street||d.object_street||""}<br/>{[d.customer_postal_code||d.object_postal_code,d.customer_city||d.object_city].filter(Boolean).join(" ")}</div>
   <div className="docTitleRow"><div><h1>{type}</h1><p>{d.title||d.case_title||""}</p></div><table><tbody><tr><th>Nummer</th><td>{d.document_number||"–"}</td></tr><tr><th>Datum</th><td>{date(d.document_date)}</td></tr><tr><th>Status</th><td>{d.status}</td></tr></tbody></table></div>
   <table className="documentItems"><thead><tr><th>Pos.</th><th>Beschreibung</th><th className="num">Menge</th><th>Einheit</th><th className="num">Einzelpreis</th><th className="num">Gesamt</th></tr></thead><tbody>{items.map((x:any)=><tr key={x.id}><td>{x.position_no}</td><td>{x.description}</td><td className="num">{Number(x.quantity).toLocaleString("de-DE")}</td><td>{x.unit}</td><td className="num">{money(x.unit_price)}</td><td className="num">{money(x.line_total)}</td></tr>)}</tbody></table>
   <div className="docTotals"><div><span>Netto</span><strong>{money(d.net_total)}</strong></div><div><span>USt.</span><strong>{money(d.vat_total)}</strong></div><div className="grand"><span>Gesamt</span><strong>{money(d.gross_total)}</strong></div></div>
   <div className="documentFooter">{d.iban?<>Bankverbindung: {d.bank||""} · IBAN {d.iban}{d.bic?` · BIC ${d.bic}`:""}<br/></>:null}{d.tax_number?<>Steuernr.: {d.tax_number}</>:null}</div>
  </section></main>
}
