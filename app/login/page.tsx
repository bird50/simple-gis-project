import {redirect} from "next/navigation";
import {AUTH_ENABLED} from "@/lib/auth/mode";
import {Suspense} from "react";import {AuthShell} from "@/components/auth/AuthShell";import {LoginForm} from "@/components/auth/LoginForm";export default function Login(){if(!AUTH_ENABLED)redirect("/gis");return <AuthShell title="ยินดีต้อนรับกลับ" subtitle="เข้าสู่ระบบเพื่อใช้งานแผนที่และข้อมูล"><Suspense><LoginForm/></Suspense></AuthShell>}
