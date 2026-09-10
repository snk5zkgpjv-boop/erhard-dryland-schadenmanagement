import {requirePageUser} from "@/lib/auth";
import OrganizationHub from "@/components/organization/OrganizationHub";
import type {Metadata} from "next";
import "./organization.css";

export const metadata:Metadata={
  icons:{
    icon:[{url:"/organization-app-icon.png",type:"image/png",sizes:"1024x1024"}],
    apple:[{url:"/organization-app-icon.png",type:"image/png",sizes:"1024x1024"}]
  }
};

export default async function OrganizationPage(){
  const user=await requirePageUser(["admin"]);
  return <main className="orgShell"><OrganizationHub displayName={user.display_name}/></main>;
}
