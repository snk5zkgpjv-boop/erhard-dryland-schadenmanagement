import {requirePageUser} from "@/lib/auth";
import Link from "next/link";
import CaseDetail from "@/components/CaseDetail";
import WorkflowPanel from "@/components/WorkflowPanel";

export default async function CasePage({params}:{params:Promise<{id:string}>}){
 await requirePageUser();const{id}=await params;
 return <main className="shell">
  <div className="topbar"><Link className="back" href="/">← Zur Übersicht</Link></div>
  <WorkflowPanel caseId={id}/>
  <CaseDetail id={id}/>
 </main>
}
