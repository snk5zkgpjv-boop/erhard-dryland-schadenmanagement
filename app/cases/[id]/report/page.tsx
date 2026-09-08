import {requirePageUser} from "@/lib/auth";import {getSql} from "@/lib/db";import PrintButton from "@/components/PrintButton";

const MEASUREMENT_TEXT=`Das kapazitive (auch dielektrische) Messverfahren, z. B. mit Hilfe der TROTEC Sensoren T660 bzw. TS660SDI, ist eine indikative, zerstörungsfreie Feuchtigkeitsuntersuchung zur Feststellung von oberflächlichen Durchfeuchtungen bzw. Feuchteverteilungen in Baustoffen, wie z. B. Mauerwerk, Beton, Estrich, Holz, Isolierstoffe usw. Die Messung beruht auf dem Prinzip der Änderung der elektrischen Kapazität eines Materials in Abhängigkeit vom Feuchtegehalt. Das zur Kapazitätsbestimmung notwendige Messfeld bildet sich zwischen der Messkugel und der zu beurteilenden Untergrundmasse aus. Die Veränderung des elektrischen Feldes durch Material und Feuchte wird erfasst und auf der Anzeige des Messgeräts als digitaler Wert – sog. Digits – angezeigt.`;

function Header({erhard}:{erhard:boolean}){return <div className="reportHead"><img src={erhard?"/erhard-logo.png":"/dryland-logo.png"} alt="Logo"/><div className="reportContact">{erhard?<><strong>Erhard Dienstleistungen</strong><br/>Böhmerwaldstr. 15<br/>73527 Hussenhofen<br/>Tel.: 07171 / 874 18 70<br/>Mobil: 0151 / 194 970 10</>:<><strong>Dryland Trocknungstechnik</strong><br/>Gutenbergstr. 76-80<br/>D-73525 Schwäbisch Gmünd<br/>info@dryland-trocknungstechnik.de</>}</div></div>}
function Footer({page,total=4}:{page:number,total?:number}){return <div className="reportFoot">Seite {page}/{total}</div>}

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
 const objectPhoto=p.find((x:any)=>x.category==="objektbild");
 const measurementPhotos=p.filter((x:any)=>x.category==="messbild");
 const damagePhotos=p.filter((x:any)=>x.category==="schadensbild"||x.category==="bauteiloeffnung");
 const customerName=c.customer_company_name||[c.first_name,c.last_name].filter(Boolean).join(" ")||"–";
 const reportDate=dr.report_date?new Date(dr.report_date).toLocaleDateString("de-DE"):new Date().toLocaleDateString("de-DE");
 const measurementDevices=Array.from(new Set(m.map((x:any)=>x.device).filter(Boolean))) as string[];
 return <main style={{background:"#eef2f5",padding:"12px 0"}}>
  <div className="noPrint shell actions"><PrintButton/></div>

  <section className="reportSheet">
   <Header erhard={erhard}/>
   <h1>Bericht Feuchtigkeitsmessung {reportDate}</h1>
   <h2>1. Messprojekt</h2>
   <table className="reportTable"><tbody>
    <tr><th className="subhead" colSpan={4}>Auftraggeber</th></tr>
    <tr><th>Name, Vorname</th><th>Straße Nr.</th><th>PLZ, Ort</th><th>Vers.Nr./Ref.Nr.</th></tr>
    <tr><td>{customerName}</td><td>{c.customer_street||"–"}</td><td>{[c.customer_postal_code,c.customer_city].filter(Boolean).join(" ")||"–"}</td><td>{c.reference_number||c.insurance_number||"–"}</td></tr>
    <tr><th className="subhead" colSpan={4}>Objektdaten/ Messort</th></tr>
    <tr><th>Name, Vorname</th><th>Straße Nr.</th><th>PLZ, Ort</th><th></th></tr>
    <tr><td>{c.object_name||customerName}</td><td>{c.object_street||"–"}</td><td>{[c.object_postal_code,c.object_city].filter(Boolean).join(" ")||"–"}</td><td></td></tr>
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
    <div><strong>Objekt-Typ</strong><br/>☐ Einfamilienhaus<br/>☐ Mehrfamilienhaus<br/>☐ Gewerbe<br/>☐ Sonstiges<br/><br/><strong>Ausgewählt:</strong> {dr.building_type||"–"}</div>
    <div><strong>Vorderansicht Objekt</strong>{objectPhoto?<img src={objectPhoto.file_url} alt="Vorderansicht Objekt"/>:<div style={{padding:"30px 0",textAlign:"center"}}>Kein Objektfoto hinterlegt</div>}</div>
   </div>
   <Footer page={1}/>
  </section>

  <section className="reportSheet">
   <Header erhard={erhard}/>
   <h2>3. Messergebnisse</h2>
   <table className="reportTable"><tbody><tr><th className="subhead">Messtechnik</th></tr><tr><td>
    {measurementDevices.length?measurementDevices.map(d=><div key={d}>☒ {d}</div>):<><div>☐ Trotec T 3000</div><div>☐ Trotec T 660 SDI</div><div>☐ Trotec TS 016/300 Flach-Elektrodenpaar, isoliert</div></>}
   </td></tr></tbody></table>
   <p>Durch Anwendung anerkannter Messverfahren zur Feuchteermittlung (s. Pkt. 4) konnte in/an folgenden Räumlichkeiten/Stellen verstärkte Durchfeuchtung festgestellt werden:</p>
   <p><strong>Messverfahren:</strong> {m[0]?.method||"Kapazitives Messverfahren"} (s. Pkt. 4)</p>
   {m.length===0?<p>Keine Messwerte erfasst.</p>:m.map((x:any,i:number)=><div className="reportMeasurementGrid" key={x.id} style={{marginBottom:8}}>
    <div><strong>Innenbereich</strong><br/>{x.room||"–"} {x.floor?"/ "+x.floor:""}</div>
    <div><strong>Messstelle</strong><br/>☐ Wand ☐ Boden ☐ Decke<br/><br/>{x.component||"–"}<br/>{x.notes||""}</div>
    <div><strong>[digits]</strong><br/>{x.value_numeric??"–"} {x.unit&&x.unit!=="digits"?x.unit:""}</div>
    <div><strong>Messbilder</strong>{measurementPhotos[i]?<img src={measurementPhotos[i].file_url} alt="Messbild"/>:<div style={{padding:"20px 0"}}>–</div>}</div>
   </div>)}
   <h2>4. Beschreibung der Messdurchführung</h2>
   <p>{MEASUREMENT_TEXT}</p>
   <table className="digitTable"><thead><tr><th>Werteeinordnung</th><th>Digits</th></tr></thead><tbody>
    <tr><td>trocken</td><td>&lt; 50</td></tr><tr><td>halb feucht</td><td>80</td></tr><tr><td>feucht</td><td>80 – 100</td></tr><tr><td>sehr feucht</td><td>100 – 120</td></tr><tr><td>nass</td><td>&gt;120</td></tr>
   </tbody></table>
   <Footer page={2}/>
  </section>

  <section className="reportSheet">
   <Header erhard={erhard}/>
   <h2>5. Schadensbilder</h2>
   {damagePhotos.length===0?<p>Keine Schadensbilder erfasst.</p>:damagePhotos.slice(0,4).map((x:any,i:number)=><div className="reportPhotoRow" key={x.id}>
    <div><div style={{background:"#ddd",margin:"-5px -5px 5px",padding:"3px 5px"}}>Schadensort</div><strong>{x.room||"–"}</strong><br/><br/>{x.caption||x.ai_description||x.component||"–"}</div>
    <div><div style={{background:"#ddd",margin:"-5px -5px 5px",padding:"3px 5px"}}>Bild {i+1}</div><img src={x.file_url} alt={`Schadensbild ${i+1}`}/></div>
   </div>)}
   <Footer page={3}/>
  </section>

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
   <Footer page={4}/>
  </section>
 </main>
}
