import {AUTH_ENABLED,guestWorkspaceUser} from "@/lib/auth/mode";
import {redirect} from "next/navigation";import {getSession} from "@/lib/auth/session";import {GISHeader} from "@/components/map/GISHeader";import {GISMap} from "@/components/map/GISMap";
export default async function GISPage(){const user=AUTH_ENABLED?await getSession():guestWorkspaceUser;if(!user)redirect("/login");return <main><GISHeader user={user}/><GISMap user={user}/></main>}
