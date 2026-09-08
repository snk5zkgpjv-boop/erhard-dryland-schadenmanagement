import Link from "next/link";import CaseDetail from "@/components/CaseDetail";
export default async function CasePage({params}:{params:Promise<{id:string}>}){const{id}=await params;return <main className="shell"><div className="topbar"><Link className="back" href="/">← Zur Übersicht</Link></div><CaseDetail id={id}/></main>}
