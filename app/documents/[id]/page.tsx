import DocumentBuilder from "@/components/DocumentBuilder";
export default async function EditDocument({params}:{params:Promise<{id:string}>}){const{id}=await params;return <main className="shell"><DocumentBuilder documentId={id}/></main>}
