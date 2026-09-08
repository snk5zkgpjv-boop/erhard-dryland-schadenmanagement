import DocumentBuilder from "@/components/DocumentBuilder";
export default async function NewDocument({searchParams}:{searchParams:Promise<{case_id?:string}>}){const s=await searchParams;return <main className="shell"><DocumentBuilder caseId={s.case_id||""}/></main>}
