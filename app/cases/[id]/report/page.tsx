import {requirePageUser} from "@/lib/auth";import {getSql} from "@/lib/db";import PrintButton from "@/components/PrintButton";import Link from "next/link";

const MEASUREMENT_TEXT=`Das kapazitive (auch dielektrische) Messverfahren, z. B. mit Hilfe der TROTEC Sensoren T660 bzw. TS660SDI, ist eine indikative, zerstörungsfreie Feuchtigkeitsuntersuchung zur Feststellung von oberflächlichen Durchfeuchtungen bzw. Feuchteverteilungen in Baustoffen, wie z. B. Mauerwerk, Beton, Estrich, Holz, Isolierstoffe usw. Die Messung beruht auf dem Prinzip der Änderung der elektrischen Kapazität eines Materials in Abhängigkeit vom Feuchtegehalt. Das zur Kapazitätsbestimmung notwendige Messfeld bildet sich zwischen der Messkugel und der zu beurteilenden Untergrundmasse aus. Die Veränderung des elektrischen Feldes durch Material und Feuchte wird erfasst und auf der Anzeige des Messgeräts als digitaler Wert – sog. Digits – angezeigt.`;

function Header({erhard}:{erhard:boolean}){return <div className="reportHead"><img src={erhard?"/erhard-logo.png":"/dryland-logo.png"} alt="Logo"/><div className="reportContact">{erhard?<><strong>Erhard Dienstleistungen</strong><br/>Böhmerwaldstr. 15<br/>73527 Hussenhofen<br/>Tel.: 07171 / 874 18 70<br/>Mobil: 0151 / 194 970 10</>:<><strong>Dryland Trocknungstechnik</strong><br/>Gutenbergstr. 76-80<br/>D-73525 Schwäbisch Gmünd<br/>info@dryland-trocknungstechnik.de</>}</div></div>}
function Footer({page,total}:{page:number,total:number}){return <div className="reportFoot">Seite {page}/{total}</div>}
function formatGermanDate(v:any){
 if(!v)return "";
 const iso=v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);
 const m=iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}.${m[2]}.${m[1]}`:String(v);
}
function chunk<T>(arr:T[],size:number){const out:T[][]=[];for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));return out}

export default async function ReportPage({params}:{params:Promise<{id:string}>}){
 await requirePageUser();
 const{id}=await params;const sql=getSql();
 const cases=await sql`SELECT c.*,co.code company_code,co.name company_name,co.street company_street,co.postal_code company_postal_code,co.city company_city,cu.first_name,cu.last_name,cu.company_name customer_company_name,cu.street customer_street,cu.postal_code customer_postal_code,cu.city customer_city FROM cases c JOIN companies co ON co.id=c.company_id LEFT JOIN customers cu ON cu.id=c.customer_id WHERE c.id=${id}`;
 if(!cases.length)return <main className="shell"><h1>Schaden nicht gefunden</h1></main>;
 const c=cases[0] as any,erhard=c.company_code==="ERHARD";
 const reports=await sql`SELECT * FROM damage_reports WHERE case_id=${id} ORDER BY updated_at DESC LIMIT 1`;
 const dr=(reports[0]||{}) as any;
 const m=await sql`SELECT * FROM measurements WHERE case_id=${id} ORDER BY measured_at,created_at`;
 const p=await sql`SELECT * FROM photos WHERE case_id=${id} ORDER BY sort_order,created_at`;
 const objectPhoto=p.find((x:any)=>String(x.category||"").trim().toLowerCase()==="objektbild");
 const measurementPhotos=p.filter((x:any)=>String(x.category||"").trim().toLowerCase()==="messbild");
 const damagePhotos=p.filter((x:any)=>x.category==="schadensbild"||x.category==="bauteiloeffnung");
 const measurementPages=m.length?chunk(m,4):[[]];
 const photoPages=damagePhotos.length?chunk(damagePhotos,4):[[]];
 const totalPages=2+measurementPages.length+photoPages.length;
 const finalPage=2+measurementPages.length+photoPages.length;
 const customerName=c.customer_company_name||[c.first_name,c.last_name].filter(Boolean).join(" ")||"–";
 const reportDate=formatGermanDate(dr.report_date)||"–";
 const measurementDevices=Array.from(new Set(m.map((x:any)=>x.device).filter(Boolean))) as string[];
 const hasT3000=m.some((x:any)=>String(x.device||"").toLowerCase().includes("t3000"));
 const hasTS660=m.some((x:any)=>String(x.device||"").toLowerCase().includes("660")||String(x.method||"").toLowerCase().includes("kapazitiv"));
 const hasResistance=m.some((x:any)=>String(x.method||"").toLowerCase().includes("widerstand")||String(x.device||"").toLowerCase().includes("widerstand"));
 const hasCM=m.some((x:any)=>String(x.method||"").toLowerCase().includes("cm-"));
 const hasThermo=m.some((x:any)=>String(x.method||"").toLowerCase().includes("thermograf"));
 return <main style={{background:"#eef2f5",padding:"12px 0"}}>
  <div className="noPrint shell actions"><PrintButton/><Link className="button secondary" href={`/cases/${id}/report/edit`}>Schadensbericht bearbeiten</Link><Link className="button secondary" href={`/cases/${id}`}>Zur Schadenakte</Link></div>

  <section className="reportSheet">
   <Header erhard={erhard}/>
   <h1>Bericht Feuchtigkeitsmessung {reportDate}</h1>
   <h2>1. Messprojekt</h2>
   <table className="reportTable"><tbody>
    <tr><th className="subhead" colSpan={4}>Auftraggeber</th></tr>
    <tr><th>Name, Vorname</th><th>Straße Nr.</th><th>PLZ, Ort</th><th>Vers.Nr./Ref.Nr.</th></tr>
    <tr><td>{customerName}</td><td>{c.customer_street||"–"}</td><td>{[c.customer_postal_code,c.customer_city].filter(Boolean).join(" ")||"–"}</td><td>{c.reference_number||c.insurance_number||"–"}</td></tr>
    <tr><th className="subhead" colSpan={4}>Objektdaten/ Messort</th></tr>
    <tr><th>Name, Vorname</th><th>Straße Nr.</th><th>PLZ, Ort</th><th>Etage / Einheit</th></tr>
    <tr><td>{c.object_name||customerName}</td><td>{c.object_street||"–"}</td><td>{[c.object_postal_code,c.object_city].filter(Boolean).join(" ")||"–"}</td><td>{[c.floor,c.unit].filter(Boolean).join(" / ")||"–"}</td></tr>
    <tr><th className="subhead" colSpan={4}>Ausführende Firma</th></tr>
    <tr><th>Firma</th><th>Straße Nr.</th><th>PLZ, Ort</th><th></th></tr>
    <tr><td>{c.company_name}</td><td>{c.company_street||"–"}</td><td>{[c.company_postal_code,c.company_city].filter(Boolean).join(" ")}</td><td></td></tr>
    <tr><td colSpan={4}><strong>ausf. Techniker:</strong> {dr.technician||"–"}</td></tr>
    <tr><th className="subhead" colSpan={4}>Während der Messung anwesende Personen</th></tr>
    <tr><td className="preline" colSpan={4}>{dr.investigation_description||"–"}</td></tr>
    <tr><th className="subhead" colSpan={4}>Schadensursache</th></tr>
    <tr><td colSpan={4}>{c.damage_cause||"–"}</td></tr>
    <tr><th className="subhead" colSpan={4}>Anmerkungen</th></tr>
    <tr><td colSpan={4}>{c.damage_description||"–"}</td></tr>
   </tbody></table>

   <h2>2. Aufbau des Untersuchungsobjektes</h2>
   <div className="reportObjectGrid">
    <div><strong>Objektbaujahr</strong><br/>☐ unbekannt<br/>Baujahr: {dr.building_year||"–"}</div>
    <div><strong>Objekt-Typ</strong><br/>
     {dr.building_type==="Einfamilienhaus"?"☒":"☐"} Einfamilienhaus<br/>
     {dr.building_type==="Mehrfamilienhaus"?"☒":"☐"} Mehrfamilienhaus<br/>
     {dr.building_type==="Gewerbe"?"☒":"☐"} Gewerbe<br/>
     {dr.building_type==="Sonstiges"?"☒":"☐"} Sonstiges
    </div>
    <div><strong>Vorderansicht Objekt</strong>{objectPhoto?<><img src={objectPhoto.file_url} alt="Vorderansicht Objekt"/>{objectPhoto.caption?<div className="small" style={{marginTop:4}}>{objectPhoto.caption}</div>:null}</>:<div style={{padding:"30px 0",textAlign:"center"}}>Kein Objektfoto hinterlegt</div>}</div>
   </div>
   <Footer page={1} total={totalPages}/>
  </section>

  {measurementPages.map((pageMeasurements:any[],measurementPageIndex:number)=><section className="reportSheet" key={`measurement-page-${measurementPageIndex}`}>
   <Header erhard={erhard}/>
   <h2>3. Messergebnisse{measurementPages.length>1?` – Seite ${measurementPageIndex+1}`:""}</h2>
   {measurementPageIndex===0&&<>
    <table className="reportTable"><tbody><tr><th className="subhead">Messtechnik</th></tr><tr><td>
     <>
      <div>{hasT3000||m.length>0?"☒":"☐"} Trotec T3000</div>
      <div>{hasTS660?"☒":"☐"} Trotec TS 660 SDI – Messkugel / kapazitive Feuchtemessung</div>
      <div>{hasResistance?"☒":"☐"} Widerstandsmessung – Trotec T3000 mit Widerstandselektroden</div>
      <div>{hasCM?"☒":"☐"} CM-Messung</div>
      <div>{hasThermo?"☒":"☐"} Thermografie</div>
     </>
    </td></tr></tbody></table>
    <p>Durch Anwendung anerkannter Messverfahren zur Feuchteermittlung (s. Pkt. 4) konnte in/an folgenden Räumlichkeiten/Stellen verstärkte Durchfeuchtung festgestellt werden:</p>
    <p><strong>Messverfahren:</strong> {Array.from(new Set(m.map((x:any)=>x.method).filter(Boolean))).join(", ")||"Kapazitives Messverfahren"} (s. Pkt. 4)</p>
   </>}
   {pageMeasurements.length===0?<p>Keine Messwerte erfasst.</p>:pageMeasurements.map((x:any,i:number)=>{
    const absoluteIndex=measurementPageIndex*4+i;
    const mp=x.photo_id?p.find((ph:any)=>ph.id===x.photo_id):measurementPhotos[absoluteIndex];
    return <div className={mp?"reportMeasurementGrid":"reportMeasurementGrid compactMeasurement"} key={x.id} style={{marginBottom:8}}>
     <div><strong>Innenbereich</strong><br/>{x.room||"–"} {x.floor?"/ "+x.floor:""}</div>
     <div><strong>Messstelle</strong><br/>{x.component||"–"}<br/><span className="small">{x.notes||""}</span></div>
     <div><strong>Messwert</strong><br/>{x.value_numeric??"–"} {x.unit||""}<br/><span className="small">{x.assessment||""}</span></div>
     {mp?<div><strong>Messbild</strong><img src={mp.file_url} alt="Messbild"/></div>:null}
    </div>
   })}
   {measurementPageIndex===measurementPages.length-1&&<>
    <h2>4. Beschreibung der Messdurchführung</h2>
    <p>{MEASUREMENT_TEXT}</p>
    <table className="digitTable"><thead><tr><th>Werteeinordnung</th><th>Digits</th></tr></thead><tbody>
     <tr><td>trocken</td><td>&lt; 50</td></tr><tr><td>halb feucht</td><td>80</td></tr><tr><td>feucht</td><td>80 – 100</td></tr><tr><td>sehr feucht</td><td>100 – 120</td></tr><tr><td>nass</td><td>&gt;120</td></tr>
    </tbody></table>
   </>}
   <Footer page={2+measurementPageIndex} total={totalPages}/>
  </section>)}

  {photoPages.map((pagePhotos:any[],pageIndex:number)=><section className="reportSheet" key={`damage-page-${pageIndex}`}>
   <Header erhard={erhard}/>
   <h2>5. Schadensbilder{photoPages.length>1?` – Seite ${pageIndex+1}`:""}</h2>
   {pagePhotos.length===0?<p>Keine Schadensbilder erfasst.</p>:pagePhotos.map((x:any,i:number)=>{const no=pageIndex*4+i+1;return <div className="reportPhotoRow" key={x.id}>
    <div><div style={{background:"#ddd",margin:"-5px -5px 5px",padding:"3px 5px"}}>Schadensort</div><strong>{x.room||"–"}</strong>{x.component?<><br/>{x.component}</>:null}<br/><br/>{x.caption||x.ai_description||"–"}</div>
    <div><div style={{background:"#ddd",margin:"-5px -5px 5px",padding:"3px 5px"}}>Bild {no}</div><img src={x.file_url} alt={`Schadensbild ${no}`}/></div>
   </div>})}
   <Footer page={2+measurementPages.length+pageIndex} total={totalPages}/>
  </section>)}

  <section className="reportSheet">
   <Header erhard={erhard}/>
   <h2>6. Angaben zum Öffnen der eingegrenzten Stelle(n)</h2>
   <p>Mit Hilfe der unter Pkt. 4 gelisteten Detektionsverfahren konnten auffällige Stellen mit verschieden starker Durchfeuchtung gemäß Pkt. 3 detektiert werden.</p>
   <p>Basierend auf den unter Pkt. 3 festgestellten Auffälligkeiten, wurden folgende Stellen fachmännisch geöffnet und der darunter liegende Aufbau im Detail untersucht.</p>
   <p className="preline"><strong>{dr.openings_description||"Keine Bauteilöffnung dokumentiert."}</strong></p>
   <h2>7. Weitere Vorgehensweise</h2>
   <div className="preline">{dr.further_action||c.recommended_action||"–"}</div>
   <h2>8. Wichtiger Hinweis/Haftungsausschluss</h2>
   <div className="preline">{dr.disclaimer_text||"–"}</div>
   <p style={{marginTop:20}}>{c.company_city||"Schwäbisch Gmünd"}, {reportDate}</p>
   <Footer page={finalPage} total={totalPages}/>
  </section>
 </main>
}
