import {requirePageUser} from "@/lib/auth";
import OrganizationHub from "@/components/organization/OrganizationHub";
import "./organization.css";

export default async function OrganizationPage(){
  const user=await requirePageUser(["admin"]);
  return <main className="orgShell"><OrganizationHub displayName={user.display_name}/></main>;
}
