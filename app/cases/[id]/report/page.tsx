import {getSql} from "@/lib/db";
export default async function ReportPage({params}:{params:Promise<{id:string}>}){
  const{id}=await params;const sql=getSql();
  const cases=await sql`SELECT c.*,co.code company_code,co.name company_name,co.street company_street,co.postal_code company_postal_code,co.city company_city,co.phone company_phone,co.mobile company_mobile,co.email company_email FROM cases c JOIN companies co ON co.id=c.company_id WHERE c.id=${id}`;
  if(!cases.length)return <main className="shell"><h1>Schaden nicht gefunden</h1></main>;
  const c=cases[0] as any;
  const m=await sql`SELECT * FROM measurements WHERE case_id=${id} ORDER BY measured_at`;
  const p=await sql`SELECT * FROM photos WHERE case_id=${id} ORDER BY sort_order,created_at`;
  return <main className="shell">
    <div className="noPrint actions" style={{marginBottom:18}}><button className="button" onClick={undefined as any}>Drucken / als PDF sichern</button></div>
    <section className="hero">
      <span className="pill">{c.company_code}</span><h1>Schadensbericht / Feuchtigkeitsmessung</h1>
      <p><strong>{c.company_name}</strong><br/>{[c.company_street,[c.company_postal_code,c.company_city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}<br/>{c.company_email||""}</p>
    </section>
    <section className="card">
      <h2>1. Messprojekt</h2>
      <table className="simpleTable"><tbody>
        <tr><th>Vorgang</th><td>{c.case_number||"–"}</td><th>Schadennummer</th><td>{c.claim_number||"–"}</td></tr>
        <tr><th>Schadenort</th><td colSpan={3}>{[c.object_street,[c.object_postal_code,c.object_city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</td></tr>
        <tr><th>Schadensursache</th><td colSpan={3}>{c.damage_cause||"–"}</td></tr>
      </tbody></table>
    </section>
    <section className="card section"><h2>2. Messergebnisse</h2>
      {m.length===0?<p>Keine Messungen erfasst.</p>:<table className="simpleTable"><thead><tr><th>Raum</th><th>Bauteil</th><th>Verfahren / Gerät</th><th>Wert</th><th>Bewertung</th></tr></thead><tbody>
      {m.map((x:any)=><tr key={x.id}><td>{x.room||"–"} {x.floor||""}</td><td>{x.component||"–"}</td><td>{x.method||"–"}<br/>{x.device||""}</td><td>{x.value_numeric??"–"} {x.unit||""}</td><td>{x.assessment||x.notes||"–"}</td></tr>)}
      </tbody></table>}
    </section>
    <section className="card section"><h2>3. Schadensbilder / Messbilder</h2>
      <div className="photoGrid">{p.map((x:any)=><div className="photoCard" key={x.id}><img src={x.file_url} alt={x.caption||"Bild"}/><div className="photoBody"><strong>{x.category}</strong><br/>{x.room||""} {x.component||""}<br/>{x.caption||x.ai_description||""}</div></div>)}</div>
    </section>
    <section className="card section"><h2>4. Weitere Vorgehensweise</h2><p>{c.recommended_action||"Keine Handlungsempfehlung erfasst."}</p></section>
    <script dangerouslySetInnerHTML={{__html:`window.addEventListener('load',()=>{const b=document.querySelector('.noPrint button');if(b)b.addEventListener('click',()=>window.print())})`}}/>
  </main>
}
