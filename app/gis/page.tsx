import {redirect} from "next/navigation";import {getSession} from "@/lib/auth/session";import {GISHeader} from "@/components/map/GISHeader";import {GISMap} from "@/components/map/GISMap";
export default async function GISPage(){const user=await getSession();if(!user)redirect("/login");return <main><GISHeader user={user}/><GISMap user={user}/></main>}
