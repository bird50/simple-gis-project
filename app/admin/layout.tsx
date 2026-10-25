import {redirect} from "next/navigation";
import {AUTH_ENABLED} from "@/lib/auth/mode";
import {AdminShell} from "@/components/admin/AdminShell";
/** Admin pages read the session and live data on every request; never prerender them. */
export const dynamic="force-dynamic";export default function Layout({children}:{children:React.ReactNode}){if(!AUTH_ENABLED)redirect("/gis");return <AdminShell>{children}</AdminShell>}
