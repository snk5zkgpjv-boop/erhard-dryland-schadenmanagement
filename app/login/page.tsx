import {Suspense} from "react";import LoginForm from "@/components/LoginForm";
export default function Login(){return <main className="authShell"><Suspense><LoginForm/></Suspense></main>}
