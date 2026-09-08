type SequenceType="project"|"offer"|"invoice"|"assignment";

function yearFrom(v?:string|number|Date|null){
 if(typeof v==="number"&&Number.isInteger(v))return v;
 if(v instanceof Date)return v.getFullYear();
 if(typeof v==="string"&&/^\d{4}/.test(v))return Number(v.slice(0,4));
 return new Date().getFullYear();
}
function typeDefaults(type:SequenceType){
 if(type==="assignment")return {prefix:"AE",format:"{PREFIX}-{YEAR}-{NUMBER}",width:3};
 return {prefix:"",format:"{YEAR}-{NUMBER}",width:3};
}
async function existingCurrent(sql:any,companyId:string,type:SequenceType,year:number){
 if(type==="offer"||type==="invoice"){
  const docType=type==="offer"?"angebot":"rechnung";
  const rows=await sql`
   SELECT COALESCE(MAX(
    CASE WHEN document_number ~ ${`^${year}-[0-9]+$`}
      THEN split_part(document_number,'-',2)::integer ELSE NULL END
   ),0)::integer AS n
   FROM documents
   WHERE company_id=${companyId} AND document_type=${docType}`;
  return Number(rows[0]?.n||0)
 }
 if(type==="assignment"){
  const rows=await sql`
   SELECT COALESCE(MAX(
    CASE WHEN assignment_number ~ ${`^AE-${year}-[0-9]+$`}
      THEN split_part(assignment_number,'-',3)::integer ELSE NULL END
   ),0)::integer AS n
   FROM assignments WHERE company_id=${companyId}`;
  return Number(rows[0]?.n||0)
 }
 const rows=await sql`
  SELECT COALESCE(MAX(
   CASE WHEN case_number ~ ${`^${year}-[0-9]+$`}
     THEN split_part(case_number,'-',2)::integer ELSE NULL END
  ),0)::integer AS n
  FROM cases WHERE company_id=${companyId}`;
 return Number(rows[0]?.n||0)
}
function render(pattern:string,prefix:string,year:number,n:number,width:number){
 const number=String(n).padStart(width,"0");
 return (pattern||"{YEAR}-{NUMBER}")
  .replaceAll("{PREFIX}",prefix||"")
  .replaceAll("{YEAR}",String(year))
  .replaceAll("{NUMBER}",number)
  .replace(/^-+|-+$/g,"")
  .replace(/--+/g,"-");
}

export async function allocateNumber(sql:any,companyId:string,type:SequenceType,dateOrYear?:string|number|Date|null){
 const year=yearFrom(dateOrYear),def=typeDefaults(type);
 const current=await existingCurrent(sql,companyId,type,year);
 await sql`
  INSERT INTO number_sequences(company_id,sequence_type,sequence_year,start_value,current_value,prefix,number_width,format_pattern)
  VALUES(${companyId},${type},${year},1,${current},${def.prefix||null},${def.width},${def.format})
  ON CONFLICT(company_id,sequence_type,sequence_year) DO NOTHING`;
 const rows=await sql`
  UPDATE number_sequences
  SET current_value=GREATEST(current_value,start_value-1)+1,updated_at=now()
  WHERE company_id=${companyId} AND sequence_type=${type} AND sequence_year=${year}
  RETURNING current_value,start_value,prefix,number_width,format_pattern`;
 if(!rows.length)throw new Error("Nummernkreis konnte nicht aktualisiert werden.");
 const r:any=rows[0];
 return render(String(r.format_pattern||def.format),String(r.prefix||""),year,Number(r.current_value),Number(r.number_width||3))
}

export async function syncManualNumber(sql:any,companyId:string,type:SequenceType,dateOrYear:string|number|Date|null,value:string|null|undefined){
 const v=String(value||"").trim();if(!v)return;
 const year=yearFrom(dateOrYear);
 if(!v.includes(String(year)))return;
 const m=v.match(/(\d+)\s*$/);if(!m)return;
 const n=Number(m[1]);if(!Number.isFinite(n))return;
 const def=typeDefaults(type);
 await sql`
  INSERT INTO number_sequences(company_id,sequence_type,sequence_year,start_value,current_value,prefix,number_width,format_pattern)
  VALUES(${companyId},${type},${year},1,${n},${def.prefix||null},${Math.max(def.width,m[1].length)},${def.format})
  ON CONFLICT(company_id,sequence_type,sequence_year) DO UPDATE
  SET current_value=GREATEST(number_sequences.current_value,EXCLUDED.current_value),updated_at=now()`;
}
