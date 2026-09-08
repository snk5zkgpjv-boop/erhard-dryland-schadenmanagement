import {requirePageUser} from "@/lib/auth";import DocumentBuilder from "@/components/DocumentBuilder";
export default async function EditDocument({params}:{params:Promise<{id:string}>}){await requirePageUser(["admin","buero"]);const{id}=await params;return <main className="shell"><DocumentBuilder documentId={id}/></main>}
