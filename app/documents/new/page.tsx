import {requirePageUser} from "@/lib/auth";
import DocumentBuilder from "@/components/DocumentBuilder";
export default async function NewDocument({searchParams}:{searchParams:Promise<{case_id?:string,type?:string,source_document_id?:string}>}){
 await requirePageUser(["admin","buero"]);const s=await searchParams;
 return <main className="shell"><DocumentBuilder caseId={s.case_id||""} initialType={s.type||"angebot"} sourceDocumentId={s.source_document_id||""}/></main>
}
