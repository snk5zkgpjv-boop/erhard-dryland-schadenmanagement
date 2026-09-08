import {getSql} from "@/lib/db";
function txt(v:unknown){const t=typeof v==="string"?v.trim():"";return t===""?null:t}

const STANDARD_FURTHER_ACTION=`Massive Tiefenfeuchte

Die Ursache des Feuchteeintrages muss vor Beginn der Trocknungsarbeiten behoben werden (z. B. Rohrbruch, Flachdach-Leckage, undichte Kellerwand etc.).

Massive, nicht zu hinterlüftende Objekte wie Massivbauwände, Betondecken usw. sind über einen Zeitraum von 21 Tagen Regeltrocknungszeit mittels geeigneter Gerätschaften, wie z. B. Kondenstrocknern, Ventilatoren, Heizern (oder deren kombiniertem Einsatz) abzutrocknen. Ggf. vorhandener Schimmelbefall ist fachmännisch zu entfernen!

Falls nach der Regeltrocknungszeit von 21 Tagen das Bauwerk nach der Endmessung noch Feuchtigkeit enthält wird die Trocknung fortgesetzt.

Abhängig von der Unterbaukonstruktion des Bodens bzw. der Wand, muss diese ggf. geöffnet werden, sofern im Zuge der Leckage-Ortung nicht bereits geschehen. Erst dann lässt sich sagen, ob eine Unter-/Hinterlüftung möglich und sinnig ist. Danach erfolgt die Trocknung der Unterboden bzw. Wandkonstruktion im Unterdruckverfahren mithilfe speziell dafür konzipierter Gerätschaften, um eine Kontaminierung der Umgebung mit möglichen Schadstoffen zu vermeiden.

Der Trocknungsfortschritt wird regelmäßig überwacht.`;

const STANDARD_DISCLAIMER=`Trotz des sorgfältigen und ordnungsgemäßen Einsatzes der oben aufgeführten Messgeräte kann es auf Grund physikalischer Gegebenheiten (z. B. thermisches Leck) zu fehlerhaften Messergebnissen kommen. Ein Untersuchungserfolg in dem Sinne, dass alle Fehl-/Leckstellen erkannt wurden, kann daher nicht garantiert werden.

Empfehlen wir im oben aufgeführten Messprotokoll oder durch unseren Mitarbeiter die Durchführung weiterer Maßnahmen zur Ortung der Fehl-/ Schadstelle, ist dieser Empfehlung daher unbedingt zu folgen, andernfalls können wir keine Haftung für Schäden, die auf unser Messergebnis zurückzuführen sind, übernehmen. Wir haften ebenso nicht für Schäden, die darauf zurückzuführen sind, dass der Auftraggeber ohne vorherige Abstimmung mit uns eigene Ursachenermittlung betreibt oder Schadensbeseitigungsmaßnahmen ergreift.`;

export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params;const sql=getSql();
    const rows=await sql`SELECT * FROM damage_reports WHERE case_id=${id} ORDER BY updated_at DESC LIMIT 1`;
    if(rows.length) return Response.json(rows[0]);
    const c=await sql`SELECT company_id FROM cases WHERE id=${id} LIMIT 1`;
    if(!c.length)return Response.json({error:"Schaden nicht gefunden."},{status:404});
    return Response.json({
      case_id:id,company_id:c[0].company_id,report_date:new Date().toISOString().slice(0,10),
      technician:"",building_year:"unbekannt",building_type:"Mehrfamilienhaus",
      investigation_description:"",openings_description:"",
      further_action:STANDARD_FURTHER_ACTION,disclaimer_text:STANDARD_DISCLAIMER,status:"entwurf"
    });
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Berichtsdaten konnten nicht geladen werden."},{status:500})}
}

export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{id}=await params;const b=await r.json();const sql=getSql();
    const c=await sql`SELECT company_id FROM cases WHERE id=${id} LIMIT 1`;if(!c.length)return Response.json({error:"Schaden nicht gefunden."},{status:404});
    const existing=await sql`SELECT id FROM damage_reports WHERE case_id=${id} ORDER BY updated_at DESC LIMIT 1`;
    if(existing.length){
      const rows=await sql`UPDATE damage_reports SET
        report_number=${txt(b.report_number)},report_date=COALESCE(${txt(b.report_date)}::date,CURRENT_DATE),
        technician=${txt(b.technician)},building_year=${txt(b.building_year)},building_type=${txt(b.building_type)},
        investigation_description=${txt(b.investigation_description)},openings_description=${txt(b.openings_description)},
        further_action=${txt(b.further_action)},disclaimer_text=${txt(b.disclaimer_text)},updated_at=now()
        WHERE id=${existing[0].id} RETURNING id`;
      return Response.json({id:rows[0].id})
    }
    const rows=await sql`INSERT INTO damage_reports(case_id,company_id,report_number,report_date,technician,building_year,building_type,investigation_description,openings_description,further_action,disclaimer_text,status)
      VALUES(${id},${c[0].company_id},${txt(b.report_number)},COALESCE(${txt(b.report_date)}::date,CURRENT_DATE),${txt(b.technician)},${txt(b.building_year)},${txt(b.building_type)},${txt(b.investigation_description)},${txt(b.openings_description)},${txt(b.further_action)},${txt(b.disclaimer_text)},'entwurf') RETURNING id`;
    return Response.json({id:rows[0].id},{status:201})
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Berichtsdaten konnten nicht gespeichert werden."},{status:500})}
}
