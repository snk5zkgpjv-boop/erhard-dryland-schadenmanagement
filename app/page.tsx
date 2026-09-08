import Dashboard from "@/components/Dashboard";
import {requirePageUser} from "@/lib/auth";
export default async function Home(){await requirePageUser();return <main className="shell"><Dashboard/></main>}
